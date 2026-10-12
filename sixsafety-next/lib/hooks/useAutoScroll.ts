import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Auto-scroll hook for conversational interface
 * Scrolls to bottom when new messages appear, but disables when user scrolls up
 */
export function useAutoScroll(messageCount: number) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Detect user scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isUserScrolling) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    // Re-enable auto-scroll if user scrolls near bottom
    if (!isNearBottom && autoScroll) {
      setAutoScroll(false);
    } else if (isNearBottom && !autoScroll) {
      setAutoScroll(true);
    }
  }, [autoScroll, isUserScrolling]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      setIsUserScrolling(true);

      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });

      // Reset user scrolling flag after animation
      setTimeout(() => {
        setIsUserScrolling(false);
      }, 500);
    }
  }, [messageCount, autoScroll]);

  return { scrollRef, handleScroll, autoScroll };
}
