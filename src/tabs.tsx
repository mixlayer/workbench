import * as React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WrenchIcon, MessageSquareIcon } from 'lucide-react';

// possible future modes: playground, batch
export enum WorkbenchMode {
  Chat,
  Developer,
}

interface WorkbenchModeTabsProps {
  value: WorkbenchMode;
  onChange: (value: WorkbenchMode) => void;
}

declare const Root: React.ForwardRefExoticComponent<
  WorkbenchModeTabsProps & React.RefAttributes<HTMLDivElement>
>;

export function WorkbenchModeTabs({ value, onChange }: WorkbenchModeTabsProps) {
  const v: string = value == WorkbenchMode.Chat ? 'chat' : 'developer';

  const handleChange = React.useCallback(
    (value: string) => {
      if (onChange) {
        onChange(
          value == 'chat' ? WorkbenchMode.Chat : WorkbenchMode.Developer,
        );
      }
    },
    [onChange],
  );

  return (
    <Tabs
      defaultValue={v}
      onValueChange={handleChange}
      className="items-center w-[480px]"
    >
      <TabsList>
        <TabsTrigger className="px-4 cursor-pointer" value="chat">
          <MessageSquareIcon /> Chat
        </TabsTrigger>
        <TabsTrigger className="px-4 cursor-pointer" value="developer">
          <WrenchIcon /> Developer
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
