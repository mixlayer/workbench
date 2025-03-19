import { Button } from '@/components/ui/button';
import { MxlChat } from '@/lib/request';
import { RunState } from '@/lib/utils';
import { ArrowUpIcon, PencilIcon, SquareIcon } from 'lucide-react';
import { useCallback, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function RunStopButton(props: {
  onStopClick: () => void;
  onSendClick: () => void;
  runState: RunState;
  className?: string;
  disabled?: boolean;
}) {
  if (
    props.runState === RunState.Generating ||
    props.runState === RunState.Queued
  ) {
    return (
      <Button
        className={`h-8 shadow-none text-xs ${props.className}`}
        size="icon"
        disabled={props.disabled}
        onClick={props.onStopClick}
      >
        <SquareIcon className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      className="h-8 shadow-none text-xs"
      size="icon"
      disabled={props.disabled}
      onClick={props.onSendClick}
    >
      <ArrowUpIcon className="size-4" />
    </Button>
  );
}

export function InputBox(props: {
  onSendClick: (message: string) => void;
  onStopClick: () => void;
  renameChat: (chatId: string, name: string) => void;
  runState: RunState;
  chat: MxlChat;
}) {
  let {
    onSendClick: onSend,
    onStopClick: onStop,
    runState,
    renameChat,
  } = props;

  const [message, setMessage] = useState('');
  const onSendClick = useCallback(() => {
    if (message.trim() === '') {
      return;
    }

    onSend(message.trim());
    setMessage('');
  }, [message, onSend]);

  const onStopClick = useCallback(() => {
    onStop();
  }, [onStop]);

  const [chatRenameValue, setChatRenameValue] = useState(props.chat.name);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);

  return (
    <div className="bg-white flex-col w-full max-w-[680px] mx-auto min-h-[var(--input-min-height)] border border-gray-200 focus-within:border-gray-400 focus-within:shadow-sm focus-within:shadow-gray-200 focus-within:ring-2 focus-within:ring-gray-100 rounded-md shadow-xs transition-colors duration-150 ">
      <div className="flex-1 flex p-3">
        <textarea
          placeholder="Send a message"
          className="focus:outline-none flex-1 resize-none w-full max-h-[140px] overflow-y-auto"
          onChange={(e) => {
            e.target.style.height = 'auto';
            const maxHeight = 140; // match the max-h- class
            const newHeight = Math.min(e.target.scrollHeight, maxHeight);
            // 48, 72, 96, 120, 140
            e.target.style.height = `${newHeight}px`;
            setMessage(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (e.shiftKey) {
                return; // allow new line
              }
              e.preventDefault();
              onSendClick();
            }
          }}
          value={message}
        />
      </div>
      <div className="flex flex-none h-10 pt-2 align-middle items-center">
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogTrigger asChild>
            <div className="group cursor-pointer  ml-2 flex-none flex flex-row items-center space-x-1.5">
              <div className="text-xs text-gray-500 group-hover:underline underline-offset-2 decoration-gray-300">
                {props.chat.name}
              </div>
              <div className="group-hover:opacity-100 opacity-0 transition-opacity duration-150 text-xs text-gray-400">
                <PencilIcon className="size-3" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rename Chat</DialogTitle>
              <DialogDescription>Give your chat a new name.</DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="link" className="sr-only">
                  Chat name
                </Label>
                <Input
                  id="link"
                  value={chatRenameValue}
                  onChange={(e) => setChatRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      renameChat(props.chat.id, chatRenameValue);
                      setRenameDialogOpen(false);
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-end">
              <Button
                type="submit"
                size="sm"
                className="px-3"
                onClick={() => {
                  renameChat(props.chat.id, chatRenameValue);
                  setRenameDialogOpen(false);
                }}
              >
                <span>Save</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex-1"></div>

        <div className="pb-4 pr-2">
          <RunStopButton
            onStopClick={onStopClick}
            onSendClick={onSendClick}
            runState={runState}
          />
        </div>
      </div>
    </div>
  );
}
