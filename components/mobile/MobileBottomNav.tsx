"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Zap, BarChart3, User } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';

const navItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/leads', icon: Users, label: 'Leads' },
    { href: '/dashboard/automations', icon: Zap, label: 'Automazioni' },
    { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    { href: '/dashboard/profile', icon: User, label: 'Profilo' },
];

export default function MobileBottomNav() {
    const pathname = usePathname();
    const isMobile = useIsMobile();

    if (!isMobile) return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
            <div className="grid grid-cols-5 h-16">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive
                                    ? 'text-blue-600'
                                    : 'text-gray-500 active:text-gray-700'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
