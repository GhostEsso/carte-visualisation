'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook pour debounce une valeur
 * Utile pour limiter les appels API lors de la saisie
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook pour debounce une fonction callback
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number
): (...args: Parameters<T>) => void {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const callbackRef = useRef(callback);

    // Toujours utiliser la dernière version du callback
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    return useCallback((...args: Parameters<T>) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args);
        }, delay);
    }, [delay]);
}

/**
 * Hook pour throttle une fonction (limiter les appels à un intervalle)
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number
): (...args: Parameters<T>) => void {
    const lastCallRef = useRef<number>(0);
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    return useCallback((...args: Parameters<T>) => {
        const now = Date.now();
        if (now - lastCallRef.current >= delay) {
            lastCallRef.current = now;
            callbackRef.current(...args);
        }
    }, [delay]);
}

/**
 * Hook pour détecter si le composant est monté (évite les memory leaks)
 */
export function useIsMounted(): () => boolean {
    const isMountedRef = useRef(false);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return useCallback(() => isMountedRef.current, []);
}

/**
 * Hook pour gérer les états de chargement avec timeout
 */
export function useLoadingState(timeoutMs: number = 10000) {
    const [isLoading, setIsLoading] = useState(false);
    const [isTimeout, setIsTimeout] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const startLoading = useCallback(() => {
        setIsLoading(true);
        setIsTimeout(false);

        timeoutRef.current = setTimeout(() => {
            setIsTimeout(true);
        }, timeoutMs);
    }, [timeoutMs]);

    const stopLoading = useCallback(() => {
        setIsLoading(false);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return { isLoading, isTimeout, startLoading, stopLoading };
}
