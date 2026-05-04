import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Axiom Follow-Up Command Center",
  description: "Simple operations dashboard for leads, follow-ups, and client requests."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
