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

// import { type ClassValue, clsx } from 'clsx';
// import { twMerge } from 'tailwind-merge';

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }

export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatTimestamp(timestampMs: number): string {
  const date = new Date(timestampMs);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } else {
    return date.toLocaleString([], {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}

export function getStateColor(state: string): string {
  switch (state) {
    case 'idle':
      return 'bg-gray-400';
    case 'appending':
      return 'bg-blue-500';
    case 'generating':
      return 'bg-amber-500';
    case 'finished':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}

export function getOpenCloseColor(state: string): string {
  switch (state) {
    case 'open':
      return 'bg-green-400';
    case 'closed':
      return 'bg-gray-400';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
}

export function getStateTextColor(state: string): string {
  switch (state) {
    case 'idle':
      return 'bg-gray-200 text-gray-800';
    case 'appending':
      return 'bg-blue-200 text-blue-800';
    case 'generating':
      return 'bg-amber-200 text-amber-800';
    case 'finished':
      return 'bg-green-200 text-green-800';
    case 'error':
      return 'bg-red-200 text-red-800';
    default:
      return 'bg-gray-200 text-gray-800';
  }
}
