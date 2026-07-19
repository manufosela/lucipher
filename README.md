# lucipher (Let Us Cipher) [![GitHub version](https://badge.fury.io/gh/manufosela%2Flucipher.svg)](https://badge.fury.io/gh/manufosela%2Flucipher)

Librería para cifrar/descifrar textos con **cifrado autenticado** usando el `crypto` nativo de Node.

Desde la **v3** el diseño es:

- **ChaCha20-Poly1305** (AEAD): confidencialidad e integridad. Cualquier manipulación del texto cifrado se detecta al descifrar (lanza excepción, no devuelve datos corruptos).
- **scrypt** como derivación de clave (memory-hard), en lugar de PBKDF2-SHA1.
- **salt y nonce aleatorios por mensaje**: cifrar dos veces el mismo texto produce siempre una salida distinta, sin necesidad de "ruido".
- **Padding de longitud variable** autenticado: oculta parcialmente la longitud real del mensaje sin corromper los datos.
- **Contenedor autodescriptivo** (`versión · salt · nonce · tag · ciphertext` en base64): para descifrar solo necesitas la contraseña.

> **v3 requiere Node ≥ 16** (usa `chacha20-poly1305` y `scrypt`). No funciona en navegador con browserify; un port a WebCrypto está pendiente.

## Instalación

Se puede usar como dependencia.
En tu proyecto se instala así

```
$ npm --save i lucipher
```

En tu código, con ES modules:

```javascript
import LUCipher from 'lucipher';

const luc = new LUCipher(password);       // el salt ya no es necesario en v3
const code = luc.cipher('texto a cifrar');
const decode = luc.desCipher(code);
```

O con CommonJS:

```javascript
const LUCipher = require('lucipher').default;

const luc = new LUCipher(password);
const code = luc.cipher('texto a cifrar');
const decode = luc.desCipher(code);
```

## Migración desde v2

- Los nuevos cifrados usan **siempre** el formato v3.
- `desCipher` **también lee textos cifrados con v2** (AES-128-CBC + ruido). Para descifrar un texto v2 debes construir la instancia con el mismo `salt` de entonces:

  ```javascript
  const luc = new LUCipher(password, saltAntiguo);
  const claro = luc.desCipher(textoCifradoV2);
  ```

- **Cambio de comportamiento:** ante un texto manipulado, corrupto o con clave incorrecta, `desCipher` **lanza una excepción** en lugar de devolver una cadena vacía. Envuélvelo en `try/catch` si necesitas manejar ese caso.

## Notas de seguridad

- No incrustes contraseñas en URLs ni en query strings: quedan en logs de servidor, proxies e historial.
- El formato v2 (IV fijo, sin autenticación) se mantiene **solo para lectura** y está deprecado. Re-cifra tus datos con v3 cuando puedas.
