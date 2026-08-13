import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { io, type Socket } from 'socket.io-client';
import prisma from '../../src/config/prisma.js';
import { encrypt } from '../../src/lib/encryption.js';

const BASE = 'http://localhost:4000';
const JWT_SECRET = process.env.JWT_SECRET!;

type Emitted = { event: string; data: any };

function collect(socket: Socket, events: string[]): Emitted[] {
  const out: Emitted[] = [];
  for (const ev of events) {
    socket.on(ev as any, (data: any) => out.push({ event: ev, data }));
  }
  return out;
}

async function main() {
  const a = await prisma.user.upsert({ where: { googleId: 'sock-user-a' }, update: {}, create: { googleId: 'sock-user-a', email: 'sock-a@example.com', name: 'Sock A' } });
  const b = await prisma.user.upsert({ where: { googleId: 'sock-user-b' }, update: {}, create: { googleId: 'sock-user-b', email: 'sock-b@example.com', name: 'Sock B' } });
  const enc = encrypt('dummy-refresh-token-for-test');
  const acc = await prisma.driveAccount.create({ data: { userId: a.id, googleAccountEmail: 'sock-a@example.com', accessToken: enc, refreshToken: enc, tokenExpiresAt: new Date(0), isActive: true } });
  const proj = await prisma.project.create({ data: { userId: a.id, driveAccountId: acc.id, name: 'Sock Test Project', driveFolderId: 'fake-folder-id', driveFolderUrl: 'https://drive.google.com/fake' } });

  const tokenA = jwt.sign({ sub: a.id }, JWT_SECRET, { expiresIn: '1h' });
  const tokenB = jwt.sign({ sub: b.id }, JWT_SECRET, { expiresIn: '1h' });

  const sockA = io(BASE, { auth: { token: tokenA } });
  const sockB = io(BASE, { auth: { token: tokenB } });
  const eventsA = collect(sockA, ['job:progress', 'job:done', 'job:failed', 'batch:completed']);
  const eventsB = collect(sockB, ['job:progress', 'job:done', 'job:failed', 'batch:completed']);

  await new Promise<void>((res) => { sockA.on('connect', () => res()); });
  await new Promise<void>((res) => { sockB.on('connect', () => res()); });
  console.log('kedua socket terhubung');

  let stages: string[] = [];
  let failedEv: Emitted | undefined;
  let batchEv: Emitted | undefined;
  for (let attempt = 1; attempt <= 4 && !stages.includes('40/downloading'); attempt++) {
    eventsA.length = 0;
    const res = await fetch(`${BASE}/projects/${proj.id}/jobs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenA}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ links: [{ url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', resolution: '360' }] }),
    });
    const body = await res.json();
    console.log(`submit #${attempt}:`, res.status, JSON.stringify(body));

    const deadline = Date.now() + 180000;
    while (Date.now() < deadline && !eventsA.some((e) => e.event === 'batch:completed')) {
      await new Promise((r) => setTimeout(r, 1000));
    }

    stages = eventsA.filter((e) => e.event === 'job:progress').map((e) => `${e.data.progress_percent}/${e.data.stage}`);
    failedEv = eventsA.find((e) => e.event === 'job:failed');
    batchEv = eventsA.find((e) => e.event === 'batch:completed');
    console.log(`  #${attempt} stages:`, stages.join(' '), '| failed:', failedEv?.data?.error_message);
  }

  const doneEv = eventsA.find((e) => e.event === 'job:done');

  console.log('A stages:', stages.join(' '));
  console.log('A failed:', JSON.stringify(failedEv?.data));
  console.log('A batch:', JSON.stringify(batchEv?.data));
  console.log('A done:', JSON.stringify(doneEv?.data));
  console.log('B events (harus 0):', eventsB.length);

  const pass =
    stages.includes('10/downloading') &&
    stages.includes('40/downloading') &&
    !!failedEv?.data?.error_message &&
    batchEv?.data?.total === 1 && batchEv.data.done === 0 && batchEv.data.failed === 1 &&
    eventsB.length === 0;
  console.log(pass ? 'PASS' : 'FAIL');

  sockA.disconnect();
  sockB.disconnect();
  await prisma.notification.deleteMany({ where: { userId: a.id } });
  await prisma.downloadJob.deleteMany({ where: { project: { userId: a.id } } });
  await prisma.project.deleteMany({ where: { userId: a.id } });
  await prisma.driveAccount.deleteMany({ where: { userId: a.id } });
  await prisma.user.deleteMany({ where: { googleId: { in: ['sock-user-a', 'sock-user-b'] } } });
  await prisma.$disconnect();
  process.exit(pass ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
