# Rancangan Database: Backend (Prisma Schema)

Database: PostgreSQL (local via Docker)
ORM: Prisma

Struktur tabel sama dengan rancangan sebelumnya, di sini disajikan dalam format `schema.prisma` supaya bisa langsung dipakai backend.

---

## `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum JobMode {
  full
  timestamp
}

enum JobStatus {
  pending
  processing
  done
  failed
  cancelled
}

model User {
  id                     String   @id @default(uuid())
  googleId               String   @unique @map("google_id")
  email                  String   @unique
  name                   String
  avatarUrl              String?  @map("avatar_url")
  defaultDriveAccountId  String?  @map("default_drive_account_id")
  notifEmailEnabled      Boolean  @default(true) @map("notif_email_enabled")
  notifInappEnabled      Boolean  @default(true) @map("notif_inapp_enabled")
  createdAt              DateTime @default(now()) @map("created_at")
  updatedAt              DateTime @updatedAt @map("updated_at")

  driveAccounts   DriveAccount[]
  projects        Project[]
  notifications   Notification[]

  @@map("users")
}

model DriveAccount {
  id                  String   @id @default(uuid())
  userId              String   @map("user_id")
  googleAccountEmail  String   @map("google_account_email")
  accessToken         String   @map("access_token") // disimpan terenkripsi
  refreshToken        String   @map("refresh_token") // disimpan terenkripsi
  tokenExpiresAt      DateTime @map("token_expires_at")
  storageUsedBytes    BigInt?  @map("storage_used_bytes")
  storageTotalBytes   BigInt?  @map("storage_total_bytes")
  isActive            Boolean  @default(true) @map("is_active")
  connectedAt         DateTime @default(now()) @map("connected_at")

  user      User      @relation(fields: [userId], references: [id])
  projects  Project[]

  @@map("drive_accounts")
}

model Project {
  id                 String   @id @default(uuid())
  userId             String   @map("user_id")
  driveAccountId     String   @map("drive_account_id")
  name               String
  driveFolderId      String   @map("drive_folder_id")
  driveFolderUrl     String   @map("drive_folder_url")
  totalFootageCount  Int      @default(0) @map("total_footage_count")
  deletedAt          DateTime? @map("deleted_at")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  user           User           @relation(fields: [userId], references: [id])
  driveAccount   DriveAccount   @relation(fields: [driveAccountId], references: [id])
  downloadJobs   DownloadJob[]
  notifications  Notification[]

  @@map("projects")
}

model DownloadJob {
  id                     String    @id @default(uuid())
  projectId              String    @map("project_id")
  sourceUrl              String    @map("source_url")
  platform               String
  videoTitle             String?   @map("video_title")
  videoDurationSeconds   Int?      @map("video_duration_seconds")
  thumbnailUrl           String?   @map("thumbnail_url")
  mode                   JobMode
  trimStartSeconds       Int?      @map("trim_start_seconds")
  trimEndSeconds         Int?      @map("trim_end_seconds")
  resolution             String?
  status                 JobStatus @default(pending)
  progressPercent        Int       @default(0) @map("progress_percent")
  fileName               String?   @map("file_name")
  driveFileId            String?   @map("drive_file_id")
  driveFileUrl           String?   @map("drive_file_url")
  errorMessage           String?   @map("error_message")
  retryCount             Int       @default(0) @map("retry_count")
  batchId                String?   @map("batch_id")
  createdAt              DateTime  @default(now()) @map("created_at")
  startedAt              DateTime? @map("started_at")
  finishedAt             DateTime? @map("finished_at")

  project  Project @relation(fields: [projectId], references: [id])

  @@index([projectId, status])
  @@index([batchId])
  @@index([status])
  @@map("download_jobs")
}

model Notification {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  batchId    String?  @map("batch_id")
  projectId  String?  @map("project_id")
  message    String
  isRead     Boolean  @default(false) @map("is_read")
  createdAt  DateTime @default(now()) @map("created_at")

  user     User     @relation(fields: [userId], references: [id])
  project  Project? @relation(fields: [projectId], references: [id])

  @@map("notifications")
}
```

---

## Setup Local (Docker Compose)

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: footage_user
      POSTGRES_PASSWORD: footage_pass
      POSTGRES_DB: footage_downloader
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

`.env` (contoh):
```
DATABASE_URL="postgresql://footage_user:footage_pass@localhost:5432/footage_downloader"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="ganti-dengan-secret-acak"
ENCRYPTION_KEY="ganti-dengan-32-byte-key"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI="http://localhost:4000/auth/google/callback"
GOOGLE_DRIVE_REDIRECT_URI="http://localhost:4000/drive-accounts/connect/callback"
PORT=4000
```

## Perintah Setup Awal

```bash
docker compose up -d
npx prisma migrate dev --name init
npx prisma generate
```

---

## Catatan
- Field `accessToken`/`refreshToken` disimpan sebagai `String` di schema, tapi **wajib dienkripsi di level aplikasi** (bukan plain text) sebelum insert ke DB — enkripsi/dekripsi dilakukan di service layer, bukan di Prisma langsung.
- `deletedAt` ditambahkan di `Project` untuk soft delete (sesuai catatan di rancangan sebelumnya).
- Enum `JobMode` dan `JobStatus` memakai native Postgres enum via Prisma — memudahkan validasi di level database.
