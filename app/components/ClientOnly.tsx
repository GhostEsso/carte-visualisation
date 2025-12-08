'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

interface ClientOnlyProps {
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * Wrapper component that ensures its children are only rendered on the client
 * and handles React Strict Mode's double mounting gracefully.
 * 
 * This is particularly useful for components like Leaflet that don't handle
 * double mounting well in development mode.
 */
const ClientOnly = ({ children, fallback = null }: ClientOnlyProps) => {
    const [hasMounted, setHasMounted] = useState(false);
    const mountedRef = useRef(false);

    useEffect(() => {
        // Only set mounted on the first effect run
        if (!mountedRef.current) {
            mountedRef.current = true;
            setHasMounted(true);
        }

        return () => {
            // Reset on unmount for Strict Mode compatibility
            mountedRef.current = false;
        };
    }, []);

    if (!hasMounted) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

export default ClientOnly;
