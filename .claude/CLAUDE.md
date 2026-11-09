# Instrucciones para el agente

Proyecto: app Android "Memory" (TypeScript, React + Vite, empaquetada con Capacitor). Las especificaciones están en `Software/` y mandan sobre cualquier suposición.

## Antes de escribir código
1. Lee `Software/contexto.md`, `requisitos.md`, `restricciones.md`, `casos_de_uso.md`, `design.md` y `tasks.md`.
2. Trabaja siguiendo `Software/tasks.md`: sprints en orden, sin saltar ninguno.

## Reglas de implementación
- No empieces un sprint hasta que **todos** los tests del sprint anterior pasen. Ejecuta toda la suite acumulada (`npm test` y `npm run typecheck` desde `memory-app/`) antes de cerrarlo.
- Nunca borres, debilites ni saltes un test para que pase. Si un test falla, corrige el código.
- Si algo no está claro o una especificación se contradice, para y pregunta.
- Al cerrar un sprint: marca sus casillas y su estado en `Software/tasks.md`, y haz un commit de git.
- Cualquier cambio de código que cambie el comportamiento, los datos, la tecnología o la estructura se refleja en el mismo cambio en el archivo de `Software/` que corresponda (ver `README.md`).

## Estructura (R12)
- En la raíz solo pueden existir `.gitignore`, `.gitattributes` y `README.md`. Todo lo demás va en carpetas: `Software/` (especificaciones), `memory-app/` (app web + Capacitor, con el proyecto Android en `memory-app/android/`), `.claude/` (este archivo).
- Identificador de la app: `com.tupanditta.memory`. Android 7.0 (API 24) o superior. Solo Android.

## Reglas de datos
- Los datos solo viven en `personas.json`, `casas.json` y `ajustes.json`.
- La UI solo muestra datos ya guardados con éxito. Si el guardado falla, se conserva el estado anterior y se muestra un error.
- Operaciones sobre varios archivos: completas o ninguna.
- Una casa nunca está vacía. Una persona puede estar en varias casas.
- Importar solo añade; nunca modifica ni borra datos existentes.

## Entorno (Windows)
- Usa el JDK de Android Studio (`JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr`), no el Java 8 del sistema.
- `ANDROID_HOME` = `%LOCALAPPDATA%\Android\Sdk`. `adb` está en `platform-tools`.
- Vista previa en VS Code: `npm run dev`. Preparar Android: `npm run sync` (luego Android Studio compila e instala). Comprobar la compilación desde la terminal: `gradlew assembleDebug` en `memory-app/android/`.
- Las pruebas manuales en móvil real (guardado, notificaciones con la app cerrada) las hace el usuario.

## Git Author Identity — Mandatory

The Git author and committer identity must always belong to the repository owner, never to Claude.

### Rules

1. NEVER configure Claude as the Git author or committer.
2. NEVER change `git config user.name` or `git config user.email`.
3. NEVER use Claude's name, email, or bot identity in Git commits.
4. When generating code, do not create commits automatically.
5. I am responsible for creating and publishing all commits.
6. Do not modify existing commit authors or rewrite Git history without explicit permission.

### Commit identity verification

Before any commit operation (only when explicitly authorized), verify:

- `git config user.name`
- `git config user.email`

The author and committer must use my configured GitHub identity.

If the identity is not mine or cannot be verified, STOP and ask me before proceeding.

### Important

Claude is a coding assistant, not a repository contributor.

All commits must be attributed to the repository owner, who is solely responsible for committing and pushing changes.