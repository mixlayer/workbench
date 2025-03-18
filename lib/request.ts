import { RunState } from './utils';

export interface MxlRequest {
  id: string;
  params: Record<string, any>;
}

export interface MxlRequestHistory {
  requests: MxlRequest[];
}

export interface MxlChat {
  id: string;
  name: string;
  turns: MxlChatTurn[];
}

export interface MxlChatTurn {
  requestId: string;
  message: MxlChatMessage;
  reply: MxlChatReply;
}

export interface MxlChatMessage {
  role: string;
  content: string;
}

export interface MxlChatReply {
  role: string;
  content: string;
}

export interface MxlRequestHistory {
  requests: MxlRequest[];
}

export interface MxlChat {
  id: string;
  name: string;
  runState: RunState;
  turns: MxlChatTurn[];
}

export interface MxlChatTurn {
  requestId: string;
  chatId: string;
  message: MxlChatMessage;
  reply: MxlChatReply;
}

export type MxlChatEntry = MxlChatMessage | MxlChatReply;

export interface MxlChatMessage {
  role: string;
  content: string;
}

export interface MxlChatReply {
  role: string;
  content: string;
}

// Returns a JSON array of messages suitable for a POST
// request body
export function chatMessagesJson(chat: MxlChat) {
  return chat.turns.flatMap((t) => {
    return [
      {
        role: 'user',
        text: t.message.content,
      },
      {
        role: 'assistant',
        text: t.reply.content,
      },
    ];
  });
}
