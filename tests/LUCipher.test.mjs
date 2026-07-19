import { describe, it, expect } from 'vitest';
import LUCipher from '../LUCipher.mjs';

const b64ToBytes = (s) => {
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) { bytes[i] = bin.charCodeAt(i); }
  return bytes;
};
const bytesToB64 = (bytes) => {
  let bin = '';
  for (const b of bytes) { bin += String.fromCharCode(b); }
  return btoa(bin);
};

describe('LUCipher v4 core (WebCrypto, async)', () => {
  it('constructor requires a keyword', () => {
    expect(() => new LUCipher('')).toThrow(/keyword is required/);
  });

  it('cipher rejects non-string input', async () => {
    await expect(new LUCipher('k').cipher(42)).rejects.toThrow(TypeError);
  });

  it('round-trips plain ASCII text', async () => {
    const luc = new LUCipher('miclave');
    const text = 'yo soy manufosela';
    expect(await luc.desCipher(await luc.cipher(text))).toBe(text);
  });

  it('produces a different ciphertext every time (random salt + iv)', async () => {
    const luc = new LUCipher('miclave');
    expect(await luc.cipher('mismo texto')).not.toBe(await luc.cipher('mismo texto'));
  });

  it('preserves unicode characters (½ ¬ € » µ)', async () => {
    const luc = new LUCipher('miclave');
    const text = 'precio: 5€ ½ litro » café µ ¬ ŋ 日本語';
    expect(await luc.desCipher(await luc.cipher(text))).toBe(text);
  });

  it('round-trips the empty string', async () => {
    const luc = new LUCipher('miclave');
    expect(await luc.desCipher(await luc.cipher(''))).toBe('');
  });

  it('uses the v4 version byte', async () => {
    const blob = await new LUCipher('miclave').cipher('x');
    expect(b64ToBytes(blob)[0]).toBe(4);
  });

  it('detects tampering (rejects on a flipped byte)', async () => {
    const luc = new LUCipher('miclave');
    const bytes = b64ToBytes(await luc.cipher('dato sensible'));
    bytes[bytes.length - 1] ^= 0x01;
    await expect(luc.desCipher(bytesToB64(bytes))).rejects.toThrow();
  });

  it('fails with the wrong key', async () => {
    const blob = await new LUCipher('claveA').cipher('secreto');
    await expect(new LUCipher('claveB').desCipher(blob)).rejects.toThrow();
  });

  it('rejects a non-v4 format', async () => {
    await expect(new LUCipher('k').desCipher(bytesToB64(new Uint8Array([9, 9, 9])))).rejects.toThrow(/v4/);
  });
});
