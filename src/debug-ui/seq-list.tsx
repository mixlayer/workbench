'use client';

import { Timer } from 'lucide-react';
import type { Seq } from '@/hooks/use-mixlayer-debug';
import { formatDuration, getOpenCloseColor } from '@/lib/utils';

interface SeqListProps {
  seqs: Seq[];
  selectedSeqId: string | null;
  onSelectSeq: (id: string) => void;
}

export function SeqList({ seqs, selectedSeqId, onSelectSeq }: SeqListProps) {
  return (
    <div className="w-full md:w-64 border-r bg-muted/20 h-full flex flex-col">
      <div className="p-3 border-b">
        <h2 className="text-md font-semibold">Sequences</h2>
      </div>

      {seqs.length === 0 ? (
        <div className="w-full h-full md:w-64 border-r bg-muted/20 flex items-center justify-center p-4 text-muted-foreground font-mono text-sm">
          Select a request
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {seqs.map((seq) => (
              <SeqListItem
                key={seq.id}
                seq={seq}
                isSelected={selectedSeqId === seq.id}
                onSelect={onSelectSeq}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SeqListItemProps {
  seq: Seq;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function SeqListItem({ seq, isSelected, onSelect }: SeqListItemProps) {
  return (
    <button
      key={seq.id}
      onClick={() => onSelect(seq.id)}
      className={`
        w-full text-left px-3 py-2 rounded-md mb-1 flex flex-col hover:bg-muted transition-colors cursor-pointer
        ${isSelected ? 'bg-muted' : ''}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div
            className={`
              w-3 h-3 rounded-full mr-2
              ${getOpenCloseColor(seq.isOpen ? 'open' : 'closed')}
            `}
          />
          <span className="font-mono">#{seq.id}</span>
        </div>
      </div>

      <div className="flex items-center text-[10px] text-muted-foreground mt-[2px]">
        <>
          <Timer className="h-3 w-3 mr-1" />
          <div className="mt-[1px]">
            {seq.closeTs && seq.openTs
              ? formatDuration(seq.closeTs - seq.openTs)
              : '--'}
          </div>
        </>
      </div>
    </button>
  );
}
