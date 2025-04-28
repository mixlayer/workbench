import { Clock, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { ScrollArea } from '@/components/ui/scroll-area';
import type { HttpServerRequest } from '@/hooks/use-mixlayer-debug';
import { formatDistanceToNow, formatDuration } from '@/lib/utils';

interface SidebarProps {
  requests: HttpServerRequest[];
  selectedRequestId: string | null;
  onSelectRequest: (id: string) => void;
}

export function Sidebar({
  requests,
  selectedRequestId,
  onSelectRequest,
}: SidebarProps) {
  return (
    <div className="w-64 border-r bg-muted/40 h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">HTTP Requests</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {requests.map((request) => (
            <button
              key={request.id}
              onClick={() => onSelectRequest(request.id)}
              className={cn(
                'w-full text-left p-3 rounded-md mb-1 flex flex-col  transition-colors cursor-pointer',
                selectedRequestId === request.id && 'bg-muted',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 mr-2">
                    {request.method}
                  </span>
                  <span className="font-medium truncate">{request.url}</span>
                </div>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    request.status &&
                      request.status >= 200 &&
                      request.status < 300
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800',
                  )}
                >
                  {request.status}
                </span>
              </div>

              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3 mr-1" />
                <span className="mr-2">{request.startTs}</span>
                <Timer className="h-3 w-3 mr-1" />
                <span>{formatDuration(0)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
