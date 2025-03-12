import {
  MxlChat,
  MxlChatMessage,
  MxlChatReply,
  MxlChatTurn,
} from '@/lib/request';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs as syntaxStyle } from 'react-syntax-highlighter/dist/esm/styles/prism';

export function ChatMessages(props: {
  chat: MxlChat;
  currentTurn: MxlChatTurn | null;
}) {
  return (
    <div>
      {props.chat.turns.map((turn: MxlChatTurn, idx) => (
        <ChatMessageTurn
          index={idx}
          key={idx}
          input={turn.message}
          reply={turn.reply}
        />
      ))}
      {props.currentTurn && (
        <ChatMessageTurn
          index={props.chat.turns.length}
          key={props.chat.turns.length}
          input={props.currentTurn.message}
          reply={props.currentTurn.reply}
        />
      )}
    </div>
  );
}

export function ChatMessageTurn(props: {
  index: number;
  input: MxlChatMessage;
  reply: MxlChatReply;
}) {
  const { input, reply } = props;

  return (
    <div className={`${props.index > 0 ? 'mt-8' : 'mt-4'}`}>
      <div className="flex">
        <div className="flex-1"></div>
        <div className="whitespace-pre-wrap rounded-2xl rounded-br-none w-7/8 border-gray-200 border bg-[#fcfcfc] p-2 px-4 mt-1">
          {input.content}
        </div>
      </div>
      <div className="w-full pt-4 prose">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
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
    </div>
  );
}
