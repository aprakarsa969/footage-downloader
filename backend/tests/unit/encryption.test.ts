// Unit test enkripsi token Google (src/lib/encryption.ts).
// ENCRYPTION_KEY di-set sebelum dynamic import (modul baca env saat load).
process.env.ENCRYPTION_KEY = 'unit-test-key';
const { encrypt, decrypt } = await import('../../src/lib/encryption.js');
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

describe('encryption', () => {
  it('round-trip: encrypt → decrypt mengembalikan teks asli', () => {
    const c = encrypt('rahasia-123');
    assert.equal(decrypt(c), 'rahasia-123');
  });

  it('iv acak → ciphertext beda tiap pemanggilan, keduanya valid', () => {
    const a = encrypt('sama');
    const b = encrypt('sama');
    assert.notEqual(a, b);
    assert.equal(decrypt(a), 'sama');
    assert.equal(decrypt(b), 'sama');
  });

  it('payload rusak (tamper) → throw (GCM auth tag gagal)', () => {
    const c = encrypt('x');
    const tampered = c.slice(0, -1) + (c.endsWith('0') ? '1' : '0');
    assert.throws(() => decrypt(tampered));
  });

  it('format invalid → throw', () => {
    assert.throws(() => decrypt('not-a-valid-payload'));
  });
});
