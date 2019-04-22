var LUCipher = require('../index.js');

var LUC = new LUCipher('mipassword');
console.log(LUC.cipher('Este es el texto a codificar'));