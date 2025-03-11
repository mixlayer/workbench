import { OutputPart, RunState, TextOutputPart } from '@/lib/utils';
import {
  CopyIcon,
  PanelBottomDashedIcon,
  PanelRightDashedIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { MixlayerLogoMark } from '@/components/logos/MixlayerLogoMark';
import { OutputPaneDirection } from './WorkbenchDev';
import { toast } from 'sonner';

function OutputOverlayToolbar(props: {
  onOutputCopyClick: () => void;
  onOutputClearClick: () => void;
  onSplitClick: (direction: OutputPaneDirection) => void;
  onCloseClick?: () => void;
}) {
  return (
    <div className="absolute z-10 mt-1 flex flex-row space-x-1 pt-0">
      <button
        onClick={props.onOutputCopyClick}
        className="opacity-30 hover:opacity-70 cursor-pointer"
      >
        <div className="rounded-md border-[1px] border-gray-200 bg-white p-1">
          <CopyIcon className="h-5 w-5 text-gray-600" />
        </div>
      </button>
      <button
        onClick={props.onOutputClearClick}
        className="opacity-30 hover:opacity-70 cursor-pointer"
      >
        <div className="rounded-md border-[1px] border-gray-200 bg-white p-1">
          <TrashIcon className="h-5 w-5 text-gray-600" />
        </div>
      </button>
      <button
        onClick={() => props.onSplitClick(OutputPaneDirection.Horizontal)}
        className="opacity-30 hover:opacity-70 cursor-pointer"
      >
        <div className="rounded-md border-[1px] border-gray-200 bg-white p-1">
          <PanelRightDashedIcon className="h-5 w-5 text-gray-600" />
        </div>
      </button>
      <button
        onClick={() => props.onSplitClick(OutputPaneDirection.Vertical)}
        className="opacity-30 hover:opacity-70 cursor-pointer"
      >
        <div className="rounded-md border-[1px] border-gray-200 bg-white p-1">
          <PanelBottomDashedIcon className="h-5 w-5 text-gray-600" />
        </div>
      </button>
      {props.onCloseClick && (
        <button
          onClick={props.onCloseClick}
          className="opacity-30 hover:opacity-70 cursor-pointer"
        >
          <div className="rounded-md border-[1px] border-gray-200 bg-white p-1">
            <XIcon className="h-5 w-5 text-gray-600" />
          </div>
        </button>
      )}
    </div>
  );
}

export function OutputPane(props: {
  runState: RunState;
  outputParts: OutputPart[];
  showHiddenTokens: boolean;
  autoscroll: boolean;
  onOutputClearClick: () => void;
  onCloseClick?: () => void;
  onSplitClick: (direction: OutputPaneDirection) => void;
  selectedStream: string;
}) {
  let outputDiv = useRef<HTMLDivElement>(null);

  let { outputParts, selectedStream, showHiddenTokens } = props;

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
    <div
      ref={outputDiv}
      className="h-[calc(100vh - 50px)] h-full overflow-scroll border-l border-t-[0.5px] border-l-gray-200 border-t-gray-200 bg-white p-4 pt-2"
    >
      <OutputOverlayToolbar
        onOutputCopyClick={copyOutputToClipboard}
        onOutputClearClick={props.onOutputClearClick}
        onSplitClick={props.onSplitClick}
        onCloseClick={props.onCloseClick}
      />
      {outputParts.length === 0 && (
        <div className="flex w-full h-full items-center justify-center text-gray-500">
          <MixlayerLogoMark fill="black" className="fill-gray-100 h-24 w-24" />
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
