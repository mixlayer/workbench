import { useCallback, useEffect, useState } from 'react';
import { ChatMessages } from './chat-messages';
import { InputBox } from './input-box';
import { appRequest } from '@/lib/eventsource';
import { MxlChat, MxlChatTurn } from '@/lib/request';
import { OutputPart, RunState } from '@/lib/utils';
import { EventSourceClient } from 'eventsource-client';

function messagesJson(chat: MxlChat) {
  return chat.turns.flatMap((t) => {
    return [
      {
        role: 'user',
        text: t.message.content,
      },
      {
        role: 'assistant',
        text: t.reply.content,
      },
    ];
  });
}

export function WorkbenchChat() {
  const [currentChat, setCurrentChat] = useState<MxlChat>({
    name: 'Chat',
    turns: [],
    runState: RunState.Ready,
  });

  const [currentTurn, setCurrentTurn] = useState<MxlChatTurn | null>(null);
  const [sse, setSse] = useState<EventSourceClient | null>(null);
  const [chatMessagesDiv, setChatMessagesDiv] = useState<HTMLDivElement | null>(
    null,
  );
  const [autoscroll, setAutoscroll] = useState(true);

  const onOutput = useCallback(
    (part: OutputPart) => {
      console.log('onOutput called with part:', part);
      setCurrentTurn((prev) => {
        if (!prev) {
          return null;
        }

        if (part.type === 'text') {
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
    },
    [setCurrentTurn],
  );

  const onStateChange = useCallback(
    (state: RunState) => {
      // if (state === RunState.Ready || state === RunState.Error) {
      //   console.log('turn finished', currentTurn);
      // }

      setCurrentChat((prev) => ({
        ...prev,
        runState: state,
      }));
    },
    [setCurrentChat],
  );

  const onSendClick = useCallback(
    (message: string) => {
      const messages = messagesJson(currentChat);

      messages.push({
        role: 'user',
        text: message,
      });

      const turn = {
        requestId: '1',
        message: {
          role: 'user',
          content: message,
        },
        reply: {
          role: 'assistant',
          content: '',
        },
      };

      console.log('setting current turn: ', turn);
      setCurrentTurn(turn);

      const sse = appRequest(
        'http://localhost:8484/',
        { messages },
        onOutput,
        onStateChange,
      );

      setSse(sse);
    },
    [setSse, setCurrentTurn, currentChat, onOutput, onStateChange],
  );

  const onStopClick = useCallback(() => {
    if (sse) {
      sse.close();
    }

    setCurrentChat((prev) => ({
      ...prev,
      runState: RunState.Ready,
    }));
  }, [sse, setCurrentChat]);

  useEffect(() => {
    if (!chatMessagesDiv || !autoscroll) return;

    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
  }, [chatMessagesDiv, currentTurn, autoscroll]);

  useEffect(() => {
    if (!chatMessagesDiv) return;

    const handleScroll = () => {
      // Calculate if user is at bottom (with small threshold)
      const distanceFromBottom =
        chatMessagesDiv.scrollHeight -
        chatMessagesDiv.scrollTop -
        chatMessagesDiv.clientHeight;

      const isAtBottom = distanceFromBottom < 10;

      setAutoscroll(isAtBottom);
    };

    chatMessagesDiv.addEventListener('scroll', handleScroll);

    return () => {
      chatMessagesDiv.removeEventListener('scroll', handleScroll);
    };
  }, [chatMessagesDiv]);

  useEffect(() => {
    if (
      currentChat.runState === RunState.Ready ||
      currentChat.runState === RunState.Error
    ) {
      console.log('turn finished', currentTurn);

      if (currentChat && currentTurn) {
        const nextChat = {
          ...currentChat,
          turns: [...currentChat.turns, currentTurn],
        };

        setCurrentChat(nextChat);
        setCurrentTurn(null);
      }
    }
  }, [currentChat.runState, currentTurn, currentChat]);

  return (
    <div className="w-full h-full flex justify-center">
      <div className="w-full h-full max-w-[640px] flex flex-col">
        <div
          className="flex-1 flex flex-col mx-4 pt-3 overflow-scroll min-h-0 max-h-[calc(100vh-var(--input-min-height)-110px)]"
          ref={setChatMessagesDiv}
        >
          <ChatMessages chat={currentChat} currentTurn={currentTurn} />
        </div>
        <div className="flex-none pb-4 pt-4">
          <InputBox
            runState={currentChat.runState}
            onSendClick={onSendClick}
            onStopClick={onStopClick}
          />
        </div>
      </div>
    </div>
  );
}
