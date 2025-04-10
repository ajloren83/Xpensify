// /components/layout/AppLayout.tsx
"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./Topbar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar sidebarCollapsed={sidebarCollapsed} />
        <main
          className={`flex-1 overflow-y-auto p-6 transition-all duration-300 ${
            sidebarCollapsed ? "ml-0" : "ml-0"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}