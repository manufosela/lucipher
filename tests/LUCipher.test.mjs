import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import LUCipher from '../LUCipher.mjs';

// Reproduces v2 encryption (AES-128-CBC + fixed IV + manual noise) with node:crypto
// only, so these tests do not depend on the removed wordsnoise package.
function encryptV2(keyword, saltCtor, text) {
  const key = keyword.padStart(32, 'SD0susEWo0pKd7qas#Y(qmXXd9S1lv14').slice(0, 32);
  const salt = saltCtor.padStart(16, 'ABj4PQgf3j5gblQ0').slice(0, 16);
  const derived = crypto.pbkdf2Sync(Buffer.from(key), Buffer.from(salt), 65536, 16, 'sha1');
  const cipher = crypto.createCipheriv('aes-128-cbc', derived, 'aAB1jhPQ89o=f619');
  const noisy = `»${text.slice(0, 3)}€${text.slice(3)}½`; // inject noise chars manually
  return cipher.update(noisy, 'utf8', 'base64') + cipher.final('base64');
}

describe('LUCipher v3 core', () => {
  it('constructor requires a keyword', () => {
    expect(() => new LUCipher('')).toThrow(/keyword is required/);
  });

  it('cipher rejects non-string input', () => {
    expect(() => new LUCipher('k').cipher(42)).toThrow(TypeError);
  });

  it('round-trips plain ASCII text', () => {
    const luc = new LUCipher('miclave');
    const text = 'yo soy manufosela';
    expect(luc.desCipher(luc.cipher(text))).toBe(text);
  });

  it('produces a different ciphertext every time (random salt + nonce)', () => {
    const luc = new LUCipher('miclave');
    const text = 'mismo texto';
    expect(luc.cipher(text)).not.toBe(luc.cipher(text));
  });

  it('preserves unicode and the old noise-alphabet characters (½ ¬ € » µ)', () => {
    const luc = new LUCipher('miclave');
    const text = 'precio: 5€ ½ litro » café µ ¬ ŋ';
    expect(luc.desCipher(luc.cipher(text))).toBe(text);
  });

  it('round-trips the empty string', () => {
    const luc = new LUCipher('miclave');
    expect(luc.desCipher(luc.cipher(''))).toBe('');
  });

  it('detects tampering (throws on a flipped byte)', () => {
    const luc = new LUCipher('miclave');
    const buf = Buffer.from(luc.cipher('dato sensible'), 'base64');
    buf[buf.length - 1] ^= 0x01;
    expect(() => luc.desCipher(buf.toString('base64'))).toThrow();
  });

  it('fails with the wrong key', () => {
    const blob = new LUCipher('claveA').cipher('secreto');
    expect(() => new LUCipher('claveB').desCipher(blob)).toThrow();
  });
});

describe('LUCipher v2 read-compatibility', () => {
  it('decrypts legacy v2 ciphertext', () => {
    const original = 'texto antiguo sin ruido propio';
    const v2blob = encryptV2('miclave', 'misalt', original);
    expect(new LUCipher('miclave', 'misalt').desCipher(v2blob)).toBe(original);
  });

  it('requires the original salt to read v2', () => {
    const v2blob = encryptV2('miclave', 'misalt', 'algo');
    expect(() => new LUCipher('miclave').desCipher(v2blob)).toThrow(/salt/);
  });

  it('routes v3 ciphertext to the v3 path even when a salt is provided', () => {
    const luc = new LUCipher('miclave', 'misalt');
    const text = 'contenido v3';
    expect(luc.desCipher(luc.cipher(text))).toBe(text);
  });
});
