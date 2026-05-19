import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Space_Grotesk } from "next/font/google";

const bodySans = Inter({
  variable: "--font-body-sans",
  subsets: ["latin"],
});
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
      className={`${displaySans.variable} ${mono.variable} ${bodySans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex text-foreground">
        <MainLayoutShell>
          {children}
        </MainLayoutShell>
      </body>
    </html>
  );
}
