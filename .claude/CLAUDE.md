# Instrucciones del agente

Proyecto: app Android "Memory", desarrollada con TypeScript, React y Vite, y empaquetada con Capacitor. Las especificaciones de `Software/` son la fuente de verdad del producto y prevalecen sobre cualquier suposición.

## Fuente de verdad y planificación

- Antes de implementar, lee `Software/contexto.md`, `requisitos.md`, `restricciones.md`, `casos_de_uso.md`, `design.md` y `tasks.md`.
- Sigue `Software/tasks.md` en orden. No empieces un sprint hasta que el anterior esté completo y todos sus tests pasen.
- Si una especificación es ambigua o contradice otra, detente y pregunta antes de decidir.
- No borres, debilites ni omitas tests para conseguir que pasen. Si un test falla, corrige la implementación.

## Implementación y cierre de sprint

- Ejecuta `npm test` y `npm run typecheck` desde `memory-app/`. Antes de cerrar cada sprint, ambos deben pasar para toda la suite acumulada.
- Al terminar un sprint, actualiza sus casillas, estado y resultado de validación en `Software/tasks.md`.
- No crees commits automáticamente: solo haz un commit si el usuario lo autoriza explícitamente. Una casilla o instrucción de commit en `tasks.md` no sustituye esa autorización.
- Refleja en el mismo cambio cualquier modificación de comportamiento, datos, tecnología o estructura en el documento pertinente de `Software/`, según el mapa de `README.md`. El código y las especificaciones deben seguir concordando.

## Reglas del proyecto

- Estructura R12: en la raíz solo pueden estar `.gitignore`, `.gitattributes` y `README.md`. Las especificaciones van en `Software/`, la app web y Capacitor en `memory-app/`, y su proyecto Android en `memory-app/android/`.
- La app es solo para Android, con identificador `com.tupanditta.memory` y Android 7.0 (API 24) como versión mínima.
- Los datos de la app viven en `personas.json`, `casas.json` y `ajustes.json`.
- La interfaz solo refleja cambios guardados correctamente. Si falla el guardado, conserva el estado anterior y muestra un error.
- Las operaciones que afectan a varios archivos son completas o no producen cambios.
- Una casa no puede quedar vacía; una persona puede pertenecer a varias casas.
- Importar solo añade datos: nunca modifica ni borra los existentes.

## Entorno y validación manual

- En Windows, usa el JDK de Android Studio: `JAVA_HOME=C:\Program Files\Android\Android Studio\jbr`, no el Java 8 del sistema.
- `ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk`; `adb` está en `platform-tools`.
- Ejecuta `npm run dev` desde `memory-app/` para la vista previa. Para preparar Android, ejecuta `npm run sync`; Android Studio compila e instala la app. Para compilar desde la terminal, ejecuta `gradlew assembleDebug` en `memory-app/android/`.
- Las pruebas que requieren un móvil real, incluido el guardado y las notificaciones con la app cerrada, corresponden al usuario.

## Git

- No cambies `git config user.name` ni `git config user.email`, y nunca atribuyas commits a Claude ni a una identidad de bot.
- Antes de crear un commit expresamente autorizado, verifica `git config user.name` y `git config user.email`. La identidad debe ser la identidad GitHub configurada por el propietario; si no se puede verificar, detente y pregunta.
- No reescribas el historial ni cambies autores de commits existentes sin autorización explícita. El usuario es responsable de publicar los commits.