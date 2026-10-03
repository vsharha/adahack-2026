import type { Metadata } from "next";
import { GoalsScreen } from "@/components/app/goals-screen";

export const metadata: Metadata = { title: "Goals" };

export default function GoalsPage() {
  return <GoalsScreen />;
}
