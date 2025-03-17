import {
  ChevronDownIcon,
  ClipboardIcon,
  MessageCircleIcon,
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
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { MxlChat } from '@/lib/request';

export function OverlayDropdownMenu(props: {
  streams: string[];
  selectedStream: string;
  setSelectedStream?: (stream: string) => void;
  onOutputCopyClick?: () => void;
  onSplitClick: (direction: SplitDirection) => void;
  onCloseClick?: () => void;
  onNewChatClick?: () => void;
  onChatClick?: (chat: MxlChat) => void;
  chats: MxlChat[];
  showHiddenTokens: boolean;
  setShowHiddenTokens?: (showHiddenTokens: boolean) => void;
}) {
  // not sure if this side effect is a problem lol
  props.streams.sort();

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
        {props.onNewChatClick && (
          <DropdownMenuItem onClick={props.onNewChatClick}>
            <div className="flex flex-row items-center space-x-2">
              <MessageCirclePlusIcon className="h-5 w-5 " />
              <div>New Chat</div>
            </div>
          </DropdownMenuItem>
        )}
        {props.chats.map((chat: MxlChat) => (
          <DropdownMenuItem
            key={chat.id}
            onClick={() => props.onChatClick?.(chat)}
          >
            <div className="flex flex-row items-center space-x-2">
              <MessageCircleIcon className="h-5 w-5 " />
              <div>{chat.name}</div>
            </div>
          </DropdownMenuItem>
        ))}

        {props.onCloseClick && (
          <DropdownMenuItem onClick={props.onCloseClick}>
            <div className="flex flex-row items-center space-x-2">
              <XIcon className="h-5 w-5" />
              <div>Close</div>
            </div>
          </DropdownMenuItem>
        )}
        {props.streams.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Streams</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={props.selectedStream}
              onValueChange={props.setSelectedStream}
            >
              {props.streams.map((stream) => (
                <DropdownMenuRadioItem key={stream} value={stream}>
                  <div className="flex flex-row items-center space-x-2">
                    <div>Stream {stream}</div>
                  </div>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
