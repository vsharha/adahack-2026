import "./globals.css";
import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import { appearanceScript } from "@/lib/appearance-script";
import { cn } from "@/lib/utils";

const body = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  variable: "--font-body",
  fallback: ["Arial", "sans-serif"],
  adjustFontFallback: false,
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
      className={cn("font-sans", body.variable)}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
      </head>
      <body className="min-h-dvh antialiased select-none [&_*]:select-none">
        {children}
      </body>
    </html>
  );
}
