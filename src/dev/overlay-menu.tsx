import {
  ChevronDownIcon,
  ClipboardIcon,
  GitFork,
  MessageCircleIcon,
  MessageCircleMoreIcon,
  MessageCirclePlusIcon,
  PanelBottomDashedIcon,
  PanelRightDashedIcon,
  XIcon,
} from 'lucide-react';
import { SplitDirection } from './splittable';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { MxlChat } from '@/lib/request';

export function OverlayDropdownMenu(props: {
  streams: string[];
  onStreamClick?: (stream: string) => void;
  onOutputCopyClick?: () => void;
  onSplitClick: (direction: SplitDirection) => void;
  onCloseClick?: () => void;
  onNewChatClick?: () => string;
  onChatClick?: (chatId: string) => void;
  chats: MxlChat[];
  showHiddenTokens: boolean;
  setShowHiddenTokens?: (showHiddenTokens: boolean) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="opacity-40 hover:opacity-90 cursor-pointer">
          <div className="rounded-md border-[1px] border-gray-300 bg-white p-1">
            <ChevronDownIcon className="h-5 w-5 text-gray-700" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-42 shadow-xs" align="end">
        {props.onOutputCopyClick && (
          <DropdownMenuItem onClick={props.onOutputCopyClick}>
            <div className="flex flex-row items-center space-x-2">
              <ClipboardIcon className="h-5 w-5 " />
              <div>Copy output</div>
            </div>
          </DropdownMenuItem>
        )}
        {props.setShowHiddenTokens && (
          <DropdownMenuCheckboxItem
            checked={props.showHiddenTokens}
            onCheckedChange={props.setShowHiddenTokens}
          >
            Hidden tokens
          </DropdownMenuCheckboxItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => props.onSplitClick(SplitDirection.Horizontal)}
        >
          <div className="flex flex-row items-center space-x-2">
            <PanelRightDashedIcon className="h-5 w-5 " />
            <div>Split right</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => props.onSplitClick(SplitDirection.Vertical)}
        >
          <div className="flex flex-row items-center space-x-2">
            <PanelBottomDashedIcon className="h-5 w-5 " />
            <div>Split down</div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <div className="flex flex-row items-center space-x-2">
              <MessageCircleMoreIcon className="h-4 w-4 text-gray-500" />
              <div>Chats</div>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="min-w-42">
              {props.onNewChatClick && (
                <DropdownMenuItem
                  onClick={() => {
                    if (props.onNewChatClick) {
                      let chatId = props.onNewChatClick();

                      if (chatId && props.onChatClick) {
                        props.onChatClick(chatId);
                      }
                    }
                  }}
                >
                  <div className="flex flex-row items-center space-x-2">
                    <MessageCirclePlusIcon className="h-5 w-5 " />
                    <div>New Chat</div>
                  </div>
                </DropdownMenuItem>
              )}

              {props.chats.length > 0 && <DropdownMenuSeparator />}

              {props.chats.map((chat: MxlChat) => (
                <DropdownMenuItem
                  key={chat.id}
                  onClick={() => props.onChatClick?.(chat.id)}
                >
                  <div className="flex flex-row items-center space-x-2">
                    <MessageCircleIcon className="h-5 w-5 " />
                    <div>{chat.name}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <div className="flex flex-row items-center space-x-2">
              <GitFork className="h-4 w-4 text-gray-500" />
              <div>Streams</div>
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="min-w-42">
              {props.streams.length === 0 && (
                <DropdownMenuItem disabled>No streams</DropdownMenuItem>
              )}
              {props.streams.map((stream) => (
                <DropdownMenuItem
                  key={stream}
                  onClick={() => {
                    if (props.onStreamClick) {
                      props.onStreamClick(stream);
                    }
                  }}
                >
                  <div className="flex flex-row items-center space-x-2">
                    <div>Stream {stream}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        {props.onCloseClick && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={props.onCloseClick}>
              <div className="flex flex-row items-center space-x-2">
                <XIcon className="h-5 w-5" />
                <div>Close</div>
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
