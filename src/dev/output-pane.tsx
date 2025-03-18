import { OutputPart, TextOutputPart } from '@/lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MixlayerLogoMark } from '@/components/logos/MixlayerLogoMark';
import { SplitDirection } from './splittable';
import { toast } from 'sonner';
import { OverlayDropdownMenu } from './overlay-menu';
import { MxlChat } from '@/lib/request';
import { useAppClientState } from './developer-tab';

export function OutputPane(props: {
  onCloseClick?: () => void;
  onSplitClick: (direction: SplitDirection) => void;
  onChatClick: (chat: MxlChat) => void;
}) {
  const outputDiv = useRef<HTMLDivElement>(null);
  const [selectedStream, setSelectedStream] = useState('0');
  const [showHiddenTokens, setShowHiddenTokens] = useState(false);
  // const { state: { response: { streams, chats, outputParts }, createNewChat } = useAppClientState();
  const {
    state: { chats, response },
    createNewChat,
  } = useAppClientState();

  const { streams, outputParts } = response || {
    streams: [],
    outputParts: [],
  };

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
        <OverlayDropdownMenu
          streams={streams}
          chats={chats}
          selectedStream={selectedStream}
          setSelectedStream={setSelectedStream}
          showHiddenTokens={showHiddenTokens}
          setShowHiddenTokens={setShowHiddenTokens}
          onOutputCopyClick={copyOutputToClipboard}
          onNewChatClick={() => createNewChat(null)}
          {...props}
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
