# Memory

Aplicación móvil simple para apuntar datos de personas que no se me quedan en la cabeza: dónde viven (calle, portal, piso...) y sus cumpleaños y aniversarios. Permite buscar por nombre y agrupar personas en casas con un apodo.

## Especificaciones

Las especificaciones están en la carpeta [Software/](Software/):

| Archivo | Contenido |
|---|---|
| [contexto.md](Software/contexto.md) | Qué problema resuelve la app y qué se quiere |
| [requisitos.md](Software/requisitos.md) | Requisitos funcionales (RF) y no funcionales (RNF) |
| [restricciones.md](Software/restricciones.md) | Límites y reglas del proyecto (R) |
| [casos_de_uso.md](Software/casos_de_uso.md) | Casos de uso (CU) y modelo de datos |
| [design.md](Software/design.md) | Tecnologías, arquitectura y estructura de la app (aprobar antes de implementar) |
| [tasks.md](Software/tasks.md) | Sprints de implementación con tests de validación que deben pasar para avanzar |
| [prototipo/](Software/prototipo/) | Prototipo de la interfaz hecho con Google Stitch (capturas y HTML); el detalle de la interfaz está en [design.md](Software/design.md) |

## Estructura del repositorio

En la raíz solo puede haber `.gitignore`, `.gitattributes` y `README.md`. El resto va en carpetas:

- [Software/](Software/): especificaciones.
- `memory-app/`: código de la app (web + Capacitor) y proyecto Android (`memory-app/android/`).
- [.claude/CLAUDE.md](.claude/CLAUDE.md): instrucciones para el agente de IA.

## Instalación y ejecución

La app está hecha con TypeScript, React y Vite, y se empaqueta como app Android con Capacitor. El proyecto Android está en `memory-app/android/` y se abre y compila en Android Studio como cualquier otro proyecto Android.

Requisitos (Windows): Node 24 y npm 11, Git y Android Studio con el SDK de Android (API 35 y 36) y su JDK. No hace falta ser administrador ni cambiar nada del sistema. Variables de entorno (solo para compilar desde la terminal; Android Studio usa su propio JDK):

- `JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr` (no el Java del sistema).
- `ANDROID_HOME` = `%LOCALAPPDATA%\Android\Sdk`.

Todos los comandos se ejecutan desde `memory-app/`:

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias |
| `npm run dev` | Vista previa en el navegador (guarda en `localStorage`; sin notificaciones) |
| `npm test` | Ejecuta todos los tests (Vitest) |
| `npm run typecheck` | Comprueba los tipos (TypeScript) |
| `npm run build` | Empaqueta la app web en `dist/` |
| `npm run sync` | `build` y copia la web y los plugins al proyecto Android (`npx cap sync android`) |
| `npm run android` | `sync` y abre el proyecto Android en Android Studio |

Instalar en el móvil:

1. Activa en el móvil las opciones de desarrollador y la depuración USB, y conéctalo por USB.
2. Ejecuta `npm run android` (o `npm run sync` y abre `memory-app/android` en Android Studio).
3. En Android Studio, elige el móvil y pulsa Run. La app queda instalada y funciona sin el PC.

Después de cambiar el código hay que repetir `npm run sync` antes de volver a pulsar Run.

Compilar sin abrir Android Studio: tras `npm run sync`, ejecuta `gradlew assembleDebug` en `memory-app/android/` (con `JAVA_HOME` y `ANDROID_HOME` definidas). El APK queda en `memory-app/android/app/build/outputs/apk/debug/app-debug.apk` y se instala con `adb install -r app-debug.apk`.

La vista web es solo una vista previa: no prueba el guardado real en JSON ni las notificaciones. Para eso hay que instalar la app en Android. La app solo funciona sin conexión y sus datos no salen del dispositivo salvo al exportar.

## Datos

Los datos se guardan en dos archivos JSON:

- [personas.json](Software/personas.json): personas, con su dirección y sus fechas.
- [casas.json](Software/casas.json): casas con apodo y los ids de sus personas (una persona puede estar en varias casas; una casa no puede estar vacía).

La hora de las notificaciones se guarda aparte, en `ajustes.json` (`{ "horaNotificacion": "09:00" }`). Los JSON de `Software/` son ejemplos vacíos; `memory-app/__tests__/cierre.test.ts` comprueba que siguen el modelo de datos.

Cada cambio se guarda en los JSON antes de mostrarse en la interfaz. Si el guardado falla, no se muestra el cambio.

La copia de seguridad es manual: la app exporta todo a un archivo JSON y puede importarlo. Importar solo añade datos nuevos; no reemplaza los existentes.

## Regla para la fase de implementación

Cualquier cambio o modificación que se haga durante la implementación se debe reflejar en las especificaciones de `Software/`, en el mismo cambio:

- Requisito nuevo o modificado: actualizar [requisitos.md](Software/requisitos.md).
- Límite nuevo o modificado: actualizar [restricciones.md](Software/restricciones.md).
- Flujo de uso nuevo o modificado: actualizar [casos_de_uso.md](Software/casos_de_uso.md).
- Cambio en la estructura de datos: actualizar el modelo de datos de [casos_de_uso.md](Software/casos_de_uso.md) y los JSON.
- Cambio de tecnología, arquitectura o estructura de carpetas: actualizar [design.md](Software/design.md).
- Cambio de alcance o del problema: actualizar [contexto.md](Software/contexto.md).

El código y las especificaciones no deben contradecirse.
