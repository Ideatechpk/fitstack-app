import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitStack — Business Operations System",
  description: "AI-powered custom business system by Ideatech",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-brand-navy text-gray-200 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
