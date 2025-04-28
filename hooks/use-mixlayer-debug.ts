import { produce, WritableDraft } from 'immer';
import { useEffect, useReducer, useRef } from 'react';
import SSE, { connectMxlDbgStream } from '@/lib/sse'; // Assuming connectStream exists and works similarly
import { RunState } from '@/lib/utils'; // Reusing RunState enum

const DEBUG_URL = 'http://localhost:8484/_mxldbg'; // Assuming this is the correct URL

// --- State Interfaces ---

export interface SeqChunk {
  ts: number;
  chunk: string;
  hidden?: boolean;
  cmd_id?: string;
}

export interface Seq {
  id: string;
  chunks: SeqChunk[];
  isOpen: boolean;
  openTs: number | null;
  closeTs: number | null;
}

export interface HttpServerRequest {
  id: string;
  url: string;
  method: string;
  startTs: number;
  status: number | null; // HTTP status code
  finishTs: number | null; // Timestamp when wasm_http_request_finish is received
  responseSentTs: number | null; // Timestamp when wasm_http_response_sent is received
  seqs: { [seqId: string]: Seq };
}

export interface MixlayerDebugState {
  runState: RunState;
  requests: { [reqId: string]: HttpServerRequest };
  sseChannel: SSE | null;
  error: string | null;
}

// --- SSE Event Interfaces (based on sample data) ---

interface BaseSseEvent {
  event_type: string;
  ts: number;
  req_id: string;
}

interface WasmHttpRequestStartEvent extends BaseSseEvent {
  event_type: 'wasm_http';
  event_subtype: 'wasm_http_request_start';
  url: string;
  method: string;
}

interface WasmHttpResponseSentEvent extends BaseSseEvent {
  event_type: 'wasm_http';
  event_subtype: 'wasm_http_response_sent';
  status: number;
}

interface WasmHttpRequestFinishEvent extends BaseSseEvent {
  event_type: 'wasm_http';
  event_subtype: 'wasm_http_request_finish';
}

interface SeqBaseEvent extends BaseSseEvent {
  event_type: 'seq';
  seq_id: string;
}

interface SeqOpenEvent extends SeqBaseEvent {
  event_subtype: 'seq_open';
}

interface SeqCloseEvent extends SeqBaseEvent {
  event_subtype: 'seq_close'; // Assuming a close event exists
}

interface SeqChunkEvent extends SeqBaseEvent {
  event_subtype: 'seq_chunk';
  cmd_id?: string; // Optional based on sample
  chunk: string;
  hidden?: boolean; // Optional based on sample
}

type SseDebugEvent =
  | WasmHttpRequestStartEvent
  | WasmHttpResponseSentEvent
  | WasmHttpRequestFinishEvent
  | SeqOpenEvent
  | SeqCloseEvent // Assuming
  | SeqChunkEvent;

// --- Reducer Actions ---

type MixlayerDebugAction =
  | { type: 'CONNECTING' }
  | { type: 'CONNECTED'; sseChannel: SSE }
  | { type: 'DISCONNECTED' }
  | { type: 'RECEIVE_EVENT'; event: SseDebugEvent }
  | { type: 'ERROR'; message: string }
  | { type: 'CLEAR' };

// --- Utility Functions ---

function findOrCreateRequest(
  draft: WritableDraft<MixlayerDebugState>,
  reqId: string,
): WritableDraft<HttpServerRequest> {
  if (!draft.requests[reqId]) {
    // If a seq event arrives before the corresponding request start, create a placeholder
    console.warn(`Creating placeholder request for req_id: ${reqId}`);
    draft.requests[reqId] = {
      id: reqId,
      url: 'Unknown',
      method: 'Unknown',
      startTs: Date.now(), // Use current time as an approximation
      status: null,
      finishTs: null,
      responseSentTs: null,
      seqs: {},
    };
  }
  return draft.requests[reqId];
}

function findOrCreateSeq(
  request: WritableDraft<HttpServerRequest>,
  seqId: string,
): WritableDraft<Seq> {
  if (!request.seqs[seqId]) {
    // If a chunk arrives before the corresponding seq open, create a placeholder
    console.warn(
      `Creating placeholder seq for req_id: ${request.id}, seq_id: ${seqId}`,
    );
    request.seqs[seqId] = {
      id: seqId,
      chunks: [],
      isOpen: false, // Mark as not officially open yet
      openTs: null,
      closeTs: null,
    };
  }
  return request.seqs[seqId];
}

// --- Reducer ---

function mixlayerDebugReducer(
  state: MixlayerDebugState,
  action: MixlayerDebugAction,
): MixlayerDebugState {
  return produce(state, (draft) => {
    switch (action.type) {
      case 'CONNECTING':
        draft.runState = RunState.Connecting;
        draft.error = null;
        // Keep existing requests on reconnect attempt
        break;
      case 'CONNECTED':
        draft.runState = RunState.Generating; // Or Ready/Streaming? Using Generating analogous to useAppClient
        draft.sseChannel = action.sseChannel;
        draft.error = null;
        break;
      case 'DISCONNECTED':
        draft.runState = RunState.Ready;
        if (draft.sseChannel) {
          draft.sseChannel.close(); // Ensure SSE is closed
        }
        draft.sseChannel = null;
        // Clear error on clean disconnect
        // draft.error = null; // Don't clear error if disconnected due to one
        break;
      case 'ERROR':
        draft.runState = RunState.Error;
        draft.error = action.message;
        if (draft.sseChannel) {
          draft.sseChannel.close();
        }
        draft.sseChannel = null;
        break;
      case 'CLEAR':
        draft.requests = {};
        draft.error = null;
        // If connected, potentially keep runState as Generating? Or Ready?
        // Assuming CLEAR means stop and reset everything.
        if (draft.sseChannel) {
          draft.sseChannel.close();
        }
        draft.sseChannel = null;
        draft.runState = RunState.Ready;
        break;

      case 'RECEIVE_EVENT':
        const event = action.event;
        const reqId = event.req_id;

        switch (event.event_type) {
          case 'wasm_http': {
            const request = findOrCreateRequest(draft, reqId);
            switch (event.event_subtype) {
              case 'wasm_http_request_start':
                // Overwrite placeholder if it exists, or update existing
                request.id = reqId; // Ensure reqId is set if placeholder
                request.url = event.url;
                request.method = event.method;
                request.startTs = event.ts;
                request.status = null; // Reset status on new request start?
                request.finishTs = null;
                request.responseSentTs = null;
                // Should we clear seqs? Assuming a req_id might be reused, but unlikely.
                // request.seqs = {};
                break;
              case 'wasm_http_response_sent':
                request.status = event.status;
                request.responseSentTs = event.ts;
                break;
              case 'wasm_http_request_finish':
                request.finishTs = event.ts;
                // Potentially close any open seqs associated with this request?
                // Object.values(request.seqs).forEach(seq => {
                //    if (seq.isOpen) {
                //        seq.isOpen = false;
                //        seq.closeTs = event.ts; // Mark close time
                //    }
                // });
                break;
            }
            break;
          }
          case 'seq': {
            const request = findOrCreateRequest(draft, reqId);
            const seq = findOrCreateSeq(request, event.seq_id);
            switch (event.event_subtype) {
              case 'seq_open':
                seq.id = event.seq_id; // Ensure seqId is set if placeholder
                seq.isOpen = true;
                seq.openTs = event.ts;
                seq.closeTs = null; // Reset close time if re-opened
                // seq.chunks = []; // Clear chunks on re-open? Assuming seq_id is unique per request.
                break;
              case 'seq_chunk':
                seq.chunks.push({
                  ts: event.ts,
                  chunk: event.chunk,
                  hidden: event.hidden,
                  cmd_id: event.cmd_id,
                });
                break;
              case 'seq_close': // Assuming this event exists
                seq.isOpen = false;
                seq.closeTs = event.ts;
                break;
            }
            break;
          }
          default:
            console.warn('Received unknown event type:', event);
        }
        break; // End of RECEIVE_EVENT
    }
  });
}

// --- Hook ---

export interface UseMixlayerDebug {
  state: MixlayerDebugState;
  connect: () => void;
  disconnect: () => void;
  clear: () => void;
}

export function useMixlayerDebug(): UseMixlayerDebug {
  const [state, dispatch] = useReducer(mixlayerDebugReducer, {
    runState: RunState.Ready,
    requests: {},
    sseChannel: null,
    error: null,
  });

  // Ref to track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const connect = () => {
    if (
      state.runState !== RunState.Ready &&
      state.runState !== RunState.Error
    ) {
      console.warn('Connection already in progress or established.');
      return;
    }

    dispatch({ type: 'CONNECTING' });

    try {
      // Using connectStream similar to useAppClient
      // Assuming connectStream takes URL, body (null here?), and callback
      const sse = connectMxlDbgStream(DEBUG_URL, null, (eventData) => {
        if (!isMounted.current) return; // Don't process if unmounted

        // Basic validation
        if (eventData.event_type && eventData.req_id && eventData.ts) {
          dispatch({
            type: 'RECEIVE_EVENT',
            event: eventData as SseDebugEvent,
          });
        } else {
          console.warn('Received malformed event:', eventData);
        }
      });

      // Handle SSE connection errors (onerror) and closure (onclose)
      // sse.onerror = (err) => {
      //   console.error('SSE Connection Error:', err);
      //   if (isMounted.current) {
      //     dispatch({
      //       type: 'ERROR',
      //       message: `SSE Connection Error: ${err instanceof Error ? err.message : 'Unknown Error'}`,
      //     });
      //   }
      // };

      // `onclose` might be called on manual close too, reducer handles state update
      // sse.onclose = () => {
      //     if (isMounted.current && state.runState !== RunState.Ready) { // Only dispatch if not manually disconnected
      //          console.log("SSE Connection Closed Unexpectedly");
      //         dispatch({ type: 'ERROR', message: 'SSE Connection Closed Unexpectedly' });
      //      }
      // };

      if (isMounted.current) {
        dispatch({ type: 'CONNECTED', sseChannel: sse });
      } else {
        // If component unmounted between connect call and here, close the connection
        sse.close();
      }
    } catch (error) {
      console.error('Failed to initiate SSE connection:', error);
      if (isMounted.current) {
        dispatch({
          type: 'ERROR',
          message: `Failed to connect: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }
  };

  const disconnect = () => {
    if (state.sseChannel) {
      state.sseChannel.close(); // This should trigger onclose eventually
    }
    // Dispatch regardless of channel existence to ensure state is Ready
    dispatch({ type: 'DISCONNECTED' });
  };

  const clear = () => {
    dispatch({ type: 'CLEAR' });
  };

  // Cleanup effect to disconnect on unmount
  useEffect(() => {
    return () => {
      // isMounted ref handles preventing state updates,
      // but we still need to ensure the SSE connection is closed.
      if (state.sseChannel) {
        console.log('Closing SSE connection on unmount');
        state.sseChannel.close();
      }
    };
  }, [state.sseChannel]); // Re-run if sseChannel changes (e.g., reconnect)

  return {
    state,
    connect,
    disconnect,
    clear,
  };
}
