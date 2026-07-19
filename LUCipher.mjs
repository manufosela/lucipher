import crypto from 'node:crypto';

const VERSION = 3;
const SALT_LEN = 16;
const NONCE_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;
const LEN_HEADER = 4;
const HEADER_LEN = 1 + SALT_LEN + NONCE_LEN + TAG_LEN;

// scrypt cost parameters (memory-hard KDF). maxmem must exceed 128 * N * r bytes.
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

// Legacy v2 constants — kept only to READ ciphertext produced before v3.
// v2 was AES-128-CBC with a fixed IV plus wordsnoise; it is never produced anymore.
const V2_ALGORITHM = 'aes-128-cbc';
const V2_KEY_PAD = 'SD0susEWo0pKd7qas#Y(qmXXd9S1lv14';
const V2_SALT_PAD = 'ABj4PQgf3j5gblQ0';
const V2_IV = 'aAB1jhPQ89o=f619';
const V2_NOISE = ['½', '¬', 'ł', '€', '¶', 'ŧ', '←', '↓', '→', 'ø', 'æ', 'ß', 'ð', 'đ', 'ŋ', 'ħ', '»', '¢', 'µ'];
const V2_NOISE_RE = new RegExp(`[${V2_NOISE.join('')}]`, 'gu');

class LUCipher {
  constructor(keyword = '', salt = '') {
    if (keyword === '') { throw new Error('The keyword is required'); }
    this.keyword = keyword;
    this.salt = salt; // only used to read legacy v2 ciphertext
  }

  #deriveKey(salt) {
    return crypto.scryptSync(Buffer.from(this.keyword, 'utf8'), salt, KEY_LEN, SCRYPT);
  }

  // Length-hiding padding: [uint32 realLen][plaintext][random padding].
  // The whole block is encrypted and authenticated, so the padding is
  // recovered exactly and never corrupts the payload.
  #pad(text) {
    const real = Buffer.from(text, 'utf8');
    const header = Buffer.alloc(LEN_HEADER);
    header.writeUInt32BE(real.length, 0);
    const padLen = crypto.randomBytes(1)[0];
    return Buffer.concat([header, real, crypto.randomBytes(padLen)]);
  }

  #unpad(block) {
    const realLen = block.readUInt32BE(0);
    return block.subarray(LEN_HEADER, LEN_HEADER + realLen).toString('utf8');
  }

  cipher(originalText) {
    if (typeof originalText !== 'string') { throw new TypeError('cipher expects a string'); }
    const salt = crypto.randomBytes(SALT_LEN);
    const nonce = crypto.randomBytes(NONCE_LEN);
    const key = this.#deriveKey(salt);
    const encipher = crypto.createCipheriv('chacha20-poly1305', key, nonce, { authTagLength: TAG_LEN });
    const ciphertext = Buffer.concat([encipher.update(this.#pad(originalText)), encipher.final()]);
    const tag = encipher.getAuthTag();
    return Buffer.concat([Buffer.from([VERSION]), salt, nonce, tag, ciphertext]).toString('base64');
  }

  desCipher(encoded) {
    if (typeof encoded !== 'string') { throw new TypeError('desCipher expects a string'); }
    const buf = Buffer.from(encoded, 'base64');
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
    const decipher = crypto.createDecipheriv('chacha20-poly1305', key, nonce, { authTagLength: TAG_LEN });
    decipher.setAuthTag(tag);
    // .final() throws if the authentication tag does not verify (tampering).
    const block = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return this.#unpad(block);
  }

  // Read-only path for ciphertext produced by v2. Requires the original salt.
  #desCipherV2(encoded) {
    if (this.salt === '') {
      throw new Error('Legacy v2 ciphertext requires the original salt: new LUCipher(keyword, salt)');
    }
    const key = this.keyword.padStart(32, V2_KEY_PAD).slice(0, 32);
    const salt = this.salt.padStart(16, V2_SALT_PAD).slice(0, 16);
    const derived = crypto.pbkdf2Sync(Buffer.from(key), Buffer.from(salt), 65536, 16, 'sha1');
    const decipher = crypto.createDecipheriv(V2_ALGORITHM, derived, Buffer.from(V2_IV, 'utf8'));
    const noisy = decipher.update(encoded, 'base64', 'utf8') + decipher.final('utf8');
    return noisy.replaceAll(V2_NOISE_RE, '');
  }
}

export default LUCipher;