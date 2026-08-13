import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import prisma from '../../src/config/prisma.js';

const BASE = process.env.BASE_URL ?? 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';

function api(path: string, token: string, method = 'GET', body?: unknown) {
  return fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const JOB_SEED = [
  { status: 'done', platform: 'youtube', progressPercent: 100, finishedAt: new Date('2026-08-01T10:00:00Z') },
  { status: 'done', platform: 'youtube', progressPercent: 100, finishedAt: new Date('2026-08-02T10:00:00Z') },
  { status: 'failed', platform: 'youtube', progressPercent: 0, finishedAt: new Date('2026-08-03T10:00:00Z'), errorMessage: 'x' },
  { status: 'failed', platform: 'tiktok', progressPercent: 0, finishedAt: new Date('2026-08-04T10:00:00Z'), errorMessage: 'y' },
  { status: 'cancelled', platform: 'youtube', progressPercent: 0, finishedAt: new Date('2026-08-05T10:00:00Z') },
  { status: 'pending', platform: 'unknown', progressPercent: 0 },
  { status: 'processing', platform: 'youtube', progressPercent: 40 },
];

async function main() {
  const email = 'test-dashboard@example.com';
  const user = await prisma.user.upsert({
    where: { email },
    create: { googleId: `google-${randomUUID()}`, email, name: 'Test Dashboard' },
    update: {},
  });
  const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });

  const acc1 = await prisma.driveAccount.create({
    data: {
      userId: user.id,
      googleAccountEmail: 'dash-1@gmail.com',
      accessToken: 'x',
      refreshToken: 'x',
      tokenExpiresAt: new Date(0),
      storageUsedBytes: 100n,
      storageTotalBytes: 1000n,
      isActive: true,
    },
  });
  const acc2 = await prisma.driveAccount.create({
    data: {
      userId: user.id,
      googleAccountEmail: 'dash-2@gmail.com',
      accessToken: 'x',
      refreshToken: 'x',
      tokenExpiresAt: new Date(0),
      storageUsedBytes: 200n,
      storageTotalBytes: 2000n,
      isActive: true,
    },
  });
  const accInactive = await prisma.driveAccount.create({
    data: {
      userId: user.id,
      googleAccountEmail: 'dash-inactive@gmail.com',
      accessToken: 'x',
      refreshToken: 'x',
      tokenExpiresAt: new Date(0),
      storageUsedBytes: 999n,
      storageTotalBytes: 999n,
      isActive: false,
    },
  });

  const proj1 = await prisma.project.create({
    data: {
      userId: user.id,
      driveAccountId: acc1.id,
      name: 'Dash Project 1',
      driveFolderId: 'd1',
      driveFolderUrl: 'https://drive.google.com/drive/folders/d1',
      totalFootageCount: 5,
    },
  });
  const proj2 = await prisma.project.create({
    data: {
      userId: user.id,
      driveAccountId: acc2.id,
      name: 'Dash Project 2',
      driveFolderId: 'd2',
      driveFolderUrl: 'https://drive.google.com/drive/folders/d2',
      totalFootageCount: 7,
    },
  });

  await prisma.downloadJob.createMany({
    data: JOB_SEED.map((j) => ({
      projectId: proj1.id,
      sourceUrl: `https://example.com/${j.status}`,
      mode: 'full',
      ...j,
    })),
  });
  await prisma.downloadJob.create({
    data: {
      projectId: proj1.id,
      sourceUrl: 'https://x',
      mode: 'timestamp',
      status: 'done',
      platform: 'youtube',
      progressPercent: 100,
      finishedAt: new Date('2026-07-30T10:00:00Z'),
    },
  });
  await prisma.downloadJob.create({
    data: {
      projectId: proj2.id,
      sourceUrl: 'https://y',
      mode: 'full',
      status: 'pending',
      platform: 'unknown',
      progressPercent: 0,
    },
  });

  const summaryRes = await api('/dashboard/summary', token);
  const s = await summaryRes.json();
  console.log('summary:', summaryRes.status, JSON.stringify(s));

  const activeRes = await api('/dashboard/active-jobs', token);
  const a = await activeRes.json();
  console.log('active-jobs:', activeRes.status, 'total=', a.total,
    a.data.map((j: { status: string; project_name: string }) => `${j.status}/${j.project_name}`).join(', '));

  const histRes = await api('/dashboard/history?page=1&limit=50', token);
  const h = await histRes.json();
  console.log('history (all):', histRes.status, 'total=', h.total);

  const hStatus = await api('/dashboard/history?status=done', token);
  console.log('history status=done:', (await hStatus.json()).total);
  const hPlatform = await api('/dashboard/history?platform=tiktok', token);
  console.log('history platform=tiktok:', (await hPlatform.json()).total);
  const hRange = await api('/dashboard/history?from=2026-08-01T00:00:00Z&to=2026-08-03T23:59:59Z', token);
  console.log('history from/to:', (await hRange.json()).total);
  const hProj = await api(`/dashboard/history?project_id=${proj2.id}`, token);
  console.log('history project2:', (await hProj.json()).total);
  const hBad = await api('/dashboard/history?status=nope', token);
  console.log('history status invalid (400):', hBad.status);
  const hDate = await api('/dashboard/history?from=bogus', token);
  console.log('history date invalid (400):', hDate.status);
  const hRangeBad = await api('/dashboard/history?from=2026-09-01T00:00:00Z&to=2026-08-01T00:00:00Z', token);
  console.log('history from>to (400):', hRangeBad.status);
  const hForeign = await api('/dashboard/history?project_id=nonexistent', token);
  console.log('history project asing (404):', hForeign.status);
  const noToken = await api('/dashboard/summary', '');
  console.log('tanpa token (401):', noToken.status);

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
