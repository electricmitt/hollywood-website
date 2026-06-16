import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design that detects if a media query matches
 * @param query CSS media query string (e.g., "(max-width: 768px)")
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with the current state
  const getMatches = (mediaQuery: string): boolean => {
    // For SSR, return false initially
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(mediaQuery).matches;
  };

  const [matches, setMatches] = useState<boolean>(getMatches(query));

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Initial check
    setMatches(mediaQuery.matches);
    
    // Create an event listener function
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add the listener to the media query
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up function
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}
