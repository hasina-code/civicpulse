"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "../../lib/api-client";

type NotificationSummary = { id: string; readAt: string | null };
type NotificationsResult = { items: NotificationSummary[] };

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    void apiClient
      .get<NotificationsResult>("/api/notifications?limit=20")
      .then((result) => setUnreadCount(result.items.filter((item) => !item.readAt).length))
      .catch(() => setUnreadCount(0));
  }, []);

  return (
    <Link
      aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
      className="relative flex h-9 w-9 items-center justify-center rounded-md border border-[#334760] bg-[#1b2a48] text-slate-200 transition hover:border-[#5b82e8]"
      href="/notifications"
    >
      <Bell aria-hidden="true" className="h-4 w-4" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#2563eb] px-1 text-[9px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
