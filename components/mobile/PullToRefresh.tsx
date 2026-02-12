"use client";

import { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
    const [isPulling, setIsPulling] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const startY = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const PULL_THRESHOLD = 80; // Distance to trigger refresh
    const MAX_PULL = 120; // Maximum pull distance

    const handleTouchStart = (e: TouchEvent) => {
        // Only start pull if at top of scroll
        if (containerRef.current && containerRef.current.scrollTop === 0) {
            startY.current = e.touches[0].clientY;
            setIsPulling(true);
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (!isPulling || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const distance = Math.max(0, currentY - startY.current);

        if (distance > 0) {
            // Prevent default scroll behavior when pulling
            e.preventDefault();

            // Apply resistance to make it feel natural
            const resistedDistance = Math.min(distance * 0.5, MAX_PULL);
            setPullDistance(resistedDistance);
        }
    };

    const handleTouchEnd = async () => {
        if (!isPulling) return;

        if (pullDistance >= PULL_THRESHOLD) {
            setIsRefreshing(true);
            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
            }
        }

        setIsPulling(false);
        setPullDistance(0);
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isPulling, isRefreshing, pullDistance]);

    const rotation = (pullDistance / MAX_PULL) * 360;
    const opacity = Math.min(pullDistance / PULL_THRESHOLD, 1);

    return (
        <div ref={containerRef} className="relative h-full overflow-y-auto">
            {/* Pull Indicator */}
            <div
                className="fixed top-0 left-0 right-0 flex items-center justify-center z-50 transition-all"
                style={{
                    height: `${pullDistance}px`,
                    opacity: opacity,
                }}
            >
                <div
                    className={`p-3 bg-blue-600 rounded-full shadow-lg ${isRefreshing ? 'animate-spin' : ''
                        }`}
                    style={{
                        transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
                    }}
                >
                    <RefreshCw className="w-5 h-5 text-white" />
                </div>
            </div>

            {/* Content */}
            <div
                className="transition-transform duration-200"
                style={{
                    transform: `translateY(${pullDistance}px)`,
                }}
            >
                {children}
            </div>
        </div>
    );
}
