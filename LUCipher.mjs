import WordsNoise from 'wordsnoise';
import crypto from 'crypto';

class LUCipher {

  constructor(keyword = '', salt = '') {
    if (keyword === '' || salt === '') { throw new Error('The keyword and salt are required'); }
    this.key = keyword.padStart(32, 'SD0susEWo0pKd7qas#Y(qmXXd9S1lv14').substr(0, 32);
    this.salt = salt.padStart(16, 'ABj4PQgf3j5gblQ0').substr(0, 16);
    this._algorithm = 'aes-128-cbc';
    this._iv = 'aAB1jhPQ89o=f619';
    this._inputEncoding = 'utf8';
    this._outputEncoding = 'base64';
    this.ws = new WordsNoise();
  }

  _createHashPassword() {
    let nodeCrypto = crypto.pbkdf2Sync(Buffer.from(this.key), Buffer.from(this.salt), 65536, 16, 'sha1');
    let response = nodeCrypto || nodeCrypto.toString('hex');
    return nodeCrypto;
  }

  cipher(originalText) {
    let text = this.ws.addNoise(originalText);
    let cipher = crypto.createCipheriv(this._algorithm, this._createHashPassword(), this._iv);
    let encrypted = cipher.update(text, this._inputEncoding, this._outputEncoding);
    encrypted += cipher.final(this._outputEncoding);
    return encrypted;
  }

  desCipher(encrypted) {
    let decText = '';
    try {
      let descipher = crypto.createDecipheriv(this._algorithm, Buffer.from(this._createHashPassword(), 'hex'), this._iv);
      let dec = descipher.update(encrypted, this._outputEncoding, this._inputEncoding);
      dec += descipher.final(this._inputEncoding);
      decText = this.ws.quitNoise(dec);
    } catch (er) {
      console.log(er);
    }
    return decText;
  }
}

export default LUCipher;