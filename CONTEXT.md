# Domain Glossary — Video Footage Downloader

## Batch Intake

**Module:** `backend/src/services/batchIntake.ts`
**Interface:** `createBatchIntake(deps)` → `submitBatch(userId, projectId, rawLinks)`

The intake seam for bulk download submissions. A user submits a batch of video URLs (max 50) with optional trim parameters. The module validates input via Zod schema, verifies project ownership, persists pending jobs to the database, and enqueues them to BullMQ for async processing.

**Key invariants:**
- All links in a batch share one `batchId` for completion tracking.
- Queue failures per-link are caught and marked `failed` without aborting the batch.
- Mode `timestamp` requires `trim_start_seconds` and `trim_end_seconds` (integers, `end > start >= 0`).

**Seam:** Two adapters behind the `BatchIntakeDeps` type — production deps (Prisma, BullMQ) and in-memory stubs for testing.

## Download Pipeline

**Module:** `backend/src/workers/downloadPipeline.ts`
**Interface:** `createDownloadPipeline(deps)` → `processJob(data)`

The core execution module for a single download job. Orchestrates metadata fetch, video download (full or trimmed segment), Google Drive upload, progress emission, and batch completion checks.

## Project

**Module:** `backend/src/services/projects.service.ts`

A workspace that groups download jobs. Each project has a Google Drive folder for storing downloaded footage. Soft-deleted projects retain their Drive folder.

## Drive Account

**Module:** `backend/src/services/driveAccounts.service.ts`

A linked Google Drive OAuth connection. Tokens are encrypted at rest. A project requires one active Drive account. One account can be set as the user's default.

## Drive Storage Adapter

**Module:** `backend/src/services/driveStorageAdapter.ts`
**Interface:** `createDriveStorageAdapter(deps)` → `DriveStorageAdapter`

Deep storage seam for all Google Drive operations. Encapsulates token decryption, auto-refresh of expired access tokens, client instantiation, and Google Drive API calls behind four business-intent methods: `createFolder`, `uploadFile`, `listFiles`, `deleteFile`.

**Key invariants:**
- Each method internally resolves an OAuth client: decrypt → check expiry → refresh if needed → persist new access token → build client.
- Callers never see `DriveOAuthClient` or token refresh logic.

**Seam:** Two adapters behind `DriveStorageDeps` — production deps (googleapis + Prisma) and in-memory stubs for testing.

## Job Realtime Sync Adapter

**Module:** `frontend/lib/jobSyncAdapter.ts` + `frontend/lib/jobCacheMutator.ts`
**Interface:** `createJobSyncAdapter()` → `jobSyncAdapter.subscribe(socket, queryClient)`

Deep realtime sync seam for job state updates. Binds Socket.IO events (`job:progress`, `job:done`, `job:failed`, `batch:completed`) to React Query cache mutations.

**Key invariants:**
- `jobCacheMutator.ts` contains pure cache transformation functions (`patchJobProgress`, `markJobDone`, `markJobFailed`, `handleBatchCompletion`) — isolated from socket wiring.
- `jobSyncAdapter.ts` wires socket events to cache mutators behind `subscribe()` which returns a cleanup function.
- UI hook (`useJobProgress.ts`) is a thin shell: get socket → subscribe → return cleanup.

**Seam:** `jobCacheMutator` functions are pure (QueryClient + payload) — unit testable without socket or React tree.

## Batch Completion Sentinel

**Module:** `backend/src/workers/batchSentinel.ts`
**Interface:** `createBatchSentinel(deps)` → `sentinel.notifyJobFinished(batchId, projectId, userId)`

Deep sentinel for batch completion. Guarantees exactly-once notification and event emission using an atomic lock (Redis `SET NX EX` in production, in-memory in tests).

**Key invariants:**
- Double-check lock pattern: fast check → acquire lock → re-check → notify.
- If lock acquisition fails (another worker is already processing), the sentinel skips — no duplicate notifications.
- Pipeline only calls `notifyJobFinished()` at the tail of each job; sentinel owns all batch completion logic.

**Seam:** Two adapters behind `BatchSentinelDeps` — production (Redis + Prisma) and in-memory stubs for testing.
