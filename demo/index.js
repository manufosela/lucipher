let LUCipher = require('../index.js');

let LUC = new LUCipher('mipassword');
let code = LUC.cipher('Este es el texto a codificar');
console.log(code);
console.log('\n-------------------------------------\n');
let decode = LUC.desCipher(code);
console.log(decode);