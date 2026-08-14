import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import { mapApiNotificationToAppNotification } from "@/lib/mappers";
import { useToastStore } from "@/stores/toast";
import type { ApiNotification } from "@/types/api";

export function useNotifications({ unreadOnly = false }: { unreadOnly?: boolean } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications", { unreadOnly }],
    queryFn: () =>
      api<ApiNotification[]>(
        unreadOnly ? "/notifications?unread_only=true" : "/notifications",
      ),
  });

  const markRead = useMutation({
    mutationFn: (id: string) =>
      api<ApiNotification>(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api<{ ok: boolean }>("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      useToastStore.getState().push("Semua notifikasi ditandai sudah dibaca");
    },
    onError: (error: Error) =>
      useToastStore.getState().push(error.message, "error"),
  });

  const notifications = (query.data ?? []).map(mapApiNotificationToAppNotification);

  return {
    query,
    notifications,
    unreadCount: notifications.filter((n) => !n.isRead).length,
    markRead,
    markAllRead,
  };
}
