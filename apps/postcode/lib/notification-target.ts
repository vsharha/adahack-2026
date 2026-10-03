export type NotificationTarget =
  { tab: "goals"; goalId: string } | { tab: "activity"; actionId: string };

export function notificationHref(target: NotificationTarget): string {
  return target.tab === "goals"
    ? `/goals?goal=${encodeURIComponent(target.goalId)}`
    : `/activity?report=${encodeURIComponent(target.actionId)}`;
}

export function notificationItemId(target: NotificationTarget): string {
  return target.tab === "goals"
    ? `goal-${target.goalId}`
    : `report-${target.actionId}`;
}

export function revealNotificationItem(id: string) {
  const item = document.getElementById(id);
  if (!item) return;
  item.focus({ preventScroll: true });
  item.scrollIntoView({
    block: "start",
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}
