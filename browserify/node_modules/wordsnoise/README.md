# wordsnoise
npm module to add "noise" (random characters) into a random positions of a text

#USE


# EXAMPLE
```javascript
var WordsNoise = require('../WordsNoise.js');

var wn = new WordsNoise();
var cifrado = wn.addNoise('texto de prueba');
console.log(cifrado);
var descifrado = wn.quitNoise(cifrado);
console.log(descifrado);
```

```
$ node tests/index.js 

ß←text→←o dŧe »pru»←¬e¬baßŋæ€ø¬ð
texto de prueba
```
