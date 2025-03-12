import { Button } from '@/components/ui/button';
import { RunState } from '@/lib/utils';
import { ArrowUpIcon, BracesIcon, SquareIcon } from 'lucide-react';
import { useCallback, useState } from 'react';

function RunStopButton({
  onStopClick,
  onSendClick,
  runState,
}: {
  onStopClick: () => void;
  onSendClick: () => void;
  runState: RunState;
}) {
  if (runState === RunState.Generating || runState === RunState.Queued) {
    return (
      <Button
        className="h-8 shadow-none text-xs"
        size="icon"
        onClick={onStopClick}
      >
        <SquareIcon className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      className="h-8 shadow-none text-xs"
      size="icon"
      onClick={onSendClick}
    >
      <ArrowUpIcon className="size-4" />
    </Button>
  );
}

export function InputBox(props: {
  onSendClick: (message: string) => void;
  onStopClick: () => void;
  runState: RunState;
}) {
  let { onSendClick: onSend, onStopClick: onStop, runState } = props;

  const [message, setMessage] = useState('');
  const onSendClick = useCallback(() => {
    onSend(message.trim());
    setMessage('');
  }, [message, onSend]);
  const onStopClick = useCallback(() => {
    onStop();
  }, [onStop]);

  return (
    <div className="flex-col w-full min-h-[var(--input-min-height)] border border-gray-200 focus-within:border-gray-400 focus-within:shadow-sm focus-within:shadow-gray-200 focus-within:ring-2 focus-within:ring-gray-100 rounded-md p-2 shadow-xs transition-colors duration-150 ">
      <div className="flex-1 flex p-2">
        <textarea
          placeholder="Send a message"
          className="focus:outline-none flex-1 resize-none w-full max-h-[140px] overflow-y-auto"
          onChange={(e) => {
            e.target.style.height = 'auto';
            const maxHeight = 140; // match the max-h- class
            const newHeight = Math.min(e.target.scrollHeight, maxHeight);
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
        <Button className="h-8 shadow-none text-sm" variant="outline">
          <BracesIcon className="size-4" /> Params
        </Button>
        <div className="flex-1"></div>

        <RunStopButton
          onStopClick={onStopClick}
          onSendClick={onSendClick}
          runState={runState}
        />
      </div>
    </div>
  );
}
