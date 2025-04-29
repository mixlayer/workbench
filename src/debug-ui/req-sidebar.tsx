import type { HttpServerRequest } from '@/hooks/use-mixlayer-debug';
import { RequestList } from './request-list';

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
      <div className="p-3 border-b">
        <h2 className="text-md font-semibold">Requests</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <RequestList
          requests={requests}
          selectedRequestId={selectedRequestId}
          onSelectRequest={onSelectRequest}
        />
      </div>
    </div>
  );
}
