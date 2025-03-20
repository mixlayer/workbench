import {
  MxlChat,
  MxlChatMessage,
  MxlChatReply,
  MxlChatTurn,
} from '@/lib/request';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs as syntaxStyle } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { RefreshCwIcon, TrashIcon } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppClientState } from '../dev/developer-tab';
import { RunState } from '@/lib/utils';

export function ChatMessages(props: {
  className?: string;
  chat: MxlChat;
  currentTurn: MxlChatTurn | null;
  turnClassName?: string;
}) {
  return (
    <div className={props.className}>
      {props.chat.turns.map((turn: MxlChatTurn, idx) => (
        <ChatMessageTurn
          index={idx}
          key={idx}
          chatId={props.chat.id}
          turnId={turn.turnId}
          input={turn.message}
          reply={turn.reply}
          className={props.turnClassName}
          isLast={idx === props.chat.turns.length - 1}
          isCurrentTurn={false}
        />
      ))}
      {props.currentTurn && (
        <ChatMessageTurn
          index={props.chat.turns.length}
          key={props.chat.turns.length}
          chatId={props.chat.id}
          turnId={props.currentTurn.turnId}
          input={props.currentTurn.message}
          reply={props.currentTurn.reply}
          className={props.turnClassName}
          isLast={false}
          isCurrentTurn={true}
        />
      )}
    </div>
  );
}

export function ChatMessageTurn(props: {
  index: number;
  chatId: string;
  turnId: string;
  input: MxlChatMessage;
  reply: MxlChatReply;
  className?: string;
  isLast: boolean;
  isCurrentTurn: boolean;
}) {
  const { input, reply, className } = props;
  const {
    state: { runState },
    regenerateLastChatTurn,
    deleteChatTurn,
  } = useAppClientState();

  return (
    <div className={`${props.index > 0 ? 'mt-8' : 'mt-4'} ${className} group`}>
      <div className="flex">
        <div className="flex-1"></div>
        <div className="whitespace-pre-wrap rounded-2xl rounded-br-none w-7/8 border-gray-200 border bg-[#fcfcfc] p-2 px-4 mt-1">
          {input.content}
        </div>
      </div>
      <div className="w-full pt-4 prose">
        <ReactMarkdown
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex]}
          components={{
            code(props) {
              const { children, className, node, ...rest } = props;
              const match = /language-(\w+)/.exec(className || '');

              return match ? (
                <div className="border border-gray-200 rounded-sm">
                  {
                    //@ts-ignore
                    <SyntaxHighlighter
                      {...rest}
                      PreTag="div"
                      children={String(children).replace(/\n$/, '')}
                      language={match[1]}
                      style={syntaxStyle}
                      codeTagProps={{
                        className: 'chat-code',
                      }}
                      className="border border-gray-200 rounded-sm"
                      customStyle={{
                        border: 'none',
                        fontSize: '16px', //TODO figure out how to do this with css vars
                      }}
                    />
                  }
                </div>
              ) : (
                <code {...rest} className={className}>
                  {children}
                </code>
              );
            },
          }}
        >
          {reply.content}
        </ReactMarkdown>
      </div>
      {props.isLast && !props.isCurrentTurn && runState === RunState.Ready && (
        <div className="flex flex-row">
          <div className="flex-1"></div>
          <div className="flex mt-1 group-hover:opacity-100 opacity-0 transition-opacity duration-300 space-x-2 pr-2">
            <TooltipProvider>
              <TurnButton
                icon={TrashIcon}
                tooltip="Delete turn"
                onClick={() => deleteChatTurn(props.chatId, props.turnId)}
              />
              <TurnButton
                icon={RefreshCwIcon}
                tooltip="Regenerate"
                onClick={() => regenerateLastChatTurn(props.chatId)}
              />
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  );
}

function TurnButton(props: {
  icon: React.ComponentType<{ className: string; onClick: () => void }>;
  onClick: () => void;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <props.icon
          onClick={props.onClick}
          className="w-4 h-4 cursor-pointer text-gray-400 hover:text-gray-600"
        />
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4}>
        {props.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
