import { Clock, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HttpServerRequest } from '@/hooks/use-mixlayer-debug';
import { formatDuration, formatTimestamp } from '@/lib/utils';

interface RequestListProps {
  requests: HttpServerRequest[];
  selectedRequestId: string | null;
  onSelectRequest: (id: string) => void;
}

export function RequestList({
  requests,
  selectedRequestId,
  onSelectRequest,
}: RequestListProps) {
  if (requests.length === 0) {
    return (
      <div className="p-4 w-full h-full text-center text-muted-foreground">
        <div className="font-mono text-sm mx-auto flex items-center justify-center h-full">
          No requests captured
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      {requests.map((request) => (
        <button
          key={request.id}
          onClick={() => onSelectRequest(request.id)}
          className={cn(
            'w-full text-left p-3 rounded-md mb-1 flex flex-col transition-colors cursor-pointer',
            selectedRequestId === request.id ? 'bg-muted' : 'hover:bg-accent',
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center min-w-0">
              <span className="text-xs font-medium font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 mr-2 flex-shrink-0">
                {request.method}
              </span>
              <span className="font-medium text-sm truncate flex-1">
                {request.url}
              </span>
            </div>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-mono',
                request.status && request.status >= 200 && request.status < 300
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800',
              )}
            >
              {request.status}
            </span>
          </div>

          <div className="flex items-center text-[10px] text-muted-foreground mt-[6px]">
            <Clock className="h-3 w-3 mr-1" />
            <div className="mr-2">{formatTimestamp(request.startTs)}</div>

            {request.finishTs && (
              <>
                <Timer className="h-3 w-3 mr-1" />
                <div>{formatDuration(request.finishTs - request.startTs)}</div>
              </>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
