import { useCallback, useState } from 'react';
import { OutputPane } from './output-pane';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ChatPane } from './chat-pane';
import { MxlChat } from '@/lib/request';

export interface OutputPaneContent {
  kind: 'stream';
  stream?: string;
}

export interface ChatPaneContent {
  kind: 'chat';
  chat: MxlChat;
}

export interface ContentPane {
  kind: 'content';
  content: ContentPaneType;
}

export type ContentPaneType = OutputPaneContent | ChatPaneContent;

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

export type OutputPaneType = ContentPane | SplitPane;

export function SplittableOutputPane(props: { onCloseClick?: () => void }) {
  const [layout, setLayout] = useState<OutputPaneType>({
    kind: 'content',
    content: {
      kind: 'stream',
      stream: '0',
    },
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
      if (layout.kind === 'content') {
        const newPane: OutputPaneType = {
          kind: 'split',
          direction,
          left: layout,
          right: {
            kind: 'content',
            content: {
              kind: 'stream',
              stream: '0',
            },
          },
        };

        setLayout(newPane);
      }
    },
    [layout],
  );

  const onChatClick = (chat: MxlChat) => {
    setLayout((old) => {
      if (old.kind === 'content') {
        return {
          kind: 'content',
          content: {
            kind: 'chat',
            chat,
          },
        };
      }

      return old;
    });
  };

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
          <SplittableOutputPane onCloseClick={closeLeft} />
        </Panel>
        <PanelResizeHandle />
        <Panel className={paneBPad}>
          <SplittableOutputPane onCloseClick={closeRight} />
        </Panel>
      </PanelGroup>
    );
  }

  if (layout.kind === 'content') {
    return (
      <ContentPane
        content={layout.content}
        onSplitClick={onSplitClick}
        onCloseClick={props.onCloseClick}
        onChatClick={onChatClick}
      />
    );
  }
}

function ContentPane(props: {
  content: ContentPaneType;
  onSplitClick: (direction: SplitDirection) => void;
  onCloseClick?: () => void;
  onChatClick: (chat: MxlChat) => void;
}) {
  const { content, onSplitClick, onCloseClick, onChatClick } = props;

  if (content.kind === 'stream') {
    return (
      <OutputPane
        onSplitClick={onSplitClick}
        onCloseClick={onCloseClick}
        onChatClick={onChatClick}
      />
    );
  }

  if (content.kind === 'chat') {
    return (
      <ChatPane
        onSplitClick={onSplitClick}
        onCloseClick={props.onCloseClick}
        chatId={content.chat.id}
        onChatClick={onChatClick}
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
