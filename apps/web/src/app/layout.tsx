import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/shared/providers/SessionProvider";
import { Header } from "@/components/shared/layout/Header";
import { Toaster } from "@/components/shared/ui/sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Flow Sports Coach - Mental Performance Platform",
  description: "Evidence-based mental performance platform for collegiate athletics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${dmSans.variable} antialiased bg-background text-foreground`}>
        <ThemeProvider>
          <SessionProvider>
            {/* Header removed - coach/student layouts have their own navigation */}
            {children}
            <Toaster />
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
