import { expect, it } from 'vitest';
import { makeQr } from '../src/qr';
it.each(['WIFI:T:nopass;S:Cat;;', '猫'.repeat(250)])('keeps the encoder functional mask across versions', payload => {
  const qr = makeQr(payload);
  expect(qr.bits.length).toBe(qr.size ** 2); expect(qr.reserved.length).toBe(qr.bits.length);
  for (let row = 0; row < 8; row++) for (let col = 0; col < 8; col++) expect(qr.reserved[row * qr.size + col]).toBe(1);
  for (let col = 8; col < qr.size - 8; col++) expect(qr.reserved[6 * qr.size + col]).toBe(1);
  expect(qr.reserved[(qr.size - 8) * qr.size + 8]).toBe(1);
  expect(qr.bits[(qr.size - 8) * qr.size + 8]).toBe(1);
  if (qr.version >= 7) expect(qr.reserved[(qr.size - 11)]).toBe(1);
});
