import "./globals.css";
import type { Metadata } from "next";
import {
  Atkinson_Hyperlegible_Mono,
  Atkinson_Hyperlegible_Next,
  Cinzel,
} from "next/font/google";
import { cn } from "@/lib/utils";

const body = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  variable: "--font-body",
});
const data = Atkinson_Hyperlegible_Mono({
  subsets: ["latin"],
  variable: "--font-data",
});
const sign = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });

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
      className={cn("font-sans", body.variable, data.variable, sign.variable)}
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
