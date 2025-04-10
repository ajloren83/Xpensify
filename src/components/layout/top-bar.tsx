"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { BellIcon, MoonIcon, SunIcon, UserIcon, SettingsIcon, LogOutIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { db, rtdb } from "@/lib/firebase";
import { ref, onValue, off, update } from "firebase/database";

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export function TopBar() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Listen for notifications from Realtime Database
    const notificationsRef = ref(rtdb, `notifications/${user.uid}`);
    
    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationList = Object.entries(data).map(([id, value]: [string, any]) => ({
          id,
          ...value,
        })) as Notification[];
        
        // Sort by timestamp (newest first)
        notificationList.sort((a, b) => b.timestamp - a.timestamp);
        
        setNotifications(notificationList);
        setUnreadCount(notificationList.filter(n => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    return () => {
      off(notificationsRef);
    };
  }, [user]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const markNotificationAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      const notificationRef = ref(rtdb, `notifications/${user.uid}/${notificationId}`);
      await update(notificationRef, { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="fixed right-0 top-0 z-30 flex h-14 w-[calc(100%-16rem)] items-center border-b bg-background px-4 transition-all duration-300">
      <div className="ml-auto flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {isDarkMode ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <BellIcon className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start p-4"
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex w-full items-start justify-between">
                    <span className="font-medium">{notification.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {user?.displayName
                      ? user.displayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "U"}
                  </span>
                )}
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">
                  {user?.displayName || "User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {user?.displayName
                      ? user.displayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "U"}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {user?.displayName || "User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
              <LogOutIcon className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium">
                    {user?.displayName
                      ? user.displayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "U"}
                  </span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {user?.displayName || "User"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
              <LogOutIcon className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 