import { SignedInShell } from "@/components/app/signed-in-shell";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SignedInShell>{children}</SignedInShell>;
}
