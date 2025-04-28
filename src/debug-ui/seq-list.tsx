'use client';

import { Clock, Timer } from 'lucide-react';
import type { Seq } from '@/hooks/use-mixlayer-debug';
// import { formatDuration, formatTime, getStateColor } from '@/lib/utils';

interface SeqListProps {
  seqs: Seq[];
  selectedSeqId: string | null;
  onSelectSeq: (id: string) => void;
}

export function SeqList({ seqs, selectedSeqId, onSelectSeq }: SeqListProps) {
  if (seqs.length === 0) {
    return (
      <div className="w-full md:w-64 border-r bg-muted/20 flex items-center justify-center p-4 text-muted-foreground">
        Select an HTTP request to view sequences
      </div>
    );
  }

  return (
    <div className="w-full md:w-64 border-r bg-muted/20 h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Sequences</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {seqs.map((seq) => (
            <button
              key={seq.id}
              onClick={() => onSelectSeq(seq.id)}
              className={`
                w-full text-left p-3 rounded-md mb-1 flex flex-col hover:bg-muted transition-colors cursor-pointer
                ${selectedSeqId === seq.id ? 'bg-muted' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    // className={cn(
                    //   'w-3 h-3 rounded-full mr-2',
                    //   getStateColor(seq.state),
                    // )}
                    className={`w-3 h-3 rounded-full mr-2`}
                  />
                  <span className="font-medium">
                    meta/llama3.3-70b-instruct
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">0 tokens</span>
              </div>

              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3 mr-1" />
                <span className="mr-2">ts</span>
                <Timer className="h-3 w-3 mr-1" />
                <span className="mr-2">dur</span>
                <span>0 tokens</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
