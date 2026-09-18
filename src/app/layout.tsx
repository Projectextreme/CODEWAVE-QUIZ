import type { Metadata } from "next";
import "@/styles/globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";

export const metadata: Metadata = {
  title: "Semaphore MCQ Quiz Platform | High-Performance Assessments",
  description: "Production-grade synchronized assessment engine with real-time timers, authoritative server scoring, and granular analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased selection:bg-cyan-500/20 selection:text-cyan-400">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
