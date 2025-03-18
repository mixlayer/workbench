import { createContext, useContext } from 'react';
import { ParamsEditorPane } from './params-pane';
import { OutputPart, RunState } from '@/lib/utils';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { EraserIcon } from 'lucide-react';
import { SplittableOutputPane } from './splittable';
import { Console } from './console';
import { MxlChat, MxlChatTurn } from '@/lib/request';
import { RunStateLabel } from '@/components/ui/run-state-label';
import { RunStopButton } from '@/components/ui/run-stop-button';
import { useAppClient } from '@/hooks/use-app-client';

//TODO clean up, use app client state iface instead
export interface MixlayerClientContextState {
  runState: RunState;
  outputParts: OutputPart[];
  streams: string[];
  consoleOutput: string;
  chats: MxlChat[];
  currentChatTurn: MxlChatTurn | null;
  sendChatMessage: (chatId: string, message: string) => void;
  createNewChat: () => string;
  renameChat: (chatId: string, name: string) => void;
  stopRequest: () => void;
}

export const MixlayerClientContext = createContext<MixlayerClientContextState>(
  null!,
);

//TODO state management here is a mess, need to refactor
export function DeveloperTab(props: { className?: string }) {
  const appClient = useAppClient();

  return (
    <MixlayerClientContext.Provider value={appClient}>
      <div className={`flex w-full h-full ${props.className}`}>
        <div className="flex-1 bg-gray-50 py-1 pr-1">
          <PanelGroup direction="horizontal">
            <Panel defaultSize={40} className="p-0.5 pr-1">
              <div className="pl-1 w-full h-full flex flex-col space-y-1">
                <div className="flex space-x-1">
                  <RunStateLabel state={appClient.runState} />
                  <div className="flex-1"></div>
                  <RunStopButton
                    runState={appClient.runState}
                    onRunClick={appClient.sendRequest}
                    onStopClick={appClient.stopRequest}
                  />
                  <Button
                    onClick={appClient.clearOutput}
                    size="sm"
                    variant="outline"
                  >
                    <EraserIcon /> Clear
                  </Button>
                </div>
                <PanelGroup direction="vertical">
                  <Panel
                    defaultSize={75}
                    className="rounded-xs bg-zinc-700 border border-gray-700"
                  >
                    <Console output={appClient.consoleOutput} />
                  </Panel>
                  <PanelResizeHandle className="py-0.5" />
                  <Panel>
                    <div className="rounded-xs border border-gray-200 h-full w-full">
                      <ParamsEditorPane
                        params={appClient.params}
                        setParams={appClient.setParams}
                      />
                    </div>
                  </Panel>
                </PanelGroup>
              </div>
            </Panel>
            <PanelResizeHandle />
            <Panel>
              <SplittableOutputPane />
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </MixlayerClientContext.Provider>
  );
}

export const useAppClientState = () => useContext(MixlayerClientContext);
