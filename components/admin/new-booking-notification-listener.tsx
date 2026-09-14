"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BookingNotice = {
  id: string;
  reference: string;
  packageTitle: string;
  createdAt: string;
};

type BookingNotification = BookingNotice & {
  toastId: string;
};

const CHECKPOINT_KEY = "viaje:lastSeenBookingCreatedAt";
const NOTIFIED_KEY = "viaje:notifiedBookingIds";
const POLL_INTERVAL_MS = 30_000;
const MAX_STORED_IDS = 80;

function readNotifiedIds() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(NOTIFIED_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeNotifiedIds(ids: string[]) {
  sessionStorage.setItem(NOTIFIED_KEY, JSON.stringify(ids.slice(-MAX_STORED_IDS)));
}

export function NewBookingNotificationListener() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPollingRef = useRef(false);

  const dismiss = useCallback((toastId: string) => {
    setNotifications((current) => current.filter((notification) => notification.toastId !== toastId));
  }, []);

  const playSound = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    void audio.play().catch(() => {
      // Browsers can block audio until staff interacts with the page.
    });
  }, []);

  const poll = useCallback(async () => {
    if (isPollingRef.current || document.visibilityState === "hidden") return;
    isPollingRef.current = true;

    try {
      const checkpoint = sessionStorage.getItem(CHECKPOINT_KEY);
      const url = checkpoint
        ? `/api/admin/bookings/notifications?since=${encodeURIComponent(checkpoint)}`
        : "/api/admin/bookings/notifications";
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) return;

      const data = await response.json();
      const latestCreatedAt = typeof data?.latestCreatedAt === "string" ? data.latestCreatedAt : checkpoint;
      const bookings: BookingNotice[] = Array.isArray(data?.bookings) ? data.bookings : [];

      if (!checkpoint) {
        if (latestCreatedAt) sessionStorage.setItem(CHECKPOINT_KEY, latestCreatedAt);
        return;
      }

      const notifiedIds = readNotifiedIds();
      const notifiedSet = new Set(notifiedIds);
      const freshBookings = bookings.filter((booking) => booking.id && !notifiedSet.has(booking.id));

      if (freshBookings.length) {
        setNotifications((current) => [
          ...current,
          ...freshBookings.map((booking) => ({
            ...booking,
            toastId: `${booking.id}-${Date.now()}`,
          })),
        ]);

        writeNotifiedIds([...notifiedIds, ...freshBookings.map((booking) => booking.id)]);
        playSound();
      }

      if (latestCreatedAt) sessionStorage.setItem(CHECKPOINT_KEY, latestCreatedAt);
    } finally {
      isPollingRef.current = false;
    }
  }, [playSound]);

  useEffect(() => {
    void poll();

    const interval = window.setInterval(() => {
      void poll();
    }, POLL_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void poll();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [poll]);

  useEffect(() => {
    if (!notifications.length) return;

    const timers = notifications.map((notification) =>
      window.setTimeout(() => dismiss(notification.toastId), 9000)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [dismiss, notifications]);

  return (
    <>
      <audio ref={audioRef} preload="auto" src="/notifications/new-booking.wav" />
      <div className="pointer-events-none fixed right-4 top-4 z-50 grid w-[min(360px,calc(100vw-2rem))] gap-3">
        {notifications.map((notification) => (
          <div key={notification.toastId} className="pointer-events-auto rounded-[8px] border border-viaje-line bg-white p-4 text-viaje-navy shadow-xl">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-viaje-paperAlt text-viaje-red">
                <Bell className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">New Booking Received</p>
                <p className="mt-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-viaje-red">{notification.reference}</p>
                <p className="mt-1 truncate text-sm text-viaje-soft">{notification.packageTitle}</p>
                <Button
                  type="button"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    dismiss(notification.toastId);
                    router.push("/admin/bookings");
                  }}
                >
                  View Booking
                </Button>
              </div>
              <button
                type="button"
                className="rounded-full p-1 text-viaje-soft hover:bg-viaje-paperAlt hover:text-viaje-navy"
                onClick={() => dismiss(notification.toastId)}
                aria-label="Dismiss booking notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
