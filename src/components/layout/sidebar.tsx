// /components/layout/Sidebar.tsx
"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Home, CreditCard, Calendar, Settings } from 'lucide-react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/expenses', label: 'Expenses', icon: CreditCard },
  { href: '/recurring', label: 'Recurring', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={cn(
      'flex flex-col h-full bg-background border-r transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Xpensify" width={32} height={32} />
            <span className="font-semibold text-lg">Xpensify</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
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