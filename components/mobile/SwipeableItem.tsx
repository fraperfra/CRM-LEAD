"use client";

import { useState, useRef, useEffect } from 'react';
import { Phone, Mail, MessageCircle, Archive, Trash2 } from 'lucide-react';

interface SwipeAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    onAction: () => void;
}

interface SwipeableItemProps {
    children: React.ReactNode;
    leftActions?: SwipeAction[];
    rightActions?: SwipeAction[];
    onSwipeComplete?: (actionId: string) => void;
}

export default function SwipeableItem({
    children,
    leftActions = [],
    rightActions = [],
    onSwipeComplete,
}: SwipeableItemProps) {
    const [swipeDistance, setSwipeDistance] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const startX = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const MAX_SWIPE = 120; // Maximum swipe distance
    const ACTION_THRESHOLD = 80; // Distance to trigger action

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        setIsSwiping(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping) return;

        const currentX = e.touches[0].clientX;
        const distance = currentX - startX.current;

        // Apply resistance
        const resistedDistance = Math.max(
            -MAX_SWIPE,
            Math.min(MAX_SWIPE, distance * 0.7)
        );

        setSwipeDistance(resistedDistance);
    };

    const handleTouchEnd = () => {
        if (!isSwiping) return;

        // Check if swipe threshold reached
        if (Math.abs(swipeDistance) >= ACTION_THRESHOLD) {
            const actions = swipeDistance > 0 ? leftActions : rightActions;
            const action = actions[0]; // Execute first action

            if (action) {
                action.onAction();
                if (onSwipeComplete) {
                    onSwipeComplete(action.id);
                }
            }
        }

        // Reset
        setIsSwiping(false);
        setSwipeDistance(0);
    };

    const getVisibleActions = () => {
        if (swipeDistance > 0) return leftActions;
        if (swipeDistance < 0) return rightActions;
        return [];
    };

    const actionOpacity = Math.min(Math.abs(swipeDistance) / ACTION_THRESHOLD, 1);

    return (
        <div ref={containerRef} className="relative overflow-hidden">
            {/* Left Actions */}
            {swipeDistance > 0 && leftActions.length > 0 && (
                <div
                    className="absolute left-0 top-0 bottom-0 flex items-center gap-2 px-4"
                    style={{ opacity: actionOpacity }}
                >
                    {leftActions.map((action) => (
                        <div
                            key={action.id}
                            className={`p-3 rounded-lg ${action.bgColor}`}
                        >
                            <div className={action.color}>{action.icon}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Right Actions */}
            {swipeDistance < 0 && rightActions.length > 0 && (
                <div
                    className="absolute right-0 top-0 bottom-0 flex items-center gap-2 px-4"
                    style={{ opacity: actionOpacity }}
                >
                    {rightActions.map((action) => (
                        <div
                            key={action.id}
                            className={`p-3 rounded-lg ${action.bgColor}`}
                        >
                            <div className={action.color}>{action.icon}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Swipeable Content */}
            <div
                className="relative bg-white transition-transform touch-pan-y"
                style={{
                    transform: `translateX(${swipeDistance}px)`,
                    transitionDuration: isSwiping ? '0ms' : '200ms',
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children}
            </div>
        </div>
    );
}

// Default action presets
export const createLeadSwipeActions = (
    leadId: string,
    onCall: () => void,
    onEmail: () => void,
    onWhatsApp: () => void,
    onArchive: () => void
): { left: SwipeAction[]; right: SwipeAction[] } => {
    return {
        left: [
            {
                id: 'call',
                label: 'Chiama',
                icon: <Phone className="w-5 h-5" />,
                color: 'text-blue-600',
                bgColor: 'bg-blue-100',
                onAction: onCall,
            },
            {
                id: 'email',
                label: 'Email',
                icon: <Mail className="w-5 h-5" />,
                color: 'text-purple-600',
                bgColor: 'bg-purple-100',
                onAction: onEmail,
            },
        ],
        right: [
            {
                id: 'whatsapp',
                label: 'WhatsApp',
                icon: <MessageCircle className="w-5 h-5" />,
                color: 'text-green-600',
                bgColor: 'bg-green-100',
                onAction: onWhatsApp,
            },
            {
                id: 'archive',
                label: 'Archivia',
                icon: <Archive className="w-5 h-5" />,
                color: 'text-gray-600',
                bgColor: 'bg-gray-100',
                onAction: onArchive,
            },
        ],
    };
};
