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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var LUCipher_exports = {};
__export(LUCipher_exports, {
  default: () => LUCipher_default
});
module.exports = __toCommonJS(LUCipher_exports);
var import_wordsnoise = __toESM(require("wordsnoise"), 1);
var import_crypto = __toESM(require("crypto"), 1);
class LUCipher {
  constructor(keyword = '', salt = '') {
    if (keyword === '' || salt === '') { throw new Error('The keyword and salt are required'); }
    this.key = keyword.padStart(32, "SD0susEWo0pKd7qas#Y(qmXXd9S1lv14").substr(0, 32);
    this.salt = salt.padStart(16, "ABj4PQgf3j5gblQ0").substr(0, 16);
    this._algorithm = "aes-128-cbc";
    this._iv = "aAB1jhPQ89o=f619";
    this._inputEncoding = "utf8";
    this._outputEncoding = "base64";
    this.ws = new import_wordsnoise.default();
  }
  _createHashPassword() {
    let nodeCrypto = import_crypto.default.pbkdf2Sync(Buffer.from(this.key), Buffer.from(this.salt), 65536, 16, "sha1");
    let response = nodeCrypto || nodeCrypto.toString("hex");
    return nodeCrypto;
  }
  cipher(originalText) {
    let text = this.ws.addNoise(originalText);
    let cipher = import_crypto.default.createCipheriv(this._algorithm, this._createHashPassword(), this._iv);
    let encrypted = cipher.update(text, this._inputEncoding, this._outputEncoding);
    encrypted += cipher.final(this._outputEncoding);
    return encrypted;
  }
  desCipher(encrypted) {
    let decText = "";
    try {
      let descipher = import_crypto.default.createDecipheriv(this._algorithm, Buffer.from(this._createHashPassword(), "hex"), this._iv);
      let dec = descipher.update(encrypted, this._outputEncoding, this._inputEncoding);
      dec += descipher.final(this._inputEncoding);
      decText = this.ws.quitNoise(dec);
    } catch (er) {
      console.log(er);
    }
    return decText;
  }
}
var LUCipher_default = LUCipher;
