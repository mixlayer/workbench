/* 
TODO for 4/27

- figure out why 2 requests are running (causing dupe tokens to be displayed)
*/
import { Clock, Timer } from 'lucide-react';

import { Seq, SeqChunk } from '@/hooks/use-mixlayer-debug';
import { formatDuration, formatTime, getStateColor } from '@/lib/utils';

interface SeqTokensProps {
  seq: Seq | null;
}

export function SeqTokens({ seq }: SeqTokensProps) {
  if (!seq) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-muted-foreground">
        Select a sequence to view tokens
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center">
            Tokens for {/*seq.model*/ `llama - something`}
            <div className="flex items-center ml-2">
              <div className={`w-3 h-3 rounded-full mr-1`} />
              <span className="text-xs">{seq.isOpen ? 'open' : 'closed'}</span>
            </div>
          </h2>
          <div className="text-sm text-muted-foreground">
            {/*seq.tokens.length*/ 0} tokens total
          </div>
        </div>

        <div className="flex items-center text-sm text-muted-foreground mt-2">
          <Clock className="h-4 w-4 mr-1" />
          <span className="mr-3">{/*formatTime(seq.timestamp)*/ '123'}</span>
          <Timer className="h-4 w-4 mr-1" />
          <span>{/*formatDuration(seq.duration)*/ '123'}</span>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {seq.chunks.length > 0 && (
          <div className="whitespace-pre-wrap font-mono text-sm leading-6">
            {seq.chunks.map((chunk, i) => (
              <Chunk key={i} chunk={chunk} showHidden={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Chunk(props: { chunk: SeqChunk; showHidden: boolean }) {
  let { chunk, showHidden } = props;

  // switch (part.type) {
  //   case 'text':
  //     return !showHidden && part.hidden ? (
  //       <></>
  //     ) : (
  //       <span className={`${part.hidden && 'text-gray-500'}`}>{part.text}</span>
  //     );
  //   case 'error':
  //     return (
  //       <div className="rounded-md border-[1px] border-red-100 p-4 text-red-500">
  //         {part.message}
  //       </div>
  //     );
  // }

  return !showHidden && chunk.hidden ? (
    <></>
  ) : (
    <span className={`${chunk.hidden && 'text-gray-500'}`}>{chunk.chunk}</span>
  );
}
