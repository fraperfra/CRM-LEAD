"use client";

import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { LayoutDashboard, Users, Activity, BarChart3, Settings, LogOut, Menu, X, Search, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useCommandPalette } from '../../hooks/useCommandPalette';

const NotificationCenter = dynamic(() => import('../../components/layout/NotificationCenter'), { ssr: false });
const MobileBottomNav = dynamic(() => import('../../components/mobile/MobileBottomNav'), { ssr: false });
const CommandPalette = dynamic(() => import('../../components/search/CommandPalette'), { ssr: false });

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen: isCommandPaletteOpen, setIsOpen: setCommandPaletteOpen } = useCommandPalette();

  const handleNavigate = (path: string) => {
    router.push(path);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex font-sans text-gray-900 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar (Static) */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 left-0 z-30 bg-white/70 backdrop-blur-xl border-r border-white/40 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <SidebarContent currentPath={pathname} onNavigate={(path) => router.push(path)} onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white/90 backdrop-blur-xl border-r border-white/40 shadow-2xl"
          >
            <SidebarContent currentPath={pathname} onNavigate={handleNavigate} onClose={() => setSidebarOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">

        {/* Universal Top Header (Desktop & Mobile) */}
        <header className="h-16 bg-white/60 backdrop-blur-md border-b border-white/20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-700 hover:bg-black/5 rounded-lg transition-colors">
              <Menu size={24} />
            </button>
            <span className="lg:hidden text-lg font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">ValutaCasa</span>

            {/* Global Search (Desktop only visual) */}
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Cerca rapida..."
                className="pl-9 pr-4 py-1.5 bg-white/50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationCenter />
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-gray-200/50">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                FC
              </div>
              <span className="text-sm font-medium text-gray-700">Francesco</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Command Palette */}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </div>
  );
};

const navItems = [
  { label: 'Overview', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Leads', path: '/dashboard/leads', icon: <Users size={20} /> },
  { label: 'Attività', path: '/dashboard/activities', icon: <Activity size={20} /> },
  { label: 'Automazioni', path: '/dashboard/automations', icon: <Zap size={20} /> },
  { label: 'Analytics', path: '/dashboard/analytics', icon: <BarChart3 size={20} /> },
  { label: 'Impostazioni', path: '/dashboard/settings', icon: <Settings size={20} /> },
];

function SidebarContent({ currentPath, onNavigate, onClose }: { currentPath: string | null, onNavigate: (p: string) => void, onClose: () => void }) {
  return (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-gray-200/50">
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm">
          ValutaCasa
        </span>
        <button onClick={onClose} className="lg:hidden ml-auto p-2 text-gray-500">
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.path || (currentPath && item.path !== '/dashboard' && currentPath.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => {
                onNavigate(item.path);
                onClose();
              }}
              className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                  ? 'bg-blue-600/10 text-blue-700 shadow-sm border border-blue-100/50'
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-900 hover:shadow-sm'}
                  `}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200/50">
        <button className="w-full flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors px-4 py-2 rounded-lg hover:bg-red-50">
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  )
}
