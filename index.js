var aesjs = require('aes-es');
var WordsNoise = require('wordsnoise');
var utf8 = require('utf8-encoding');

class LUCipher {
  constructor(keyword) {
    this.key = keyword.substring(16).padStart(16, 'A');
    this.encoder = new utf8.TextEncoder();
    this.decoder = new utf8.TextDecoder();
  }

  cipher(originalText) {
    let key = this.encoder.encode(this.key);

    let ws = new WordsNoise();
    let text = ws.addNoise(originalText);

    let textBytes = this.encoder.encode(text);
    let encryptedBytes = new Uint8Array(textBytes.length);

    let aesCtrE = new aesjs.CTR(key, new aesjs.Counter(5));
    aesCtrE.encrypt(textBytes, encryptedBytes);
    return encryptedBytes;
  }

  desCipher(encryptedBytes) {
    // The counter mode of operation maintains internal state, so to
    // decrypt a new instance must be instantiated.
    var aesCtrD = new aesjs.CTR(this.key, new aesjs.Counter(5));
    var decryptedBytes = new Uint8Array(encryptedBytes.length);
    aesCtrD.decrypt(encryptedBytes, decryptedBytes);

    // Convert our bytes back into text
    var decryptedText = this.decoder.decode(decryptedBytes);
    return decryptedText;
  }
}

module.exports = LUCipher;