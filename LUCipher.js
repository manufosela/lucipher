var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var LUCipher_exports = {};
__export(LUCipher_exports, {
  default: () => LUCipher_default
});
module.exports = __toCommonJS(LUCipher_exports);
const VERSION = 4;
const SALT_LEN = 16;
const IV_LEN = 12;
const KEY_BITS = 256;
const PBKDF2_ITERATIONS = 6e5;
const LEN_HEADER = 4;
const HEADER_LEN = 1 + SALT_LEN + IV_LEN;
const webcrypto = globalThis.crypto;
if (!webcrypto?.subtle) {
  throw new Error("LUCipher requires the Web Crypto API (Node >= 19 or a modern browser)");
}
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const randomBytes = (length) => webcrypto.getRandomValues(new Uint8Array(length));
function bytesToBase64(bytes) {
  let binary = "";
  const CHUNK = 32768;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
class LUCipher {
  constructor(keyword = "") {
    if (keyword === "") {
      throw new Error("The keyword is required");
    }
    this.keyword = keyword;
  }
  async #deriveKey(salt) {
    const baseKey = await webcrypto.subtle.importKey("raw", encoder.encode(this.keyword), "PBKDF2", false, ["deriveKey"]);
    return webcrypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
      baseKey,
      { name: "AES-GCM", length: KEY_BITS },
      false,
      ["encrypt", "decrypt"]
    );
  }
  // Length-hiding padding: [uint32 realLen][plaintext][random padding].
  // Encrypted and authenticated as a whole, so it is recovered exactly and
  // never corrupts the payload.
  #pad(text) {
    const real = encoder.encode(text);
    const padLength = randomBytes(1)[0];
    const block = new Uint8Array(LEN_HEADER + real.length + padLength);
    new DataView(block.buffer).setUint32(0, real.length, false);
    block.set(real, LEN_HEADER);
    block.set(randomBytes(padLength), LEN_HEADER + real.length);
    return block;
  }
  #unpad(block) {
    const realLength = new DataView(block.buffer, block.byteOffset, block.byteLength).getUint32(0, false);
    return decoder.decode(block.subarray(LEN_HEADER, LEN_HEADER + realLength));
  }
  async cipher(originalText) {
    if (typeof originalText !== "string") {
      throw new TypeError("cipher expects a string");
    }
    const salt = randomBytes(SALT_LEN);
    const iv = randomBytes(IV_LEN);
    const key = await this.#deriveKey(salt);
    const ciphertext = new Uint8Array(await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, key, this.#pad(originalText)));
    const out = new Uint8Array(HEADER_LEN + ciphertext.length);
    out[0] = VERSION;
    out.set(salt, 1);
    out.set(iv, 1 + SALT_LEN);
    out.set(ciphertext, HEADER_LEN);
    return bytesToBase64(out);
  }
  async desCipher(encoded) {
    if (typeof encoded !== "string") {
      throw new TypeError("desCipher expects a string");
    }
    const buf = base64ToBytes(encoded);
    if (buf.length < HEADER_LEN || buf[0] !== VERSION) {
      throw new Error("Unrecognized or unsupported ciphertext format (expected v4)");
    }
    const salt = buf.subarray(1, 1 + SALT_LEN);
    const iv = buf.subarray(1 + SALT_LEN, HEADER_LEN);
    const ciphertext = buf.subarray(HEADER_LEN);
    const key = await this.#deriveKey(salt);
    const block = new Uint8Array(await webcrypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext));
    return this.#unpad(block);
  }
}
var LUCipher_default = LUCipher;
