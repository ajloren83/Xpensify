// /app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/toaster";
import { ToastContextProvider } from "@/components/ui/toast-context";
import { Providers } from "@/components/providers";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Xpensify - Budget and Expense Tracker",
  description: "Track your expenses, manage your budget, and achieve your financial goals.",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <AuthProvider>
            <ToastContextProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
              <Toaster />
            </ToastContextProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}