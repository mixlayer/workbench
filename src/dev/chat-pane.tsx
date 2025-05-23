import { OverlayDropdownMenu } from './overlay-menu';
import { SplitDirection } from './splittable';
import { InputBox } from '../chat/input-box';
import { ChatMessages } from '../chat/chat-messages';
import { MxlChat } from '@/lib/request';
import { useEffect, useRef, useState } from 'react';
import { useAppClientState } from './developer-tab';

export function ChatPane(props: {
  onSplitClick: (direction: SplitDirection) => void;
  onCloseClick?: () => void;
  onChatClick: (chatId: string) => void;
  onStreamClick: (streamId: string) => void;
  chatId: string;
}) {
  const chatMessagesDiv = useRef<HTMLDivElement>(null);
  const [autoscroll, setAutoscroll] = useState(true);

  const {
    state: { runState, chats, response },
    createNewChat,
    sendChatMessage,
    stopRequest,
    renameChat,
  } = useAppClientState();

  const { chatTurn: currentChatTurn } = response || {
    currentChatTurn: null,
  };

  useEffect(() => {
    if (!chatMessagesDiv.current || !autoscroll) return;

    chatMessagesDiv.current.scrollTop = chatMessagesDiv.current.scrollHeight;
  }, [chatMessagesDiv.current, currentChatTurn, autoscroll]);

  useEffect(() => {
    if (!chatMessagesDiv.current) return;

    const div = chatMessagesDiv.current;

    const handleScroll = () => {
      if (!div) return;

      // Calculate if user is at bottom (with small threshold)
      const distanceFromBottom =
        div.scrollHeight - div.scrollTop - div.clientHeight;
      const isAtBottom = distanceFromBottom < 10;
      setAutoscroll(isAtBottom);
    };

    div.addEventListener('scroll', handleScroll);

    return () => {
      div.removeEventListener('scroll', handleScroll);
    };
  }, [chatMessagesDiv]);

  const chat = chats.find((chat) => chat.id === props.chatId);
  let chatTurn = null;

  if (currentChatTurn && currentChatTurn.chatId == props.chatId) {
    chatTurn = currentChatTurn;
  }

  if (!chat) {
    return <div>chat not found</div>;
  }

  return (
    <div className="relative h-full bg-white border border-gray-200 rounded-sm">
      <div className="absolute top-2 right-2 z-10">
        <OverlayDropdownMenu
          streams={response?.streams || []}
          showHiddenTokens={false}
          chats={chats}
          onNewChatClick={() => createNewChat(null)}
          {...props}
        />
      </div>

      <div
        ref={chatMessagesDiv}
        className="h-full w-full overflow-y-auto mx-auto"
      >
        <ChatMessages
          chat={chat}
          currentTurn={chatTurn}
          className="pb-[165px]"
          turnClassName="px-2 max-w-[640px] mx-auto"
        />
      </div>

      <div className="absolute w-full bottom-3 px-3">
        <InputBox
          onSendClick={(message) => {
            sendChatMessage(chat.id, message);
          }}
          onStopClick={stopRequest}
          runState={runState}
          chat={chat}
          renameChat={renameChat}
        />
      </div>
    </div>
  );
}
