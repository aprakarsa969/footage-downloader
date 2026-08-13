// Unit test mapper response (src/utils/responses.ts). Murni pure function — tanpa infra.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  driveAccountToResponse,
  jobToResponse,
  jobToSummaryResponse,
  notificationToResponse,
  projectToResponse,
} from '../../src/utils/responses.js';

describe('responses', () => {
  it('jobToResponse: mapping snake_case + null passthrough', () => {
    const d = new Date('2026-08-01T00:00:00Z');
    const out = jobToResponse({
      id: 'j1',
      sourceUrl: 'u',
      platform: 'youtube',
      videoTitle: null,
      videoDurationSeconds: null,
      thumbnailUrl: null,
      mode: 'full',
      resolution: null,
      trimStartSeconds: null,
      trimEndSeconds: null,
      status: 'done',
      progressPercent: 100,
      fileName: null,
      driveFileUrl: null,
      errorMessage: null,
      batchId: null,
      createdAt: d,
      startedAt: null,
      finishedAt: d,
    });
    assert.equal(out.id, 'j1');
    assert.equal(out.source_url, 'u');
    assert.equal(out.progress_percent, 100);
    assert.equal(out.batch_id, null);
    assert.equal(out.created_at, d);
    assert.equal(out.finished_at, d);
  });

  it('jobToSummaryResponse: flatten project + null finished_at', () => {
    const out = jobToSummaryResponse({
      id: 'j1',
      projectId: 'p1',
      sourceUrl: 'u',
      videoTitle: 'T',
      platform: 'youtube',
      mode: 'full',
      status: 'pending',
      progressPercent: 0,
      errorMessage: null,
      driveFileUrl: null,
      createdAt: new Date(),
      finishedAt: null,
      project: { id: 'p1', name: 'Proyek 1' },
    });
    assert.equal(out.project_id, 'p1');
    assert.equal(out.project_name, 'Proyek 1');
    assert.equal(out.finished_at, null);
  });

  it('driveAccountToResponse: BigInt → string, null tetap null', () => {
    const d = new Date();
    const out = driveAccountToResponse(
      {
        id: 'a1',
        googleAccountEmail: 'x@gmail.com',
        storageUsedBytes: 100n,
        storageTotalBytes: null,
        isActive: true,
        connectedAt: d,
      },
      true,
    );
    assert.equal(out.storage_used_bytes, '100');
    assert.equal(out.storage_total_bytes, null);
    assert.equal(out.is_active, true);
    assert.equal(out.is_default, true);
  });

  it('notificationToResponse', () => {
    const out = notificationToResponse({
      id: 'n1',
      batchId: 'b1',
      projectId: null,
      message: 'm',
      isRead: false,
      createdAt: new Date(),
    });
    assert.equal(out.batch_id, 'b1');
    assert.equal(out.project_id, null);
    assert.equal(out.is_read, false);
  });

  it('projectToResponse', () => {
    const d = new Date();
    const out = projectToResponse({
      id: 'p1',
      name: 'P',
      driveAccountId: 'a1',
      driveFolderId: 'f1',
      driveFolderUrl: 'u',
      totalFootageCount: 3,
      createdAt: d,
      updatedAt: d,
    });
    assert.equal(out.total_footage_count, 3);
    assert.equal(out.drive_account_id, 'a1');
    assert.equal(out.created_at, d);
  });
});
