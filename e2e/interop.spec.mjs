import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createServer } from 'node:http';
import LUCipher from '../LUCipher.mjs';

const here = dirname(fileURLToPath(import.meta.url));

// The isomorphic core has no imports, so removing the export turns it into a
// plain script we can inject into the page and expose as window.LUCipher.
const coreSource = readFileSync(join(here, '..', 'LUCipher.mjs'), 'utf8')
  .replace(/export default LUCipher;?/, 'window.LUCipher = LUCipher;');

const KEY = 'clave-interop';
const MESSAGE = 'interoperabilidad 5€ ½ µ » café 日本語';

// crypto.subtle only exists in a secure context, so serve from 127.0.0.1
// (treated as a secure origin) instead of about:blank.
let server;
let baseUrl;

test.beforeAll(async () => {
  server = createServer((req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.end('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.afterAll(() => server.close());

test('cipher in Node, decipher in the browser', async ({ page }) => {
  const blob = await new LUCipher(KEY).cipher(MESSAGE);
  await page.goto(baseUrl);
  await page.addScriptTag({ content: coreSource });
  const decrypted = await page.evaluate(
    ({ key, ciphertext }) => new window.LUCipher(key).desCipher(ciphertext),
    { key: KEY, ciphertext: blob },
  );
  expect(decrypted).toBe(MESSAGE);
});

test('cipher in the browser, decipher in Node', async ({ page }) => {
  await page.goto(baseUrl);
  await page.addScriptTag({ content: coreSource });
  const blob = await page.evaluate(
    ({ key, message }) => new window.LUCipher(key).cipher(message),
    { key: KEY, message: MESSAGE },
  );
  const decrypted = await new LUCipher(KEY).desCipher(blob);
  expect(decrypted).toBe(MESSAGE);
});
