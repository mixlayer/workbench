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

import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import csharp from 'react-syntax-highlighter/dist/esm/languages/prism/csharp';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin';

// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
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

SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('css', css);
// SyntaxHighlighter.registerLanguage('html', html);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('rust', rust);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('csharp', csharp);
SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('go', go);
SyntaxHighlighter.registerLanguage('kotlin', kotlin);

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
