import LUCipher from '../LUCipher.mjs';

const original = 'Este es el texto a codificar';
const luc = new LUCipher('mipassword');
const code = luc.cipher(original);
console.log('SIN CODIFICAR:', original);
console.log('CODIFICADO:  ', code);
console.log('\n-------------------------------------\n');
console.log('DESCIFRADO:  ', luc.desCipher(code));