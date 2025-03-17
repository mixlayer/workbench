import { OutputPart, RunState } from '@/lib/utils';
import { OverlayDropdownMenu } from './overlay-menu';
import { SplitDirection } from './splittable';
import { InputBox } from '../chat/input-box';
import { ChatMessages } from '../chat/chat-messages';
import { MxlChat, MxlChatTurn } from '@/lib/request';

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

      <div className="h-full w-full overflow-y-auto mx-auto">
        <ChatMessages
          chat={chat}
          currentTurn={chatTurn}
          className="pb-[250px]"
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
