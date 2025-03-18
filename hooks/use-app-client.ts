import { chatMessagesJson, MxlChat, MxlChatTurn } from '@/lib/request';
import SSE, { connect } from '@/lib/sse';
import {
  ErrorOutputPart,
  OutputPart,
  RunState,
  TextOutputPart,
} from '@/lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const RUN_URL = 'http://localhost:8484/';

export interface AppClientState {
  runState: RunState;
  outputParts: OutputPart[];
  streams: string[];
  consoleOutput: string;
  chats: MxlChat[];
  currentChatTurn: MxlChatTurn | null;
  params: string;
  clearOutput: () => void;
  setParams: (params: string) => void;
  sendRequest: () => void;
  sendChatMessage: (chatId: string, message: string) => void;
  createNewChat: () => string;
  renameChat: (chatId: string, name: string) => void;
  stopRequest: () => void;
}

// A hook used to manage state for a client that
// communicates with a Mixlayer app.
export function useAppClient(): AppClientState {
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

  const createNewChat = useCallback(() => {
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

  const sendRequest = useCallback(() => {
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

  const stopRequest = useCallback(() => {
    sseChannel?.close();
    setSseChannel(null);
    setRunState(RunState.Ready);
  }, [sseChannel]);

  const renameChat = useCallback(
    (chatId: string, name: string) => {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId ? { ...chat, name } : chat,
        ),
      );
    },
    [chats],
  );

  return {
    runState,
    outputParts,
    streams,
    consoleOutput,
    chats,
    currentChatTurn,
    params,
    clearOutput,
    setParams,
    sendRequest,
    sendChatMessage,
    createNewChat,
    renameChat,
    stopRequest,
  };
}
