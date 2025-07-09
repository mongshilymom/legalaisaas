import { useRef } from 'react';

type CacheValue = {
  content: string;
  timestamp: number;
};

export const useContractCache = () => {
  const cache = useRef<Map<string, CacheValue>>(new Map());

  const getCacheKey = (type: string, companyInfo: Record<string, any>): string => {
    return JSON.stringify({ type, companyInfo });
  };

  const getCachedResult = (type: string, companyInfo: Record<string, any>) => {
    const key = getCacheKey(type, companyInfo);
    return cache.current.get(key);
  };

  const setCachedResult = (type: string, companyInfo: Record<string, any>, content: string) => {
    const key = getCacheKey(type, companyInfo);
    cache.current.set(key, { content, timestamp: Date.now() });
  };

  return {
    getCachedResult,
    setCachedResult,
  };
};