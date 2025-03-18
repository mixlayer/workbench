import React from 'react';
import { RunState } from '../../lib/utils';
import { Button } from './button';
function SolidStopIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
    >
      <path
        fillRule="evenodd"
        d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SolidPlayIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
    >
      <path
        fillRule="evenodd"
        d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export function RunStopButton(props: {
  className?: string;
  runState: RunState;
  onRunClick?: () => void;
  onStopClick?: () => void;
}) {
  if (props.runState == RunState.Generating) {
    return (
      <Button onClick={props.onStopClick} size="sm">
        <SolidStopIcon />
        <div className="inline-block pr-1">Stop</div>
      </Button>
    );
  } else {
    return (
      <Button onClick={props.onRunClick} size="sm" variant="outline">
        <SolidPlayIcon />
        <div className="inline-block pr-1">Run</div>
      </Button>
    );
  }
}
