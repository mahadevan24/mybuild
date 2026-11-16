import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoalClash - Real-Life Progress Village Builder",
  description: "A Clash of Clans style 3D village builder mirroring real-life progress on your goals and habits.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased overflow-hidden w-screen h-screen">{children}</body>
    </html>
  );
}
