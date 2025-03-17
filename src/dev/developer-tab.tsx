import { useCallback, useState, useRef, useEffect } from 'react';
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

const RUN_URL = 'http://localhost:8484/';

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
    setChats((prev) => [
      ...prev,
      {
        id: uuidv4(),
        name: 'Untitled Chat',
        runState: RunState.Ready,
        turns: [],
      },
    ]);
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

      const sse = connect(
        RUN_URL,
        {
          showHidden: true,
          params: {
            messages,
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
    [chats, sseChannel, clearOutput, onSseStreamFrame, appendOutputToChatTurn],
  );

  const sendModelRequest = useCallback(() => {
    if (sseChannel !== null) {
      //TODO toast an error
      console.error('request already in progress');
      return;
    }

    clearOutput();
    setRunState(RunState.Generating);

    const sse = connect(
      RUN_URL,
      {
        showHidden: true,
      },
      onSseStreamFrame,
      (error) => {
        setRunState(RunState.Error);
        console.error(error);
      },
    );

    setSseChannel(sse);
  }, [sseChannel]);

  return (
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
            <SplittableOutputPane
              outputParts={outputParts}
              streams={streams}
              chats={chats}
              currentChatTurn={currentChatTurn}
              onNewChatClick={onNewChatClick}
              onChatSendClick={sendChatMessage}
            />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

function SolidPlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
    >
      <path
        fillRule="evenodd"
        d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SolidStopIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
    >
      <path
        fillRule="evenodd"
        d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function RunStateLabel(props: { state: RunState }) {
  let dotCls = '';
  let textCls = '';
  let text = '';

  switch (props.state) {
    case RunState.Ready:
      textCls = 'text-gray-800';
      dotCls = 'bg-green-500';
      text = 'Ready';
      break;
    case RunState.Generating:
      textCls =
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      dotCls = 'animate-pulse bg-green-500';
      text = 'Running';
      break;
    case RunState.Error:
      textCls = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      dotCls = 'bg-red-500';
      text = 'Error';
      break;
    default:
      throw 'unreachable';
  }

  return (
    <span
      className={`inline-flex items-center ${textCls} rounded-sm px-2.5 py-0.5 text-xs font-medium min-w-22`}
    >
      <span className={`me-2 h-2 w-2 ${dotCls} rounded-sm`}></span>
      <span className="inline-block">{text}</span>
    </span>
  );
}

export function RunStopButton(props: {
  className?: string;
  runState: RunState;
  onRunClick?: () => void;
  onStopClick?: () => void;
}) {
  if (props.runState == RunState.Generating) {
    return (
      <Button onClick={props.onStopClick} size="sm">
        <SolidStopIcon />
        <div className="inline-block pr-1">Stop</div>
      </Button>
    );
  } else {
    return (
      <Button onClick={props.onRunClick} size="sm" variant="outline">
        <SolidPlayIcon />
        <div className="inline-block pr-1">Run</div>
      </Button>
    );
  }
}
