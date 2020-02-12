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

module.exports = WordsNoise;