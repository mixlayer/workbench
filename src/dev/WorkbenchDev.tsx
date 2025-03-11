import { useCallback, useState } from 'react';
import { ParamsEditorPane } from './ParamsEditorPane';
import {
  ErrorOutputPart,
  OutputPart,
  RunState,
  TextOutputPart,
} from '@/lib/utils';
import { OutputPane } from './OutputPane';
import { toast } from 'sonner';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Button } from '@/components/ui/button';
import { PlayIcon } from 'lucide-react';
import { appRequest } from '@/lib/eventsource';
import { EventSourceClient } from 'eventsource-client';

interface OutputStream {
  kind: 'stream';
  stream: string;
}

export enum OutputPaneDirection {
  Horizontal,
  Vertical,
}

interface OutputPaneSplit {
  kind: 'split';
  direction: OutputPaneDirection;
  left: OutputPaneType;
  right: OutputPaneType;
}

type OutputPaneType = OutputStream | OutputPaneSplit;

export function WorkbenchDev() {
  const [params, setParams] = useState('{\n}');
  const [showHiddenTokens, setShowHiddenTokens] = useState(false);
  const [autoscroll, setAutoScroll] = useState(true);
  const [runState, setRunState] = useState(RunState.Ready);
  const [outputParts, setOutputParts] = useState<OutputPart[]>([]);
  const [streams, setStreams] = useState<string[]>([]);
  const [selStream, setSelStream] = useState<string>('0');
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [showConsole, setShowConsole] = useState(false);
  const [sseChannel, setSseChannel] = useState<EventSourceClient | null>(null);

  const pushOutputPart = useCallback(
    (part: OutputPart) => {
      // setStreams((old) => [...old, part.stream]);
      setOutputParts((old) => [...old, part]);
    },
    [setStreams, setOutputParts],
  );

  const run = useCallback(() => {
    setOutputParts([]);
    setRunState(RunState.Generating);
    setConsoleOutput('');
    setStreams([]);

    const sse = appRequest(
      'http://localhost:8484/',
      {},
      pushOutputPart,
      () => {},
    );

    setSseChannel(sse);
  }, []);

  let clearOutput = useCallback(() => {
    setStreams([]);
    setOutputParts([]);
  }, []);

  return (
    <div className="flex w-full h-full">
      <div className="flex-1">
        <PanelGroup direction="horizontal">
          <Panel>
            <div className="w-full h-full flex flex-col">
              <div>
                <Button onClick={run}>
                  <PlayIcon /> Run
                </Button>
              </div>
              <div className="flex-1">
                <ParamsEditorPane params={params} setParams={setParams} />
              </div>
            </div>
          </Panel>
          <PanelResizeHandle />
          <Panel>
            <SplittableOutputPane outputParts={outputParts} />
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

function SplittableOutputPane(props: {
  initialLayout?: OutputPaneType;
  outputParts: OutputPart[];
  onCloseClick?: () => void;
}) {
  const { outputParts, initialLayout } = props;

  const [layout, setLayout] = useState<OutputPaneType>(
    initialLayout ?? {
      kind: 'stream',
      stream: '0',
    },
  );

  const closeLeft = () => {
    setLayout((old) => {
      if (old.kind === 'split') {
        return old.right;
      }

      return old;
    });
  };

  const closeRight = () => {
    setLayout((old) => {
      if (old.kind === 'split') {
        return old.left;
      }

      return old;
    });
  };

  const onSplitClick = (direction: OutputPaneDirection) => {
    setLayout((old) => {
      if (old.kind === 'stream') {
        return {
          kind: 'split',
          direction,
          left: old,
          right: {
            kind: 'stream',
            stream: '1',
          },
        };
      }

      throw new Error('invalid layout for split');
    });
  };

  if (layout.kind === 'split') {
    const direction =
      layout.direction == OutputPaneDirection.Horizontal
        ? 'horizontal'
        : 'vertical';

    return (
      <PanelGroup direction={direction}>
        <Panel>
          <SplittableOutputPane
            initialLayout={layout.left}
            onCloseClick={closeLeft}
            outputParts={outputParts}
          />
        </Panel>
        <PanelResizeHandle />
        <Panel>
          <SplittableOutputPane
            initialLayout={layout.right}
            onCloseClick={closeRight}
            outputParts={outputParts}
          />
        </Panel>
      </PanelGroup>
    );
  }

  if (layout.kind === 'stream') {
    return (
      <OutputPane
        runState={RunState.Ready}
        outputParts={outputParts}
        showHiddenTokens={false}
        autoscroll={false}
        onSplitClick={onSplitClick}
        onOutputClearClick={() => {}}
        onCloseClick={props.onCloseClick}
        selectedStream={layout.stream}
      />
    );
  }
}

/* 
// not used anymore, but might need to move back to an approach
// where the layout is managed by a piece of state at the root
// so it can be easily serialized
function splitAtPath(layout: OutputPaneType, path: number[]): OutputPaneType {
  if (layout.kind === 'stream' && path.length === 0) {
    return {
      kind: 'split',
      direction: OutputPaneDirection.Horizontal,
      left: { ...layout },
      right: {
        kind: 'stream',
        stream: '0',
      },
    };
  }

  if (layout.kind === 'split') {
    if (path.length === 0) {
      throw Error('invalid pane path');
    }

    const pathCopy = [...path];
    const nextPane = pathCopy.pop();

    return {
      ...layout,
      left:
        nextPane === 0
          ? splitAtPath(layout.left, pathCopy)
          : { ...layout.left },
      right:
        nextPane === 1
          ? splitAtPath(layout.right, pathCopy)
          : { ...layout.right },
    };
  }

  return { ...layout };
}

*/
