import { PhoneShell } from "@/components/app/phone-shell";

export default function PhoneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PhoneShell>{children}</PhoneShell>;
}
