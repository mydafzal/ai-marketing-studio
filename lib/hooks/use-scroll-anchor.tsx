import { useCallback, useEffect, useRef, useState } from 'react'

interface ScrollDivElement extends HTMLDivElement {
  _scrollTimeout?: number;
}

export const useScrollAnchor = () => {
  const messagesRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<ScrollDivElement>(null)
  const visibilityRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const [isScrolling, setIsScrolling] = useState(false)

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        const container = scrollRef.current;
        if (container) {
          // Removed the -100 offset to ensure it scrolls all the way to the bottom
          const targetPosition = container.scrollHeight - container.clientHeight;
          container.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    }
  }, [])

  // Monitor messages changes
  useEffect(() => {
    if (isAtBottom) {
      const timeoutId = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messagesRef.current?.childNodes.length, isAtBottom, scrollToBottom]);

  // Handle scroll events
  useEffect(() => {
    const { current: scrollContainer } = scrollRef;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      // Increased threshold for bottom detection
      const paddingBottom = 200; 
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      const atBottom = distanceFromBottom < paddingBottom;

      setIsAtBottom(atBottom);
      setIsScrolling(true);

      if (scrollContainer._scrollTimeout) {
        window.clearTimeout(scrollContainer._scrollTimeout);
      }

      scrollContainer._scrollTimeout = window.setTimeout(() => {
        setIsScrolling(false);
        // Only snap to bottom if very close to avoid bounce effect
        if (distanceFromBottom < 10) {
          scrollToBottom();
        }
      }, 150);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (scrollContainer._scrollTimeout) {
        window.clearTimeout(scrollContainer._scrollTimeout);
      }
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [scrollToBottom]);

  // Visibility observer
  useEffect(() => {
    if (!visibilityRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const isNowVisible = entry.isIntersecting;
          setIsVisible(isNowVisible);
          
          // If becoming visible and should be at bottom, scroll
          if (isNowVisible && isAtBottom) {
            scrollToBottom();
          }
        });
      },
      {
        root: scrollRef.current,
        // Increased bottom margin to ensure visibility detection works with the padding
        rootMargin: '0px 0px -200px 0px',
        threshold: 0
      }
    );

    observer.observe(visibilityRef.current);
    return () => observer.disconnect();
  }, [isAtBottom, scrollToBottom]);

  // Initial scroll
  useEffect(() => {
    // Initial scroll with a delay to ensure content is loaded
    const initialScrollTimeout = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(initialScrollTimeout);
  }, []);

  return {
    messagesRef,
    scrollRef,
    visibilityRef,
    scrollToBottom,
    isAtBottom,
    isVisible
  }
}