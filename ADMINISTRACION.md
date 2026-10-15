# Administración IO Verify

Acceso: `/admin`. El administrador crea, desactiva, reactiva y cambia contraseñas de operadores en `/admin/operadores`. Los operadores pueden importar certificados, sin gestionar usuarios.

## Activación inicial

Configurar `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN` para el entorno correspondiente. Preview exige la base `ioverify-pruebas`. Configurar `IO_VERIFY_SETUP_SECRET` con un valor aleatorio de al menos 32 caracteres, abrir `/admin/setup` e ingresar ese código, correo y contraseña del administrador. El alta crea únicamente las tablas de acceso y permite un solo administrador inicial. Retirar la variable de activación después de completar el alta.

No guardar credenciales en el repositorio. Las contraseñas se almacenan mediante scrypt; sesiones de 12 horas. Desactivar o cambiar contraseña revoca las sesiones del operador.

## Verificación

`npm run build` y `npm run test:auth`. Las pruebas usan una base SQLite temporal propia y credenciales aleatorias, sin tocar Turso. Cubren permisos, sesiones, gestión de operadores, importación, duplicados y consulta pública con notas numéricas y de texto.

La rama `acceso-administrativo` se revisa en Preview antes de cualquier promoción a producción.
