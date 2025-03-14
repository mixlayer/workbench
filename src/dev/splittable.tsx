import { useCallback, useState } from 'react';
import { OutputPart, RunState } from '@/lib/utils';
import { OutputPane } from './output-pane';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export interface StreamPane {
  kind: 'stream';
  stream: string;
}

export enum SplitDirection {
  Horizontal,
  Vertical,
}

export interface SplitPane {
  kind: 'split';
  direction: SplitDirection;
  left: OutputPaneType;
  right: OutputPaneType;
}

export type OutputPaneType = StreamPane | SplitPane;

export function SplittableOutputPane(props: {
  outputParts: OutputPart[];
  streams: string[];
  onCloseClick?: () => void;
}) {
  const { outputParts, streams } = props;

  const [layout, setLayout] = useState<OutputPaneType>({
    kind: 'stream',
    stream: '0',
  });

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

  const onSplitClick = useCallback(
    (direction: SplitDirection) => {
      if (layout.kind === 'stream') {
        const newPane: OutputPaneType = {
          kind: 'split',
          direction,
          left: layout,
          right: {
            kind: 'stream',
            stream: '1',
          },
        };

        setLayout(newPane);
      }
    },
    [layout],
  );

  if (layout.kind === 'split') {
    const direction =
      layout.direction == SplitDirection.Horizontal ? 'horizontal' : 'vertical';

    let paneAPad = '';
    let paneBPad = '';
    if (layout.direction === SplitDirection.Horizontal) {
      paneAPad = 'pr-0.5';
      paneBPad = 'pl-0.5';
    } else {
      paneAPad = 'pb-0.5';
      paneBPad = 'pt-0.5';
    }

    return (
      <PanelGroup direction={direction}>
        <Panel className={paneAPad}>
          <SplittableOutputPane
            streams={streams}
            onCloseClick={closeLeft}
            outputParts={outputParts}
          />
        </Panel>
        <PanelResizeHandle />
        <Panel className={paneBPad}>
          <SplittableOutputPane
            streams={streams}
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
        onSplitClick={onSplitClick}
        onOutputClearClick={() => {}}
        onCloseClick={props.onCloseClick}
        streams={streams}
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
