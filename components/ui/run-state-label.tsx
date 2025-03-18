import { RunState } from '../../lib/utils';

export function RunStateLabel(props: { state: RunState }) {
  let dotCls = '';
  let textCls = '';
  let text = '';

  switch (props.state) {
    case RunState.Ready:
      textCls = 'text-gray-800';
      dotCls = 'bg-green-500';
      text = 'Ready';
      break;
    case RunState.Connecting:
      textCls = 'text-gray-800';
      dotCls = 'bg-yellow-500';
      text = 'Connecting';
      break;
    case RunState.Generating:
      textCls =
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      dotCls = 'animate-pulse bg-green-500';
      text = 'Running';
      break;
    case RunState.Error:
      textCls = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      dotCls = 'bg-red-500';
      text = 'Error';
      break;
    default:
      throw `state unrecognized: ${props.state}`;
  }

  return (
    <span
      className={`inline-flex items-center ${textCls} rounded-sm px-2.5 py-0.5 text-xs font-medium min-w-22`}
    >
      <span className={`me-2 h-2 w-2 ${dotCls} rounded-sm`}></span>
      <span className="inline-block">{text}</span>
    </span>
  );
}
