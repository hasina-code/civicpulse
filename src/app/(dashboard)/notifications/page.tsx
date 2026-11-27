"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { apiClient } from "../../../client/lib/api-client";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationsResult = {
  items: NotificationItem[];
  total: number;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const result = await apiClient.get<NotificationsResult>(
        "/api/notifications?limit=50",
      );
      setNotifications(result.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const markRead = async (notification: NotificationItem) => {
    if (notification.readAt) return;
    try {
      await apiClient.patch<NotificationItem>(
        `/api/notifications/${notification.id}/read`,
        {},
      );
      setNotifications((items) =>
        items.map((item) =>
          item.id === notification.id
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update notification");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2563eb]">
          Updates
        </p>
        <h2 className="mt-2 text-2xl font-black">Notifications</h2>
      </header>
      {loading ? (
        <p className="mt-6 text-sm text-slate-500">Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
          No notifications yet.
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {notifications.map((notification) => (
            <article
              className={`rounded-xl border p-4 transition ${
                notification.readAt
                  ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-[#14203a]"
                  : "border-[#2563eb]/40 bg-blue-50/70 dark:border-blue-400/30 dark:bg-blue-500/10"
              }`}
              key={notification.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold">{notification.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {notification.message}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold disabled:opacity-50"
                  disabled={Boolean(notification.readAt)}
                  onClick={() => void markRead(notification)}
                  type="button"
                >
                  {notification.readAt ? "Read" : "Mark read"}
                </button>
              </div>
              {notification.link ? (
                <Link className="mt-3 inline-block text-xs font-bold text-[#2563eb]" href={notification.link}>
                  View details
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
