"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Hook for subscribing to Supabase real-time changes on a table.
 *
 * Usage:
 *   const { events, isConnected } = useRealtime("contacts", userId);
 *
 * The hook returns events as they arrive. The consuming component
 * should use events to trigger a refetch of its data.
 */
export function useRealtime(
  table: string,
  userId?: string,
  options?: { onInsert?: (payload: any) => void; onUpdate?: (payload: any) => void; onDelete?: (payload: any) => void }
) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; timestamp: number } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    const channel: RealtimeChannel = supabase
      .channel(`${table}-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table, filter: `user_id=eq.${userId}` },
        (payload) => {
          setLastEvent({ type: "INSERT", timestamp: Date.now() });
          options?.onInsert?.(payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table, filter: `user_id=eq.${userId}` },
        (payload) => {
          setLastEvent({ type: "UPDATE", timestamp: Date.now() });
          options?.onUpdate?.(payload);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table },
        (payload) => {
          setLastEvent({ type: "DELETE", timestamp: Date.now() });
          options?.onDelete?.(payload);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, userId, supabase]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isConnected, lastEvent };
}
