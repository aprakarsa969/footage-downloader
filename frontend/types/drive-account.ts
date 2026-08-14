export type DriveAccount = {
  id: string;
  email: string;
  isDefault: boolean;
  isActive: boolean;
  storageUsedBytes: number;
  storageTotalBytes: number;
  connectedAt: string;
};
