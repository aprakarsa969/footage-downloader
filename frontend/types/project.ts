export type Project = {
  id: string;
  name: string;
  footageCount: number;
  driveAccountEmail?: string;
  driveFolderUrl?: string;
  recentThumbnails: string[];
  createdAt: string;
};
