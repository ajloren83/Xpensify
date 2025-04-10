"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  
  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (user && pathname.startsWith("/auth/")) {
      router.push("/dashboard");
    }
  }, [user, pathname, router]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4">
      <div className="mb-8">
        <Image
          src={theme === 'dark' ? '/logo-dark-mode.svg' : '/logo-light-mode.svg'}
          alt="Xpensify Logo"
          width={200}
          height={45}
          priority
          className="h-auto"
        />
      </div>
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
} 