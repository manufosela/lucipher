import LUCipher from '../LUCipher.mjs';

let LUC = new LUCipher('mipassword', 'misalt');
let code = LUC.cipher('Este es el texto a codificar');
console.log('SIN CODIFICAR: Este es el texto a codificar');
console.log('CODIFICADO: ', code);
console.log('\n-------------------------------------\n');
let decode = LUC.desCipher(code);
console.log(decode);