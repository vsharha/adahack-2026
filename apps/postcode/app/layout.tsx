import "./globals.css";
import type { Metadata } from "next";
import {
  Atkinson_Hyperlegible_Mono,
  Atkinson_Hyperlegible_Next,
} from "next/font/google";
import { appearanceScript } from "@/lib/appearance-script";
import { cn } from "@/lib/utils";

const body = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  variable: "--font-body",
});
const data = Atkinson_Hyperlegible_Mono({
  subsets: ["latin"],
  variable: "--font-data",
});

export const metadata: Metadata = {
  title: {
    default: "Greener by postcode",
    template: "%s · Greener by postcode",
  },
  description: "Keep your postcode area green with your neighbours.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      // The script in <head> sets data-theme before React hydrates.
      suppressHydrationWarning
      className={cn("font-sans", body.variable, data.variable)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
