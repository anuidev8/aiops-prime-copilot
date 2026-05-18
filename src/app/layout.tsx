import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "@copilotkit/react-core/v2/styles.css";
import "./globals.css";
import { MainLayoutShell } from "@/shared/ui/main-layout-shell";

const displaySans = Space_Grotesk({
  variable: "--font-display-sans",
  subsets: ["latin"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-ui-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "AIOps Prime Copilot",
  description:
    "A multi-agent AIOps copilot that analyzes incidents and produces PRIME KPIs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displaySans.variable} ${mono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex text-slate-300">
        <MainLayoutShell>
          {children}
        </MainLayoutShell>
      </body>
    </html>
  );
}
