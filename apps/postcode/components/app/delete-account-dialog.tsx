"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePhoneScreen } from "@/components/app/phone-frame";
import { dispatch } from "@/lib/demo-store";
import type { User } from "@/lib/types";

export function DeleteAccountDialog({
  user,
  open,
  onOpenChange,
}: {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const phoneScreen = usePhoneScreen();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent container={phoneScreen}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {user.name}&apos;s account?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Their pledges, private reports, unconfirmed claims and reactions are
            removed. Confirmed participation, contribution, rewards and vouchers
            stay with the household. Their house becomes free if no other
            account lives there.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep account</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              dispatch({ type: "delete-user", userId: user.id });
              onOpenChange(false);
            }}
          >
            Delete account
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
