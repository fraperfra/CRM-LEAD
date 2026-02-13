"use client";

import { useState, useEffect, useRef } from 'react';

export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        const handleResize = () => {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(checkIfMobile, 150);
        };

        checkIfMobile();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutRef.current);
        };
    }, []);

    return isMobile;
}
