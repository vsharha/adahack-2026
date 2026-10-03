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
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {user.name}&apos;s account?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Their pledges, completed goals and reactions are removed from the
            street, and their house becomes free.
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
