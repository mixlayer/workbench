import { useCallback, useState } from 'react';
import { OutputPart, RunState } from '@/lib/utils';
import { OutputPane } from './output-pane';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ChatPane } from './chat-pane';
import { MxlChat, MxlChatTurn } from '@/lib/request';

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

export function SplittableOutputPane(props: {
  outputParts: OutputPart[];
  streams: string[];
  chats: MxlChat[];
  currentChatTurn: MxlChatTurn | null;
  onCloseClick?: () => void;
  onNewChatClick: () => void;
  onChatSendClick: (chatId: string, message: string) => void;
}) {
  const { outputParts, streams, chats } = props;

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
          <SplittableOutputPane
            streams={streams}
            onCloseClick={closeLeft}
            outputParts={outputParts}
            chats={chats}
            onNewChatClick={props.onNewChatClick}
            currentChatTurn={props.currentChatTurn}
            onChatSendClick={props.onChatSendClick}
          />
        </Panel>
        <PanelResizeHandle />
        <Panel className={paneBPad}>
          <SplittableOutputPane
            streams={streams}
            onCloseClick={closeRight}
            outputParts={outputParts}
            chats={chats}
            onNewChatClick={props.onNewChatClick}
            currentChatTurn={props.currentChatTurn}
            onChatSendClick={props.onChatSendClick}
          />
        </Panel>
      </PanelGroup>
    );
  }

  if (layout.kind === 'content') {
    return (
      <ContentPane
        content={layout.content}
        runState={RunState.Ready}
        outputParts={outputParts}
        onSplitClick={onSplitClick}
        onCloseClick={props.onCloseClick}
        onChatClick={onChatClick}
        streams={streams}
        chats={chats}
        onNewChatClick={props.onNewChatClick}
        onChatSendClick={props.onChatSendClick}
        currentChatTurn={props.currentChatTurn}
      />
    );
  }
}

function ContentPane(props: {
  content: ContentPaneType;
  runState: RunState;
  outputParts: OutputPart[];
  onSplitClick: (direction: SplitDirection) => void;
  onCloseClick?: () => void;
  onChatClick: (chat: MxlChat) => void;
  onNewChatClick: () => void;
  onChatSendClick: (chatId: string, message: string) => void;
  streams: string[];
  chats: MxlChat[];
  currentChatTurn: MxlChatTurn | null;
}) {
  const {
    content,
    outputParts,
    onSplitClick,
    onCloseClick,
    onChatClick,
    streams,
    chats,
  } = props;

  if (content.kind === 'stream') {
    return (
      <OutputPane
        runState={RunState.Ready}
        outputParts={outputParts}
        onSplitClick={onSplitClick}
        onCloseClick={onCloseClick}
        onNewChatClick={props.onNewChatClick}
        streams={streams}
        chats={chats}
        onChatClick={onChatClick}
      />
    );
  }

  if (content.kind === 'chat') {
    return (
      <ChatPane
        runState={RunState.Ready}
        outputParts={outputParts}
        onSplitClick={onSplitClick}
        onOutputClearClick={() => {}}
        onCloseClick={props.onCloseClick}
        onNewChatClick={props.onNewChatClick}
        chats={chats}
        chatId={content.chat.id}
        onChatClick={onChatClick}
        onChatSendClick={props.onChatSendClick}
        currentTurn={props.currentChatTurn}
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
