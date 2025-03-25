import { useCallback, useEffect, useRef, useState } from 'react';

export function Console(props: { output: String }) {
  const outputDiv = useRef<HTMLDivElement>(null);
  const [autoscroll, setAutoscroll] = useState(true);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const atBottom =
      Math.abs(target.scrollHeight - target.scrollTop - target.clientHeight) <
      1;
    setAutoscroll(atBottom);
  }, []);

  useEffect(() => {
    const el = outputDiv.current;
    if (autoscroll && el) {
      el.scrollTo(0, el.scrollHeight);
    }
  }, [props.output, outputDiv, autoscroll]);

  return (
    <div
      className="h-full overflow-scroll p-2 text-gray-100 "
      onScroll={onScroll}
      ref={outputDiv}
    >
      <pre className="whitespace-pre-wrap font-mono text-sm">
        {props.output}
      </pre>
    </div>
  );
}
