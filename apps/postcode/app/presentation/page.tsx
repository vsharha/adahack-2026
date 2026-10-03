import type { Metadata } from "next";
import Presentation from "./presentation";

export const metadata: Metadata = {
  title: "Presentation",
  description: "The Greener by postcode hackathon pitch and live demo.",
};

export default function PresentationPage() {
  return <Presentation />;
}
