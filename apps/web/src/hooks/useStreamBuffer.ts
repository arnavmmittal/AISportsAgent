'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useStreamBuffer - Smooth character-by-character text reveal
 *
 * Buffers incoming LLM chunks and reveals them at a consistent
 * speed, creating a smooth typewriter effect like ChatGPT.
 */
export function useStreamBuffer(speed: number = 18) {
  const [displayText, setDisplayText] = useState('');
  const bufferRef = useRef('');
  const displayRef = useRef('');
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const isActiveRef = useRef(false);

  const drain = useCallback((timestamp: number) => {
    if (!isActiveRef.current) return;

    const elapsed = timestamp - lastTimeRef.current;

    if (elapsed >= speed && bufferRef.current.length > displayRef.current.length) {
      // Reveal characters — speed up if buffer is getting large
      const remaining = bufferRef.current.length - displayRef.current.length;
      const charsToReveal = remaining > 100 ? Math.ceil(remaining / 10) :
                           remaining > 50 ? 3 :
                           remaining > 20 ? 2 : 1;

      displayRef.current = bufferRef.current.slice(0, displayRef.current.length + charsToReveal);
      setDisplayText(displayRef.current);
      lastTimeRef.current = timestamp;
    }

    if (displayRef.current.length < bufferRef.current.length) {
      rafRef.current = requestAnimationFrame(drain);
    } else {
      // Buffer fully drained — stop the loop, will restart on next append
      isActiveRef.current = false;
    }
  }, [speed]);

  const append = useCallback((chunk: string) => {
    bufferRef.current += chunk;

    if (!isActiveRef.current) {
      isActiveRef.current = true;
      lastTimeRef.current = 0;
      rafRef.current = requestAnimationFrame(drain);
    }
  }, [drain]);

  const flush = useCallback(() => {
    // Immediately show all buffered text
    displayRef.current = bufferRef.current;
    setDisplayText(displayRef.current);
    isActiveRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    bufferRef.current = '';
    displayRef.current = '';
    setDisplayText('');
    isActiveRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const isBuffering = displayRef.current.length < bufferRef.current.length;

  return { displayText, append, flush, reset, isBuffering };
}
