import { useState, useEffect } from 'react';

// useDebounce prevents rapid UI updates/API requests on continuous inputs
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler); // Cleanup timeout on next change or unmount
    };
  }, [value, delay]);

  return debouncedValue;
}
