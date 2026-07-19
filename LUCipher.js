var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var LUCipher_exports = {};
__export(LUCipher_exports, {
  default: () => LUCipher_default
});
module.exports = __toCommonJS(LUCipher_exports);
var import_node_crypto = __toESM(require("node:crypto"), 1);
const VERSION = 3;
const SALT_LEN = 16;
const NONCE_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;
const LEN_HEADER = 4;
const HEADER_LEN = 1 + SALT_LEN + NONCE_LEN + TAG_LEN;
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const V2_ALGORITHM = "aes-128-cbc";
const V2_KEY_PAD = "SD0susEWo0pKd7qas#Y(qmXXd9S1lv14";
const V2_SALT_PAD = "ABj4PQgf3j5gblQ0";
const V2_IV = "aAB1jhPQ89o=f619";
const V2_NOISE = ["\xBD", "\xAC", "\u0142", "\u20AC", "\xB6", "\u0167", "\u2190", "\u2193", "\u2192", "\xF8", "\xE6", "\xDF", "\xF0", "\u0111", "\u014B", "\u0127", "\xBB", "\xA2", "\xB5"];
const V2_NOISE_RE = new RegExp(`[${V2_NOISE.join("")}]`, "gu");
class LUCipher {
  constructor(keyword = "", salt = "") {
    if (keyword === "") {
      throw new Error("The keyword is required");
    }
    this.keyword = keyword;
    this.salt = salt;
  }
  #deriveKey(salt) {
    return import_node_crypto.default.scryptSync(Buffer.from(this.keyword, "utf8"), salt, KEY_LEN, SCRYPT);
  }
  // Length-hiding padding: [uint32 realLen][plaintext][random padding].
  // The whole block is encrypted and authenticated, so the padding is
  // recovered exactly and never corrupts the payload.
  #pad(text) {
    const real = Buffer.from(text, "utf8");
    const header = Buffer.alloc(LEN_HEADER);
    header.writeUInt32BE(real.length, 0);
    const padLen = import_node_crypto.default.randomBytes(1)[0];
    return Buffer.concat([header, real, import_node_crypto.default.randomBytes(padLen)]);
  }
  #unpad(block) {
    const realLen = block.readUInt32BE(0);
    return block.subarray(LEN_HEADER, LEN_HEADER + realLen).toString("utf8");
  }
  cipher(originalText) {
    if (typeof originalText !== "string") {
      throw new TypeError("cipher expects a string");
    }
    const salt = import_node_crypto.default.randomBytes(SALT_LEN);
    const nonce = import_node_crypto.default.randomBytes(NONCE_LEN);
    const key = this.#deriveKey(salt);
    const encipher = import_node_crypto.default.createCipheriv("chacha20-poly1305", key, nonce, { authTagLength: TAG_LEN });
    const ciphertext = Buffer.concat([encipher.update(this.#pad(originalText)), encipher.final()]);
    const tag = encipher.getAuthTag();
    return Buffer.concat([Buffer.from([VERSION]), salt, nonce, tag, ciphertext]).toString("base64");
  }
  desCipher(encoded) {
    if (typeof encoded !== "string") {
      throw new TypeError("desCipher expects a string");
    }
    const buf = Buffer.from(encoded, "base64");
    if (buf.length >= HEADER_LEN && buf[0] === VERSION) {
      return this.#desCipherV3(buf);
    }
    return this.#desCipherV2(encoded);
  }
  #desCipherV3(buf) {
    let offset = 1;
    const salt = buf.subarray(offset, offset += SALT_LEN);
    const nonce = buf.subarray(offset, offset += NONCE_LEN);
    const tag = buf.subarray(offset, offset += TAG_LEN);
    const ciphertext = buf.subarray(offset);
    const key = this.#deriveKey(salt);
    const decipher = import_node_crypto.default.createDecipheriv("chacha20-poly1305", key, nonce, { authTagLength: TAG_LEN });
    decipher.setAuthTag(tag);
    const block = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return this.#unpad(block);
  }
  // Read-only path for ciphertext produced by v2. Requires the original salt.
  #desCipherV2(encoded) {
    if (this.salt === "") {
      throw new Error("Legacy v2 ciphertext requires the original salt: new LUCipher(keyword, salt)");
    }
    const key = this.keyword.padStart(32, V2_KEY_PAD).slice(0, 32);
    const salt = this.salt.padStart(16, V2_SALT_PAD).slice(0, 16);
    const derived = import_node_crypto.default.pbkdf2Sync(Buffer.from(key), Buffer.from(salt), 65536, 16, "sha1");
    const decipher = import_node_crypto.default.createDecipheriv(V2_ALGORITHM, derived, Buffer.from(V2_IV, "utf8"));
    const noisy = decipher.update(encoded, "base64", "utf8") + decipher.final("utf8");
    return noisy.replaceAll(V2_NOISE_RE, "");
  }
}
var LUCipher_default = LUCipher;
