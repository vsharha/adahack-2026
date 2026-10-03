"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { dispatch } from "@/lib/demo-store";

/** Restores the demo seed between judges, then opens the account picker. */
export default function ResetPage() {
  const router = useRouter();
  useEffect(() => {
    dispatch({ type: "reset" });
    router.replace("/");
  }, [router]);
  return null;
}
