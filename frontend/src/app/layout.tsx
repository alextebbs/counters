import type { Metadata } from "next";
import "./globals.css";
import { IBM_Plex_Mono } from "next/font/google";
import Header from "../components/Header";

const plex = IBM_Plex_Mono({ subsets: ["latin"], weight: ["200", "400"] });

export const metadata: Metadata = {
  title: "Counters",
  description: "Keep track of things that happened.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={plex.className}>
        <main className="flex min-h-screen flex-col max-w-[440px] mx-auto border-x border-neutral-800">
          <Header />
          <>{children}</>
        </main>
      </body>
    </html>
  );
}
