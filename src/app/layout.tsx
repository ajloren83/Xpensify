// /app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { ToastContextProvider } from "@/components/ui/toast-context";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Xpensify - Budget and Expense Tracker",
  description: "Track your expenses, manage your budget, and achieve your financial goals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>
          <AuthProvider>
            <ToastContextProvider>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex-1 flex flex-col overflow-hidden ml-64">
                  <TopBar />
                  <main className="flex-1 overflow-auto p-4 md:p-6 mt-14">
                    {children}
                  </main>
                </div>
              </div>
              <Toaster />
            </ToastContextProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}