import { useState } from 'react';
import { Seq, SeqChunk } from '@/hooks/use-mixlayer-debug';
import { Autoscroll } from '@/components/autoscroll';
import { MixlayerLogoMark } from '@/components/logos/MixlayerLogoMark';
// import { formatDuration, formatTime, getStateColor } from '@/lib/utils';

interface SeqTokensProps {
  seq: Seq | null;
}

export function SeqTokens({ seq }: SeqTokensProps) {
  const [showHiddenTokens, setShowHiddenTokens] = useState(true);
  const [autoscrollEnabled, setAutoscrollEnabled] = useState(true);

  if (!seq) {
    return (
      // <div className="flex-1 flex items-center justify-center p-4 text-muted-foreground">
      //   Select a sequence to view tokens
      // </div>
      <div className="flex w-full h-full items-center justify-center text-gray-500">
        <MixlayerLogoMark fill="black" className="fill-gray-200 h-24 w-24" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-md font-semibold flex items-center">
            Seq #{seq.id}
          </h2>
          <div className="flex font-mono text-muted-foreground items-center text-sm">
            {seq.model}
          </div>
        </div>
      </div>

      <Autoscroll
        autoscrollEnabled={autoscrollEnabled}
        setAutoscrollEnabled={setAutoscrollEnabled}
        className="flex-1 p-4 overflow-y-auto"
      >
        {seq.chunks.length > 0 && (
          <div className="whitespace-pre-wrap font-mono text-sm leading-6">
            {seq.chunks.map((chunk, i) => (
              <Chunk key={i} chunk={chunk} showHidden={showHiddenTokens} />
            ))}
          </div>
        )}
      </Autoscroll>
    </div>
  );
}

function Chunk(props: { chunk: SeqChunk; showHidden: boolean }) {
  let { chunk, showHidden } = props;

  return !showHidden && chunk.hidden ? (
    <></>
  ) : (
    <span className={`${chunk.hidden && 'text-gray-500'}`}>{chunk.chunk}</span>
  );
}
