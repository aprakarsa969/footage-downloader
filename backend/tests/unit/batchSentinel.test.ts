// Unit test batch completion sentinel (tests/unit). Tanpa infra: semua dependency di-inject sebagai stub.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createBatchSentinel } from '../../src/workers/batchSentinel.js';

describe('batchSentinel', () => {
  it('null batchId → no-op', async () => {
    const calls = { count: 0, lock: 0, notify: 0, emit: 0 };
    const sentinel = createBatchSentinel({
      countByBatchAndStatus: async () => { calls.count++; return 0; },
      acquireLock: async () => { calls.lock++; return true; },
      createNotification: async () => { calls.notify++; },
      batchCompleted: () => { calls.emit++; },
    });
    await sentinel.notifyJobFinished(null, 'proj-1', 'user-1');
    assert.equal(calls.count, 0);
    assert.equal(calls.lock, 0);
    assert.equal(calls.notify, 0);
    assert.equal(calls.emit, 0);
  });

  it('remaining > 0 → no-op', async () => {
    const calls = { count: 0, lock: 0, notify: 0, emit: 0 };
    const sentinel = createBatchSentinel({
      countByBatchAndStatus: async () => { calls.count++; return 3; },
      acquireLock: async () => { calls.lock++; return true; },
      createNotification: async () => { calls.notify++; },
      batchCompleted: () => { calls.emit++; },
    });
    await sentinel.notifyJobFinished('batch-1', 'proj-1', 'user-1');
    assert.equal(calls.count, 1);
    assert.equal(calls.lock, 0);
    assert.equal(calls.notify, 0);
    assert.equal(calls.emit, 0);
  });

  it('remaining == 0, lock acquired → creates notification + emits event', async () => {
    const calls = { count: 0, lock: 0, notify: 0, emit: 0, notificationMsg: '' };
    const sentinel = createBatchSentinel({
      countByBatchAndStatus: async () => { calls.count++; return 0; },
      acquireLock: async () => { calls.lock++; return true; },
      createNotification: async (_u, _p, _b, msg) => { calls.notify++; calls.notificationMsg = msg; },
      batchCompleted: () => { calls.emit++; },
    });
    await sentinel.notifyJobFinished('batch-1', 'proj-1', 'user-1');
    assert.equal(calls.count, 4); // fast check + double-check + done count + failed count
    assert.equal(calls.lock, 1);
    assert.equal(calls.notify, 1);
    assert.equal(calls.emit, 1);
    assert.ok(calls.notificationMsg.includes('sukses'));
  });

  it('remaining == 0 but lock not acquired → skips event (exactly-once)', async () => {
    const calls = { count: 0, lock: 0, notify: 0, emit: 0 };
    const sentinel = createBatchSentinel({
      countByBatchAndStatus: async () => { calls.count++; return 0; },
      acquireLock: async () => { calls.lock++; return false; },
      createNotification: async () => { calls.notify++; },
      batchCompleted: () => { calls.emit++; },
    });
    await sentinel.notifyJobFinished('batch-1', 'proj-1', 'user-1');
    assert.equal(calls.lock, 1);
    assert.equal(calls.notify, 0);
    assert.equal(calls.emit, 0);
  });

  it('double-check: remaining == 0 at first, > 0 after lock → skips event', async () => {
    let count = 0;
    const calls = { lock: 0, notify: 0, emit: 0 };
    const sentinel = createBatchSentinel({
      countByBatchAndStatus: async () => { count++; return count <= 1 ? 0 : 1; },
      acquireLock: async () => { calls.lock++; return true; },
      createNotification: async () => { calls.notify++; },
      batchCompleted: () => { calls.emit++; },
    });
    await sentinel.notifyJobFinished('batch-1', 'proj-1', 'user-1');
    assert.equal(calls.lock, 1);
    assert.equal(calls.notify, 0);
    assert.equal(calls.emit, 0);
  });
});
