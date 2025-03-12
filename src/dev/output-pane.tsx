import { OutputPart, RunState, TextOutputPart } from '@/lib/utils';
import {
  ChevronDownIcon,
  ClipboardIcon,
  PanelBottomDashedIcon,
  PanelRightDashedIcon,
  XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MixlayerLogoMark } from '@/components/logos/MixlayerLogoMark';
import { SplitDirection } from './splittable';
import { toast } from 'sonner';

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

function OutputOverlayToolbar(props: {
  streams: string[];
  selectedStream: string;
  setSelectedStream: (stream: string) => void;
  onOutputCopyClick: () => void;
  onOutputClearClick: () => void;
  onSplitClick: (direction: SplitDirection) => void;
  onCloseClick?: () => void;
  showHiddenTokens: boolean;
  setShowHiddenTokens: (showHiddenTokens: boolean) => void;
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
        <DropdownMenuItem onClick={props.onOutputCopyClick}>
          <div className="flex flex-row items-center space-x-2">
            <ClipboardIcon className="h-5 w-5 " />
            <div>Copy output</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem
          checked={props.showHiddenTokens}
          onCheckedChange={props.setShowHiddenTokens}
        >
          Hidden tokens
        </DropdownMenuCheckboxItem>
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

export function OutputPane(props: {
  runState: RunState;
  outputParts: OutputPart[];
  onOutputClearClick: () => void;
  onCloseClick?: () => void;
  onSplitClick: (direction: SplitDirection) => void;
  streams: string[];
}) {
  const outputDiv = useRef<HTMLDivElement>(null);
  const [selectedStream, setSelectedStream] = useState('0');
  const [showHiddenTokens, setShowHiddenTokens] = useState(false);

  let { outputParts } = props;

  useEffect(() => {
    const el = outputDiv.current;
    if (el) {
      el.scrollTo(0, el.scrollHeight);
    }
  }, [showHiddenTokens, outputDiv, outputParts]);

  let copyOutputToClipboard = useCallback(() => {
    let output = outputParts
      .filter((p) => p.type == 'text')
      .map((p) => (p as TextOutputPart).text)
      .join('');

    navigator.clipboard.writeText(output);
    toast.success('Output copied to clipboard');
  }, [outputParts]);

  return (
    <div className="relative h-full bg-white border border-gray-200 rounded-sm">
      <div className="absolute top-2 right-2 z-10">
        <OutputOverlayToolbar
          onOutputCopyClick={copyOutputToClipboard}
          onOutputClearClick={props.onOutputClearClick}
          onSplitClick={props.onSplitClick}
          onCloseClick={props.onCloseClick}
          streams={props.streams}
          selectedStream={selectedStream}
          setSelectedStream={setSelectedStream}
          showHiddenTokens={showHiddenTokens}
          setShowHiddenTokens={setShowHiddenTokens}
        />
      </div>

      <div className="absolute bottom-2 right-2 font-mono text-gray-300 text-xs">
        Stream {selectedStream}
      </div>

      <div className="h-full overflow-scroll  p-4 pt-2" ref={outputDiv}>
        {outputParts.length === 0 && (
          <div className="flex w-full h-full items-center justify-center text-gray-500">
            <MixlayerLogoMark
              fill="black"
              className="fill-gray-100 h-24 w-24"
            />
          </div>
        )}
        {outputParts.length > 0 && (
          <div className="whitespace-pre-wrap font-mono text-sm leading-6">
            {outputParts
              .filter(
                (part) => part.stream == selectedStream || part.type == 'error',
              )
              .map((part, i) => (
                <OutputFragment
                  key={i}
                  part={part}
                  showHidden={showHiddenTokens}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function OutputFragment(props: { part: OutputPart; showHidden: boolean }) {
  let { part, showHidden } = props;

  switch (part.type) {
    case 'text':
      return !showHidden && part.hidden ? (
        <></>
      ) : (
        <span className={`${part.hidden && 'text-gray-500'}`}>{part.text}</span>
      );
    case 'error':
      return (
        <div className="rounded-md border-[1px] border-red-100 p-4 text-red-500">
          {part.message}
        </div>
      );
  }
}
