export type AppNotification = {
  id: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  projectId?: string;
};
