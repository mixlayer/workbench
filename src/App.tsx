import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
// import { AppSidebar } from './AppSidebar';
import { WorkbenchMode, WorkbenchModeTabs } from './WorkbenchTabs';
import React from 'react';
import { WorkbenchChat } from './chat/WorkbenchChat';
import { WorkbenchDev } from './dev/developer-tab';

const App = () => {
  const [workbenchMode, setWorkbenchMode] = React.useState<WorkbenchMode>(
    WorkbenchMode.Chat,
  );

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '19rem',
        } as React.CSSProperties
      }
    >
      <div className="flex flex-col w-full h-screen">
        <header className="flex w-full h-[var(--header-height)] shrink-0 items-center gap-2 px-4 border-b border-gray-100">
          <SidebarTrigger className="-ml-1" />
          {/* <Separator orientation="vertical" className="mr-2 h-4" /> */}
          <div className="flex-1"></div>
          <WorkbenchModeTabs
            value={workbenchMode}
            onChange={setWorkbenchMode}
          />
          <div className="flex-1"></div>
          <div className="w-[28px]"></div>
        </header>
        <div className="h-full">
          {/* <AppSidebar className="top-[var(--header-height)] h-[calc(100vh-var(--header-height))]" /> */}
          <SidebarInset className="h-full">
            {workbenchMode == WorkbenchMode.Chat ? (
              <WorkbenchChat />
            ) : (
              <WorkbenchDev />
            )}
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default App;
