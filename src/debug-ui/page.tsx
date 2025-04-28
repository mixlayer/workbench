import { Sidebar } from './req-sidebar';
import { SeqList } from './seq-list';
import { useEffect, useState } from 'react';
import { SeqTokens } from './tokens';
import {
  HttpServerRequest,
  Seq,
  useMixlayerDebug,
} from '@/hooks/use-mixlayer-debug';

export default function DebugUI() {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );

  const [selectedSeqId, setSelectedSeqId] = useState<string | null>(null);

  const { state, connect } = useMixlayerDebug();

  const selectedRequest: HttpServerRequest | null = selectedRequestId
    ? state.requests[selectedRequestId]
    : null;

  const selectedSeq: Seq | null = selectedSeqId
    ? selectedRequest?.seqs[selectedSeqId] || null
    : null;

  useEffect(() => {
    if (!state.sseChannel) {
      connect();
    }
  }, []);

  // auto-select first request if no request is selected
  useEffect(() => {
    const reqIds = Object.keys(state.requests);

    if (!selectedRequest && reqIds.length > 0) {
      setSelectedRequestId(reqIds[0]);
    }
  }, [state.requests, selectedRequest]);

  // auto-select first seq if no seq selected
  useEffect(() => {
    if (selectedRequest && !selectedSeqId) {
      const req = selectedRequest;
      const firstSeq = Object.values(req.seqs)[0];
      if (firstSeq) {
        setSelectedSeqId(firstSeq.id);
      }
    }
  }, [selectedRequest, selectedSeqId]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        requests={Object.values(state.requests)}
        selectedRequestId={selectedRequestId}
        onSelectRequest={setSelectedRequestId}
      />

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <SeqList
          seqs={
            selectedRequest?.seqs ? Object.values(selectedRequest.seqs) : []
          }
          selectedSeqId={selectedSeqId}
          onSelectSeq={setSelectedSeqId}
        />

        <SeqTokens seq={selectedSeq} />
      </div>
    </div>
  );
}
