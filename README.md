# lucipher (Let Us Cipher) [![GitHub version](https://badge.fury.io/gh/manufosela%2Flucipher.svg)](https://badge.fury.io/gh/manufosela%2Flucipher)

🌐 **[manufosela.dev/lucipher](https://manufosela.dev/lucipher/)** — la historia y evolución del proyecto.

Librería **isomorfa** de cifrado autenticado: el mismo código corre en **Node y en el navegador** usando la Web Crypto API (`crypto.subtle`).

Desde la **v4** el diseño es:

- **AES-256-GCM** (AEAD): confidencialidad e integridad. Cualquier manipulación del texto cifrado se detecta al descifrar (la promesa se rechaza, no devuelve datos corruptos).
- **PBKDF2-SHA256** (600 000 iteraciones) como derivación de clave.
- **salt e IV aleatorios por mensaje**: cifrar dos veces el mismo texto produce siempre una salida distinta.
- **Padding de longitud variable** autenticado: oculta parcialmente la longitud real del mensaje sin corromper los datos.
- **Contenedor autodescriptivo** (`versión · salt · iv · ciphertext+tag` en base64): para descifrar solo necesitas la contraseña.
- **Formato universal**: un texto cifrado en Node se descifra en el navegador y viceversa.
- **API asíncrona**: `cipher`/`desCipher` devuelven promesas (Web Crypto es async).

> **Requiere Node ≥ 19 o un navegador moderno en contexto seguro** (HTTPS o `localhost`), donde `globalThis.crypto.subtle` está disponible.

## Versiones

| Versión | Entorno | Primitivas | Notas |
|---------|---------|------------|-------|
| `4.0.0` | Node ≥ 19 y navegador | AES-256-GCM + PBKDF2 | **Recomendada.** Core isomorfo e interoperable. API asíncrona. |
| `3.0.x` | Solo Node ≥ 16 | ChaCha20-Poly1305 + scrypt | API síncrona. Además lee textos cifrados con v2. |
| `2.2.x` | Node y navegador | AES-128-CBC + "ruido" | **Legacy, insegura** (IV fijo, sin integridad). No usar. |

Cada versión mayor cambia el formato del texto cifrado y no es interoperable con las anteriores al cifrar. Para **leer** textos antiguos, usa la versión con la que se cifraron. Historial completo en el [CHANGELOG](CHANGELOG.md).

## Instalación

```
$ npm i lucipher
```

En Node, con ES modules:

```javascript
import LUCipher from 'lucipher';

const password = 'una-contraseña-fuerte';
const luc = new LUCipher(password);

const code = await luc.cipher('texto a cifrar');

try {
  const decode = await luc.desCipher(code);
  console.log(decode); // 'texto a cifrar'
} catch {
  // El texto está manipulado, corrupto o la contraseña es incorrecta
}
```

O con CommonJS:

```javascript
const LUCipher = require('lucipher').default;

const luc = new LUCipher('una-contraseña-fuerte');
const code = await luc.cipher('texto a cifrar');
const decode = await luc.desCipher(code);
```

En el navegador, como módulo ESM (sin bundle), por CDN o desde `node_modules`:

```html
<script type="module">
  // Por CDN:
  import LUCipher from 'https://esm.sh/lucipher';
  // ...o desde node_modules servido por tu bundler/servidor:
  // import LUCipher from '/node_modules/lucipher/index.mjs';

  const luc = new LUCipher('una-contraseña-fuerte');
  const code = await luc.cipher('texto a cifrar');
  const decode = await luc.desCipher(code); // descifra también lo cifrado en Node
</script>
```

## Breaking changes (v3 → v4)

La v4 es un cambio mayor. Si vienes de v3:

- **API asíncrona:** `cipher` y `desCipher` ahora devuelven promesas. Añade `await` (o `.then`).
- **Formato nuevo (v4), no interoperable con v3** al cifrar. v4 solo lee textos v4; para leer textos v2/v3 antiguos, mantén una instancia de la versión 3.0.x.
- **Cambio de primitivas:** de ChaCha20-Poly1305 + scrypt (Node) a **AES-256-GCM + PBKDF2** (comunes a Node y navegador). Es el precio de la interoperabilidad: PBKDF2 es menos resistente a hardware dedicado que scrypt (mitigado con 600 000 iteraciones).
- **Ya no depende de `node:crypto`** ni del build browserify: un único core isomorfo.
- **Requisito de entorno:** Node ≥ 19 o navegador moderno en contexto seguro.

## Notas de seguridad

- No incrustes contraseñas en URLs ni en query strings: quedan en logs de servidor, proxies e historial.
- `crypto.subtle` solo está disponible en contextos seguros (HTTPS o `localhost`).
- PBKDF2 protege la contraseña con 600 000 iteraciones; aun así, usa contraseñas fuertes.
