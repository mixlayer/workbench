import { OutputPart, RunState } from '@/lib/utils';
import { OverlayDropdownMenu } from './overlay-menu';
import { SplitDirection } from './splittable';
import { InputBox } from '../chat/input-box';
import { ChatMessages } from '../chat/chat-messages';
import { MxlChat, MxlChatTurn } from '@/lib/request';
import { useEffect, useRef, useState } from 'react';

export function ChatPane(props: {
  runState: RunState;
  outputParts: OutputPart[];
  onSplitClick: (direction: SplitDirection) => void;
  onOutputClearClick: () => void;
  onCloseClick?: () => void;
  onNewChatClick: () => void;
  onChatClick: (chat: MxlChat) => void;
  onChatSendClick: (chatId: string, message: string) => void;
  chats: MxlChat[];
  chatId: string;
  currentTurn: MxlChatTurn | null;
}) {
  const chatMessagesDiv = useRef<HTMLDivElement>(null);
  const [autoscroll, setAutoscroll] = useState(true);

  useEffect(() => {
    if (!chatMessagesDiv.current || !autoscroll) return;

    chatMessagesDiv.current.scrollTop = chatMessagesDiv.current.scrollHeight;
  }, [chatMessagesDiv.current, props.currentTurn, autoscroll]);

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

  const chat = props.chats.find((chat) => chat.id === props.chatId);
  let chatTurn = null;

  if (props.currentTurn && props.currentTurn.chatId == props.chatId) {
    chatTurn = props.currentTurn;
  }

  if (!chat) {
    return <div>chat not found</div>;
  }

  return (
    <div className="relative h-full bg-white border border-gray-200 rounded-sm">
      <div className="absolute top-2 right-2 z-10">
        <OverlayDropdownMenu
          streams={[]}
          selectedStream={''}
          showHiddenTokens={false}
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
            props.onChatSendClick(chat.id, message);
          }}
          onStopClick={function (): void {
            throw new Error('Function not implemented.');
          }}
          runState={props.runState}
        />
      </div>
    </div>
  );
}
