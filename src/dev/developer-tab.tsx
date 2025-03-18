import {
  useCallback,
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
} from 'react';
import { ParamsEditorPane } from './params-pane';
import {
  ErrorOutputPart,
  OutputPart,
  RunState,
  TextOutputPart,
} from '@/lib/utils';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { EraserIcon } from 'lucide-react';
import { SplittableOutputPane } from './splittable';
import SSE, { connect } from '@/lib/sse';
import { Console } from './console';
import { chatMessagesJson, MxlChat, MxlChatTurn } from '@/lib/request';
import { v4 as uuidv4 } from 'uuid';
import { RunStateLabel } from '@/components/ui/run-state-label';
import { RunStopButton } from '@/components/ui/run-stop-button';

const RUN_URL = 'http://localhost:8484/';

export interface MixlayerClientContextState {
  runState: RunState;
  outputParts: OutputPart[];
  streams: string[];
  consoleOutput: string;
  chats: MxlChat[];
  currentChatTurn: MxlChatTurn | null;
  sendChatMessage: (chatId: string, message: string) => void;
  createNewChat: () => string;
  renameChat: (chatId: string, name: string) => void;
  stopRequest: () => void;
}

export const MixlayerClientContext = createContext<MixlayerClientContextState>(
  null!,
);

//TODO state management here is a mess, need to refactor
export function DeveloperTab(props: { className?: string }) {
  const [params, setParams] = useState('{\n}');
  const [runState, setRunState] = useState(RunState.Ready);
  const [outputParts, setOutputParts] = useState<OutputPart[]>([]);
  const [streams, setStreams] = useState<string[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [sseChannel, setSseChannel] = useState<SSE | null>(null);
  const [chats, setChats] = useState<MxlChat[]>([]);
  const [currentChatTurn, setCurrentChatTurn] = useState<MxlChatTurn | null>(
    null,
  );

  // Add a ref to track the latest currentChatTurn
  const currentChatTurnRef = useRef<MxlChatTurn | null>(null);

  // Keep the ref in sync with the state
  useEffect(() => {
    currentChatTurnRef.current = currentChatTurn;
  }, [currentChatTurn]);

  // Move clearOutput declaration before it's used
  const clearOutput = useCallback(() => {
    setStreams([]);
    setOutputParts([]);
    setConsoleOutput('');
  }, []);

  const onNewChatClick = useCallback(() => {
    const id = uuidv4();
    setChats((prev) => [
      ...prev,
      {
        id,
        name: 'Untitled Chat',
        runState: RunState.Ready,
        turns: [],
      },
    ]);

    return id;
  }, []);

  const onSseStreamFrame = useCallback(
    (reply: any, done: boolean): OutputPart | null => {
      if (done) {
        setRunState(RunState.Ready);
        setSseChannel(null);
      }

      if (reply.stream !== undefined) {
        setStreams((prev) => {
          const stream = reply.stream + '';
          if (prev.indexOf(stream) === -1) {
            return [...prev, stream];
          }
          return prev;
        });
      }

      if (
        reply.event &&
        (reply.event === 'sys.stdout' || reply.event === 'sys.stderr')
      ) {
        setConsoleOutput((prev) => prev + reply.text);
        return null;
      }

      if (reply.error) {
        let nextOutputPart = {
          message: reply.error as string,
          type: 'error',
          stream: reply.stream + '',
        } as ErrorOutputPart;
        setOutputParts((prev) => [...prev, nextOutputPart]);
        return nextOutputPart;
      } else if (reply.text) {
        let nextOutputPart = {
          text: reply.text as string,
          hidden: reply.hidden as boolean,
          stream: reply.stream + '',
          type: 'text',
        } as TextOutputPart;
        setOutputParts((prev) => [...prev, nextOutputPart]);
        return nextOutputPart;
      } else {
        return null;
      }
    },
    [setStreams, setOutputParts, setConsoleOutput, setRunState, setSseChannel],
  );

  const appendOutputToChatTurn = useCallback(
    (part: OutputPart | null, done: boolean) => {
      console.log(
        'appendOutputToChatTurn, done = ',
        done,
        currentChatTurnRef.current,
      );

      // Use the ref to access the latest value
      if (done && currentChatTurnRef.current) {
        currentChatTurnRef.current.reply.content +=
          part?.type === 'text' ? part.text : '';

        const currentChat = chats.find(
          (chat) => chat.id === currentChatTurnRef.current!.chatId,
        );

        if (currentChat) {
          const nextChat = {
            ...currentChat,
            turns: [...currentChat.turns, currentChatTurnRef.current!],
          };

          console.log('nextChat = ', nextChat);

          setChats((prevChats) => {
            const otherChats = prevChats.filter(
              (chat) => chat.id !== currentChat.id,
            );
            console.log('nextChat = ', nextChat);
            return [...otherChats, nextChat];
          });

          setCurrentChatTurn(null);

          console.log('appending to chat', currentChat.id);
        } else {
          console.error('chat not found when appending turn');
        }

        return;
      }

      if (part !== null) {
        setCurrentChatTurn((prev) => {
          if (!prev) {
            return null;
          }

          if (part.type === 'text' && !part.hidden) {
            console.log(`appending ${part.text}`);
            return {
              ...prev,
              reply: {
                ...prev.reply,
                content: prev.reply.content + part.text,
              },
            };
          } else {
            return prev;
          }
        });
      }
    },
    [chats], // Keep only chats in the dependency array
  );

  const sendChatMessage = useCallback(
    (chatId: string, message: string) => {
      console.log('onChatSendClick', chatId, message);

      if (sseChannel !== null) {
        //TODO toast an error
        console.error('request already in progress');
        return;
      }

      clearOutput();

      const chat = chats.find((chat) => chat.id === chatId);

      if (!chat) {
        console.error('chat not found');
        return;
      }

      const messages = chatMessagesJson(chat);
      messages.push({
        role: 'user',
        text: message,
      });

      const turn = {
        requestId: '1',
        chatId: chat.id,
        message: {
          role: 'user',
          content: message,
        },
        reply: {
          role: 'assistant',
          content: '',
        },
      };

      setRunState(RunState.Generating);
      setCurrentChatTurn(turn);
      // The ref will be updated via the useEffect

      const paramsJson = JSON.parse(params);

      if (typeof paramsJson !== 'object') {
        throw new Error('params must be an object');
      }

      const sse = connect(
        RUN_URL,
        {
          showHidden: true,
          params: {
            messages,
            ...paramsJson,
          },
        },
        (part, done) => {
          console.log('onSseStreamFrame, done = ', done);
          let outputPart = onSseStreamFrame(part, done);
          appendOutputToChatTurn(outputPart, done);
        },
        (error) => {
          setRunState(RunState.Error);
          console.error(error);
        },
      );

      setSseChannel(sse);
    },
    [
      chats,
      params,
      sseChannel,
      clearOutput,
      onSseStreamFrame,
      appendOutputToChatTurn,
    ],
  );

  const sendModelRequest = useCallback(() => {
    if (sseChannel !== null) {
      //TODO toast an error
      console.error('request already in progress');
      return;
    }

    clearOutput();
    setRunState(RunState.Generating);

    const paramsJson = params === '' ? {} : JSON.parse(params);

    if (typeof paramsJson !== 'object') {
      throw new Error('params must be an object');
    }

    const sse = connect(
      RUN_URL,
      {
        showHidden: true,
        params: paramsJson,
      },
      onSseStreamFrame,
      (error) => {
        setRunState(RunState.Error);
        console.error(error);
      },
    );

    setSseChannel(sse);
  }, [params, sseChannel]);

  return (
    <MixlayerClientContext.Provider
      value={{
        runState,
        outputParts,
        streams,
        consoleOutput,
        chats,
        currentChatTurn,
        sendChatMessage,
        createNewChat: onNewChatClick,
        stopRequest: () => {
          sseChannel?.close();
          setSseChannel(null);
          setRunState(RunState.Ready);
        },
        renameChat: (chatId: string, name: string) => {
          setChats((prevChats) =>
            prevChats.map((chat) =>
              chat.id === chatId ? { ...chat, name } : chat,
            ),
          );
        },
      }}
    >
      <div className={`flex w-full h-full ${props.className}`}>
        <div className="flex-1 bg-gray-50 py-1 pr-1">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={40} className="p-0.5 pr-1">
              <div className="pl-1 w-full h-full flex flex-col space-y-1">
                <div className="flex space-x-1">
                  <RunStateLabel state={runState} />
                  <div className="flex-1"></div>
                  <RunStopButton
                    runState={runState}
                    onRunClick={sendModelRequest}
                    onStopClick={() => {
                      sseChannel?.close();
                      setRunState(RunState.Ready);
                    }}
                  />
                  <Button onClick={clearOutput} size="sm" variant="outline">
                    <EraserIcon /> Clear
                  </Button>
                </div>
                <PanelGroup direction="vertical">
                  <Panel
                    defaultSize={75}
                    className="rounded-xs bg-zinc-700 border border-gray-700"
                  >
                    <Console output={consoleOutput} />
                  </Panel>
                  <PanelResizeHandle className="py-0.5" />
                  <Panel>
                    <div className="rounded-xs border border-gray-200 h-full w-full">
                      <ParamsEditorPane params={params} setParams={setParams} />
                    </div>
                  </Panel>
                </PanelGroup>
              </div>
            </Panel>
            <PanelResizeHandle />
            <Panel>
              <SplittableOutputPane />
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </MixlayerClientContext.Provider>
  );
}

export const useMxlClientContext = () => useContext(MixlayerClientContext);
