import React from 'react';
import { useEffect, useRef, useState } from 'react';

export function Autoscroll(props: {
  className?: string;
  autoscrollEnabled: boolean;
  setAutoscrollEnabled: (enabled: boolean) => void;
  children: React.ReactNode;
}) {
  const { autoscrollEnabled, setAutoscrollEnabled, children } = props;
  const [scrollDiv, setScrollDiv] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!scrollDiv || !autoscrollEnabled) return;
    scrollDiv.scrollTop = scrollDiv.scrollHeight;
  }, [children, scrollDiv, autoscrollEnabled]);

  useEffect(() => {
    if (!scrollDiv) return;

    const handleScroll = () => {
      // Calculate if user is at bottom (with small threshold)
      const distanceFromBottom =
        scrollDiv.scrollHeight - scrollDiv.scrollTop - scrollDiv.clientHeight;

      const isAtBottom = distanceFromBottom < 10;
      setAutoscrollEnabled(isAtBottom);
    };

    scrollDiv.addEventListener('scroll', handleScroll);

    return () => {
      scrollDiv.removeEventListener('scroll', handleScroll);
    };
  }, [scrollDiv]);
  return (
    <div className={`overflow-y-auto ${props.className}`} ref={setScrollDiv}>
      {children}
    </div>
  );
}
