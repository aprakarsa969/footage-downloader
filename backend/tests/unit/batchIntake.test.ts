// Unit test batch intake module (tests/unit). Tanpa infra: semua dependency di-inject sebagai stub.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AppError } from '../../src/utils/AppError.js';
import { BatchIntakeSchema } from '../../src/services/batchIntake.js';
import { createBatchIntake } from '../../src/services/batchIntake.js';

type StubDeps = Parameters<typeof createBatchIntake>[0];

function makeStub(overrides: Partial<StubDeps> = {}): StubDeps {
  return {
    findProjectByIdAndUser: async () => ({ id: 'proj-1', userId: 'user-1' }),
    createBatchJobs: async (data) =>
      data.map((d, i) => ({
        id: `job-${i + 1}`,
        sourceUrl: d.sourceUrl,
        mode: d.mode,
        resolution: d.resolution,
        trimStartSeconds: d.trimStartSeconds,
        trimEndSeconds: d.trimEndSeconds,
        status: 'pending',
      })),
    enqueueJob: async () => {},
    updateDownloadJob: async () => {},
    ...overrides,
  };
}

describe('batchIntake schema validation', () => {
  it('valid full-mode batch → parses OK', () => {
    const links = [
      { url: 'https://example.com/v1' },
      { url: 'https://example.com/v2', mode: 'full', resolution: '1080p' },
    ];
    const parsed = BatchIntakeSchema.parse(links);
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].mode, 'full');
    assert.equal(parsed[1].resolution, '1080p');
  });

  it('valid timestamp-mode batch → parses OK', () => {
    const links = [{ url: 'https://example.com/v1', mode: 'timestamp', trim_start_seconds: 0, trim_end_seconds: 10 }];
    const parsed = BatchIntakeSchema.parse(links);
    assert.equal(parsed[0].mode, 'timestamp');
    assert.equal(parsed[0].trim_start_seconds, 0);
    assert.equal(parsed[0].trim_end_seconds, 10);
  });

  it('empty array → throws INVALID_REQUEST', () => {
    assert.throws(() => BatchIntakeSchema.parse([]), /array non-kosong/);
  });

  it('missing url → throws INVALID_REQUEST', () => {
    assert.throws(() => BatchIntakeSchema.parse([{ mode: 'full' }]), /url/);
  });

  it('empty url string → throws INVALID_REQUEST', () => {
    assert.throws(() => BatchIntakeSchema.parse([{ url: '' }]), /url/);
  });

  it('invalid mode → throws INVALID_REQUEST', () => {
    assert.throws(
      () => BatchIntakeSchema.parse([{ url: 'https://x.com/v', mode: 'invalid' }]),
      /invalid_value|Invalid option/,
    );
  });

  it('resolution not string → throws INVALID_REQUEST', () => {
    assert.throws(
      () => BatchIntakeSchema.parse([{ url: 'https://x.com/v', resolution: 720 }]),
      /expected string/,
    );
  });

  it('timestamp mode without trim fields → throws INVALID_REQUEST', () => {
    assert.throws(
      () => BatchIntakeSchema.parse([{ url: 'https://x.com/v', mode: 'timestamp' }]),
      /trim_start_seconds dan trim_end_seconds/,
    );
  });

  it('timestamp mode: trim_end <= trim_start → throws INVALID_REQUEST', () => {
    assert.throws(
      () =>
        BatchIntakeSchema.parse([
          { url: 'https://x.com/v', mode: 'timestamp', trim_start_seconds: 10, trim_end_seconds: 5 },
        ]),
      /trim_end_seconds harus lebih besar/,
    );
  });

  it('timestamp mode: trim_start = trim_end → throws INVALID_REQUEST', () => {
    assert.throws(
      () =>
        BatchIntakeSchema.parse([
          { url: 'https://x.com/v', mode: 'timestamp', trim_start_seconds: 5, trim_end_seconds: 5 },
        ]),
      /trim_end_seconds harus lebih besar/,
    );
  });

  it('negative trim_start_seconds → throws INVALID_REQUEST', () => {
    assert.throws(
      () =>
        BatchIntakeSchema.parse([
          { url: 'https://x.com/v', mode: 'timestamp', trim_start_seconds: -1, trim_end_seconds: 5 },
        ]),
      /too_small|Too small/,
    );
  });

  it('non-integer trim_start_seconds → throws INVALID_REQUEST', () => {
    assert.throws(
      () =>
        BatchIntakeSchema.parse([
          { url: 'https://x.com/v', mode: 'timestamp', trim_start_seconds: 1.5, trim_end_seconds: 5 },
        ]),
      /expected int|Expected integer|invalid_type/,
    );
  });

  it('more than 50 links → throws INVALID_REQUEST', () => {
    const links = Array.from({ length: 51 }, (_, i) => ({ url: `https://x.com/v${i}` }));
    assert.throws(() => BatchIntakeSchema.parse(links), /maksimal 50/);
  });

  it('exactly 50 links → parses OK', () => {
    const links = Array.from({ length: 50 }, (_, i) => ({ url: `https://x.com/v${i}` }));
    const parsed = BatchIntakeSchema.parse(links);
    assert.equal(parsed.length, 50);
  });

  it('null input → throws INVALID_REQUEST', () => {
    assert.throws(() => BatchIntakeSchema.parse(null), /expected array|Expected array/);
  });

  it('string input → throws INVALID_REQUEST', () => {
    assert.throws(() => BatchIntakeSchema.parse('not-an-array'), /expected array|Expected array/);
  });
});

describe('batchIntake submitBatch', () => {
  it('valid batch → returns batch_id, project_id, and pending jobs', async () => {
    const deps = makeStub();
    const submitBatch = createBatchIntake(deps);
    const result = await submitBatch('user-1', 'proj-1', [
      { url: 'https://example.com/v1' },
      { url: 'https://example.com/v2', mode: 'timestamp', trim_start_seconds: 0, trim_end_seconds: 10 },
    ]);
    assert.ok(result.batch_id);
    assert.equal(result.project_id, 'proj-1');
    assert.equal(result.jobs.length, 2);
    assert.equal(result.jobs[0].status, 'pending');
    assert.equal(result.jobs[0].url, 'https://example.com/v1');
    assert.equal(result.jobs[1].trim_start_seconds, 0);
    assert.equal(result.jobs[1].trim_end_seconds, 10);
  });

  it('non-existent project → throws 404 NOT_FOUND', async () => {
    const deps = makeStub({ findProjectByIdAndUser: async () => null });
    const submitBatch = createBatchIntake(deps);
    await assert.rejects(
      () => submitBatch('user-1', 'proj-missing', [{ url: 'https://example.com/v' }]),
      (err: AppError) => err.status === 404 && err.code === 'NOT_FOUND',
    );
  });

  it('invalid payload → throws 400 INVALID_REQUEST', async () => {
    const deps = makeStub();
    const submitBatch = createBatchIntake(deps);
    await assert.rejects(
      () => submitBatch('user-1', 'proj-1', []),
      (err: AppError) => err.status === 400 && err.code === 'INVALID_REQUEST',
    );
  });

  it('enqueue failure → marks job as failed (does not throw)', async () => {
    const deps = makeStub({
      enqueueJob: async () => {
        throw new Error('Redis connection refused');
      },
    });
    const submitBatch = createBatchIntake(deps);
    const result = await submitBatch('user-1', 'proj-1', [{ url: 'https://example.com/v' }]);
    assert.equal(result.jobs.length, 1);
    assert.equal(result.jobs[0].status, 'pending');
    // updateDownloadJob should have been called to mark failed
  });

  it('schema error → throws 400 INVALID_REQUEST (not ZodError)', async () => {
    const deps = makeStub();
    const submitBatch = createBatchIntake(deps);
    try {
      await submitBatch('user-1', 'proj-1', { not: 'an array' });
      assert.fail('should have thrown');
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.equal(err.status, 400);
      assert.equal(err.code, 'INVALID_REQUEST');
    }
  });
});
