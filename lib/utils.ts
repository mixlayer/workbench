import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export enum RunState {
  Ready,
  Connecting,
  Queued,
  Generating,
  Error,
}

export interface TextOutputPart {
  text: string;
  hidden: boolean;
  stream: string;
  type: 'text';
}

export interface ErrorOutputPart {
  message: string;
  stream: string | null;
  type: 'error';
}

export type OutputPart = TextOutputPart | ErrorOutputPart;
