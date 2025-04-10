// /components/layout/Sidebar.tsx
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, CreditCard, Calendar, Settings } from 'lucide-react';
import { useTheme } from 'next-themes';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/expenses', label: 'Expenses', icon: CreditCard },
  { href: '/recurring', label: 'Recurring', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();

  return (
    <div className={cn(
      'flex flex-col h-full bg-background border-r transition-all duration-300 shrink-0',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center">
            <Image 
              src={theme === 'dark' ? "/logo-dark-mode.svg" : "/logo-light-mode.svg"} 
              alt="Xpensify" 
              width={100} 
              height={32} 
              className="w-full h-auto"
            />
          </div>
        )}
        {collapsed && (
          <div className="flex items-center justify-center w-full">
            <Image 
              src={theme === 'dark' ? "/logo.svg" : "/logo.svg"} 
              alt="Xpensify" 
              width={32} 
              height={32} 
              className="w-full h-auto"
            />
          </div>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              )}
            >
              <Icon className="h-5 w-5" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}