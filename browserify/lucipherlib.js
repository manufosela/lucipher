var crypto = require('crypto');
var pbkdf2 = require('pbkdf2');

class WordsNoise {
  constructor() {
    this.noiseArray = ['½', '¬', 'ł', '€', '¶', 'ŧ', '←', '↓', '→', 'ø', 'æ', 'ß', 'ð', 'đ', 'ŋ', 'ħ', '»', '¢', 'µ'];
  }

  _getRandom(max, min = 0) {
    return parseInt(Math.random() * (max - min) + min);
  }

  addNoise(text) {
    let noiseText = text;
    let noiseLen = this.noiseArray.length;
    let numNoise = this._getRandom(noiseLen, 10);
    for (let i = 0; i < numNoise; i++) {
      let ranChar = this.noiseArray[this._getRandom(this.noiseArray.length)];
      let ranPos = this._getRandom(noiseLen);
      let firstPart = noiseText.substring(0, ranPos);
      let secondPart = noiseText.substring(ranPos);
      noiseText = firstPart + ranChar + secondPart;
      noiseLen++;
    }
    return noiseText;
  }

  quitNoise(noiseText) {
    let noiseString = this.noiseArray.join('');
    let re = new RegExp('[' + noiseString + ']', 'gi');
    let text = noiseText.replace(re, '');
    return text;
  }
}

class LUCipher {

  constructor(keyword, salt) {
    this.key = keyword.padStart(32, 'SD0susEWo0pKd7qas#Y(qmXXd9S1lv14').substr(0, 32);
    this.salt = salt.padStart(16, 'ABj4PQgf3j5gblQ0').substr(0, 16);
    this._algorithm = 'aes-128-cbc';
    this._iv = 'aAB1jhPQ89o=f619';
    this._inputEncoding = 'utf8';
    this._outputEncoding = 'base64';
    this.ws = new WordsNoise();
  }

  _createHashPassword() {
    let nodeCrypto = pbkdf2.pbkdf2Sync(Buffer.from(this.key), Buffer.from(this.salt), 65536, 16, 'sha1');
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

let LUC = new LUCipher('mipassword', 'misalt');
let code = LUC.cipher('Este es el texto a codificar');
console.log('SIN CODIFICAR: Este es el texto a codificar');
console.log('CODIFICADO: ', code);
console.log('\n-------------------------------------\n');
let decode = LUC.desCipher(code);
console.log(decode);