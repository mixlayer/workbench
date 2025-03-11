import { RunState } from './utils';

export interface MxlRequest {
  id: string;
  params: Record<string, any>;
}

export interface MxlRequestHistory {
  requests: MxlRequest[];
}

export interface MxlChat {
  name: string;
  runState: RunState;
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
  name: string;
  runState: RunState;
  turns: MxlChatTurn[];
}

export interface MxlChatTurn {
  requestId: string;
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
