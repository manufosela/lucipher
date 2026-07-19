# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/)
y versionado según [SemVer](https://semver.org/lang/es/).

## [3.0.1] - 2026-07-19

### Changed

- El paquete publicado solo incluye los ficheros de runtime y documentación
  (campo `files`): se excluyen `.vscode/`, `TOOLS.md`, `tests/` y `demo/` del
  tarball de npm.
- `homepage` apunta a la rama `main`.

## [3.0.0] - 2026-07-19

Rediseño criptográfico completo a cifrado autenticado (AEAD).

### Added

- Cifrado con **ChaCha20-Poly1305**: confidencialidad e integridad. El descifrado
  detecta cualquier manipulación y lanza excepción.
- Derivación de clave con **scrypt** (memory-hard).
- **salt y nonce aleatorios por mensaje**: la misma entrada produce siempre una
  salida distinta.
- **Padding de longitud variable** autenticado para ocultar parcialmente el tamaño
  del mensaje sin corromper los datos.
- **Contenedor autodescriptivo** (`versión · salt · nonce · tag · ciphertext`): para
  descifrar solo hace falta la contraseña.
- Suite de tests con Vitest.

### Changed

- **BREAKING:** `desCipher` lanza una excepción ante texto manipulado, corrupto o
  clave incorrecta, en lugar de devolver una cadena vacía.
- **BREAKING:** formato de salida nuevo, no interoperable con v2 al cifrar (v3 sí
  puede leer textos v2 aportando el `salt` original).
- El segundo argumento del constructor (`salt`) solo se usa ya para leer textos v2.

### Removed

- **BREAKING:** dependencia `wordsnoise` y el mecanismo de "ruido", que además
  corrompía textos con caracteres como `€ ½ µ » ¬`.
- **BREAKING:** bundle para navegador (`browserify`). v3 es Node-only (≥ 16); el
  soporte de navegador vía WebCrypto queda pendiente para una versión posterior.

### Fixed

- Pérdida de datos al descifrar textos que contenían caracteres del antiguo
  alfabeto de ruido.
- IV fijo hardcodeado y secretos de relleno presentes en el código fuente.
- Fallo silencioso en `desCipher` (capturaba el error y devolvía `''`).
