import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import prisma from '../../src/config/prisma.js';
import { encrypt } from '../../src/lib/encryption.js';

const BASE = process.env.BASE_URL ?? 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const YT = 'https://www.youtube.com/watch?v=aqz-KE-bpKQ';

function api(path: string, token: string, method = 'GET', body?: unknown) {
  return fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function waitFinal(projectId: string, token: string, timeoutMs = 240000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = await api(`/projects/${projectId}/jobs`, token);
    const body = await res.json();
    const active = body.data.filter((j: { status: string }) => j.status === 'pending' || j.status === 'processing');
    if (active.length === 0) {
      return body.data;
    }
    if (Date.now() > deadline) throw new Error('timeout tunggu job final');
    await new Promise((r) => setTimeout(r, 2000));
  }
}

async function main() {
  const email = 'test-retry-cancel@example.com';
  const user = await prisma.user.upsert({
    where: { email },
    create: { googleId: `google-${randomUUID()}`, email, name: 'Test Retry Cancel' },
    update: {},
  });
  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });

  const encrypted = encrypt('dummy-refresh-token-for-test');
  const account = await prisma.driveAccount.create({
    data: {
      userId: user.id,
      googleAccountEmail: 'dummy-rc@gmail.com',
      accessToken: encrypted,
      refreshToken: encrypted,
      tokenExpiresAt: new Date(0),
      isActive: true,
    },
  });

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      driveAccountId: account.id,
      name: 'Test Retry Cancel',
      driveFolderId: `dummy-${randomUUID()}`,
      driveFolderUrl: 'https://drive.google.com/drive/folders/dummy',
    },
  });
  console.log('project:', project.id);

  const batchRes = await api(`/projects/${project.id}/jobs`, token, 'POST', {
    links: [
      { url: YT, resolution: '360' },
      { url: 'https://example.com' },
    ],
  });
  const batch = await batchRes.json();
  console.log('batch:', batchRes.status, batch.jobs.map((j: { id: string; status: string }) => j.status).join(','));

  const jobs = await waitFinal(project.id, token);
  console.log('final statuses:', jobs.map((j: { status: string; platform: string }) => `${j.status}/${j.platform}`).join(', '));
  const failedJob = jobs.find((j: { status: string }) => j.status === 'failed');
  if (!failedJob) throw new Error('tidak ada job failed');

  const retryRes = await api(`/jobs/${failedJob.id}/retry`, token, 'POST');
  const retried = await retryRes.json();
  console.log('retry:', retryRes.status, `status=${retried.status} batch=${retried.batch_id}`);

  const retryWrong = await api(`/jobs/${failedJob.id}/retry`, token, 'POST');
  console.log('retry lg (harus 409):', retryWrong.status);

  const [afterRetry] = await waitFinal(project.id, token);
  console.log('after retry:', `status=${afterRetry.status} retryCount=${afterRetry.retry_count}`);

  const cancelRes = await api(`/jobs/${afterRetry.id}/cancel`, token, 'POST');
  const cancelled = await cancelRes.json();
  console.log('cancel(processing/failed → cancelled?):', cancelRes.status, cancelled.status);

  const cancelBad = await api(`/jobs/${afterRetry.id}/cancel`, token, 'POST');
  console.log('cancel lg (harus 409):', cancelBad.status);

  const cancelBatch = await api(`/projects/${project.id}/jobs`, token, 'POST', {
    links: [{ url: YT, resolution: '360' }],
  });
  const cb = await cancelBatch.json();
  const cj = cb.jobs[0];
  const cancelRes2 = await api(`/jobs/${cj.id}/cancel`, token, 'POST');
  console.log('cancel pending/processing:', cancelRes2.status, (await cancelRes2.json()).status);
  await new Promise((r) => setTimeout(r, 5000));
  const afterCancel = await api(`/jobs/${cj.id}`, token);
  console.log('status setelah 5s (harus cancelled):', (await afterCancel.json()).status);

  const notifRes = await api('/notifications', token);
  const notifs = await notifRes.json();
  console.log('notif list:', notifRes.status, 'total=', notifs.length, notifs.map((n: { message: string }) => n.message).join(' | '));

  const unreadRes = await api('/notifications?unread_only=true', token);
  const unread = await unreadRes.json();
  console.log('notif unread:', unread.length);

  const first = notifs[0];
  const readRes = await api(`/notifications/${first.id}/read`, token, 'PATCH');
  console.log('mark read:', readRes.status, (await readRes.json()).is_read);

  const missingRes = await api('/notifications/nonexistent/read', token, 'PATCH');
  console.log('read nonexistent (harus 404):', missingRes.status);

  const allRes = await api('/notifications/read-all', token, 'PATCH');
  console.log('read-all:', allRes.status, JSON.stringify(await allRes.json()));
  const afterAll = await api('/notifications?unread_only=true', token);
  console.log('notif unread setelah read-all (harus 0):', (await afterAll.json()).length);

  await prisma.downloadJob.deleteMany({ where: { project: { userId: user.id } } });
  await prisma.notification.deleteMany({ where: { userId: user.id } });
  await prisma.project.deleteMany({ where: { userId: user.id } });
  await prisma.driveAccount.deleteMany({ where: { userId: user.id } });
  await prisma.user.deleteMany({ where: { id: user.id } });
  console.log('cleanup selesai');
}

main().catch((e) => {
  console.error('FAIL:', e);
  process.exit(1);
});
