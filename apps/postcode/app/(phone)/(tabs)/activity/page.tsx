import type { Metadata } from "next";
import { ActivityScreen } from "@/components/app/activity-screen";

export const metadata: Metadata = { title: "Activity" };

export default function ActivityPage() {
  return <ActivityScreen />;
}
