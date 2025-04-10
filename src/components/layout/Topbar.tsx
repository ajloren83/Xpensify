// /components/layout/Topbar.tsx
"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon, BellIcon } from "@heroicons/react/24/outline";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/hooks/useAuth";
import { logoutUser } from "@/lib/auth";
import { getNotifications, markNotificationAsRead } from "@/lib/db";
import { useRouter } from "next/navigation";

interface TopbarProps {
  sidebarCollapsed: boolean;
}

export function Topbar({ sidebarCollapsed }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const { user, userData } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (user) {
        const result = await getNotifications(user.uid);
        if (result.success) {
          setNotifications(result.notifications || []);
          setUnreadCount(
            (result.notifications || []).filter((n: any) => !n.read).length
          );
        }
      }
    };

    fetchNotifications();
    // In a real app, you'd set up a real-time listener with Firebase
  }, [user]);

  const handleLogout = async () => {
    await logoutUser();
    router.push("/auth/login");
  };

  const handleNotificationClick = async (id: string) => {
    if (user) {
      await markNotificationAsRead(user.uid, id);
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    }
  };

  return (
    <div className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4">
      <h1 className={`text-lg font-semibold ${sidebarCollapsed ? "ml-0" : "ml-0"}`}>
        {/* Page title would go here - could be dynamic based on route */}
      </h1>

      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-muted-foreground hover:text-foreground"
        >
          {theme === "dark" ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <BellIcon className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs min-w-[18px] h-[18px] flex items-center justify-center rounded-full p-0">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              notifications
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={`cursor-pointer ${
                      !notification.read ? "bg-accent/50" : ""
                    }`}
                  >
                    <div className="flex flex-col space-y-1 w-full">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{notification.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {notification.message}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
            ) : (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer justify-center font-medium"
              onClick={() => router.push("/notifications")}
            >
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                {userData?.profileImageUrl ? (
                  <AvatarImage src={userData.profileImageUrl} alt="Profile" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                    {userData?.fullName
                      ? userData.fullName.substring(0, 2).toUpperCase()
                      : user?.email?.substring(0, 2).toUpperCase() || "XP"}
                  </AvatarFallback>
                )}
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/settings")}
            >
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}