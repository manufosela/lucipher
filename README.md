# lucipher (Let Us Cipher) [![GitHub version](https://badge.fury.io/gh/manufosela%2Flucipher.svg)](https://badge.fury.io/gh/manufosela%2Flucipher)
Script para cifrar/descifrar textos usando el API crypto y el algoritmo aes-128-cbc, añadiendo además ruido a los textos antes de ser cifrados.

¿Por qué añadir ruido?

Si usamos por ejemplo la clave **miclave** para cifremos el texto **yo soy manufosela** obtendremos siempre la cadena cifrada *+0MXL1Clnk1xfXAsuF1rplf/zTjWTrNeAI5kY7Cc2ZY=*

Si añadimos ruido pseudo-aleatorio, cada vez que cifremos el texto obtendremos una cadena cifrada diferente, pero que al descifrar y eliminar el ruido, nos permitirá obtener la cadena de texto descifrada.

## Instalación

Se puede usar como dependencia. 
En tu proyecto se instala así
```
$ npm --save i lucipher
```

En tu código se usa así
```javascript
let LUCipher = require('lucipher');
...
let LUC = new LUCipher(passw, salt);
let code = LUC.cipher(texto);
...
let decode = LUC.desCipher(textocifrado);
```
## webservice

Para cifrar:
* endpoint: https://lucipher.herokuapp.com/encrypt
* params:
  * texto: texto a cifrar
  * password: password a utilizar para cifrar/descifrar
  
[EJEMPLO Llamada servicio de cifrado](https://lucipher.herokuapp.com/encrypt?texto=yo%20soy%20manufosela&password=unarosaounclave)

Para descifrar:
* endpoint: https://lucipher.herokuapp.com/desencrypt
* params:
  * texto: texto cifrado
  * password: password a utilizar para cifrar/descifrar
  
[EJEMPLO Llamada servicio descifrado](https://lucipher.herokuapp.com/desencrypt?texto=xTB9tFJxY42HEGPFatsW704YCaER1Cq0lijyTcfj8E2adi/MoEuyQTRJrm7ovo/z&password=unarosaounclave)

