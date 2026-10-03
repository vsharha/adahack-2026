import type { Metadata } from "next";
import { StreetScreen } from "@/components/app/street-screen";

export const metadata: Metadata = { title: "Street" };

export default function StreetPage() {
  return <StreetScreen />;
}
