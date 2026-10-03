import type { Metadata } from "next";
import { YouScreen } from "@/components/app/you-screen";

export const metadata: Metadata = { title: "You" };

export default function YouPage() {
  return <YouScreen />;
}
