### Diseño

Define la estructura y las tecnologías de la app. Debe estar aprobado antes de implementar y se actualiza con cualquier cambio (ver [README.md](../README.md)).

#### Tecnologías

| Área | Elección | Motivo |
|---|---|---|
| Plataforma | Capacitor: app web empaquetada como app Android nativa (WebView), solo Android | R1: solo Android. El proyecto Android generado es Kotlin/Java con Gradle, sin código C++: Android Studio lo compila sin ajustes del sistema (React Native/Expo fallaba en Windows por rutas de más de 260 caracteres en su compilación C++) |
| Lenguaje | TypeScript (todo el código de la app) | Tipos para el modelo de datos |
| Datos | JSON | R3, R9 |
| Android nativo | Proyecto de Capacitor en `memory-app/android/` (Gradle). Se genera una vez con `npx cap add android`, se versiona y se abre en Android Studio. No se escribe código nativo a mano | Android Studio compila e instala la app como cualquier proyecto Android |
| Compilación web | Vite | Servidor de desarrollo rápido para la vista previa y empaquetado de `dist/`, que Capacitor copia a Android |
| Interfaz | React + React DOM | Componentes y estado con Context + `useReducer`; las pruebas usan Testing Library |
| Navegación | React Router en modo hash (`createHashRouter`) | Rutas simples que funcionan igual en el WebView, en la vista previa y en las pruebas (`createMemoryRouter`) |
| Almacenamiento | `@capacitor/filesystem` sobre `personas.json`, `casas.json` y `ajustes.json` (directorio `Data` de la app) | R3, R9, RNF2: datos locales en JSON |
| Notificaciones | `@capacitor/local-notifications` (locales programadas) | R4, RF9, RNF5: sin servicio push; Android las entrega con la app cerrada |
| Compartir archivo | `@capacitor/share` (exportar); `<input type="file">` del WebView (importar) | RF11, RF12 |
| Arranque y sistema | `@capacitor/splash-screen` (splash hasta tener fuentes y datos), `@capacitor/status-bar` (iconos oscuros), `@capacitor/app` (botón atrás de Android) | Esqueleto común de la interfaz |
| Estado | React Context + `useReducer` | App pequeña; sin librería extra |
| Pruebas | Vitest + jsdom + Testing Library (`@testing-library/react`, `user-event`, `jest-dom`) | Probar lógica, repositorio y pantallas; Vitest usa la misma configuración que Vite |
| Estilos | Tailwind CSS 3 con el bloque `tailwind.config` del prototipo copiado en `memory-app/tailwind.config.ts` | El prototipo está escrito en Tailwind 3: sus clases se copian tal cual y se ven igual |
| Tipografía | Lora (texto: 400, 500, 600, 700 y cursiva 400) y Playfair Display (títulos: 600 y 700) con `@fontsource/lora` y `@fontsource/playfair-display`, empaquetadas en la app | Petición del usuario (2026-11-09): una tipografía formal, menos sencilla que la del prototipo (ver Desviaciones); empaquetadas porque la app funciona sin conexión (RNF2) |
| Iconos | Material Symbols Outlined del paquete `material-symbols`, empaquetada | Es la fuente de iconos del prototipo, con los mismos nombres y el eje `FILL` |
| Efectos | CSS: degradados, `backdrop-filter` (cristal), `box-shadow`, transiciones y animaciones | Sin librerías: el WebView los soporta |

Versiones exactas (fijadas en `memory-app/package.json`, sin `^` ni `~`):

| Paquete | Versión |
|---|---|
| @capacitor/core / @capacitor/cli / @capacitor/android | 8.6.0 |
| @capacitor/filesystem | 8.1.5 |
| @capacitor/local-notifications | 8.3.1 |
| @capacitor/share | 8.0.3 |
| @capacitor/splash-screen | 8.0.2 |
| @capacitor/status-bar | 8.0.4 |
| @capacitor/app | 8.1.2 |
| vite / @vitejs/plugin-react | 8.3.6 / 6.2.1 |
| react / react-dom | 19.3.1 |
| react-router | 8.5.1 |
| tailwindcss / postcss / autoprefixer | 3.4.19 / 8.5.32 / 10.6.2 |
| @fontsource/lora / @fontsource/playfair-display | 5.3.0 / 5.3.0 |
| material-symbols | 0.48.3 |
| typescript | 6.0.3 |
| vitest / jsdom | 5.1.0 / 31.0.0 |
| @testing-library/react / user-event / jest-dom | 16.3.3 / 14.6.8 / 7.0.1 |
| @types/react / @types/react-dom | 19.3.0 / 19.3.0 |
| @types/node (tipos para leer archivos en las pruebas) | 26.6.6 |

Se instalan en el Sprint 0 todos los paquetes salvo `@capacitor/share` (Sprint 8). TypeScript se queda en 6.0.3: la 7 es la versión nueva escrita en Go y aún no se usa con estas herramientas.

Scripts (desde `memory-app/`): `npm run dev` (vista previa en el navegador), `npm test` (Vitest, una pasada), `npm run typecheck` (`tsc --noEmit`), `npm run build` (comprueba tipos y empaqueta `dist/`), `npm run sync` (`build` + `npx cap sync android`: copia la web y los plugins al proyecto Android), `npm run android` (`sync` + abre Android Studio).

Identificador de la app: `com.tupanditta.memory` (en `capacitor.config.ts` y en `android/app/build.gradle`).

Entorno de desarrollo (Windows): Node 24, npm 11, Git, Android Studio con SDK (API 35 y 36, build-tools 36.0.0, platform-tools). Capacitor 8 necesita JDK 21: se usa el JDK que incluye Android Studio (`JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr`), no el Java 8 del sistema. `ANDROID_HOME` = `%LOCALAPPDATA%\Android\Sdk`. No hace falta ningún permiso de administrador ni cambiar el registro.

#### Versión de Android

- **Mínima: Android 7.0 (API 24)** (`minSdkVersion` en `android/variables.gradle`). Es también el mínimo de Capacitor 8.
- **Objetivo (`targetSdk`) y `compileSdk`**: los que fije Capacitor 8 en `android/variables.gradle`.
- El WebView de Android se actualiza desde Google Play; las funciones CSS usadas (`backdrop-filter`, `gap`, `aspect-ratio`) necesitan un WebView 76 o superior, el habitual en móviles con Android 7 actualizados.
- Android 13 o superior (API 33+): el permiso `POST_NOTIFICATIONS` se pide en tiempo de ejecución (ver Notificaciones).
- Las notificaciones usan fecha programada no exacta (`allowWhileIdle`): pueden retrasarse unos minutos con el ahorro de batería. Es aceptable para un aviso del día anterior.

#### Vista previa y flujo de trabajo

1. **Mientras se desarrolla (VS Code)**: `npm run dev` abre la app en el navegador (Vite), que se ve dentro de VS Code con *Simple Browser*. Sirve para pantallas, navegación, búsqueda y lógica.
   - En web no hay sistema de archivos ni notificaciones del móvil. El repositorio usa una interfaz `Almacen` con dos implementaciones: archivos JSON (Android) y `localStorage` (solo vista previa web). Las notificaciones se desactivan en web.
   - Por tanto, la vista web **no** prueba el guardado real en JSON ni los avisos.
2. **Para probar en Android**: `npm run android` empaqueta la web, la copia al proyecto Android (`cap sync`) y abre `memory-app/android` en Android Studio. Desde ahí, Run instala la app en el emulador o en un móvil conectado por USB con depuración activada. Tras cambiar código web hay que repetir `npm run sync` antes de Run.
3. **Prueba final en el móvil**: comprobar guardado en JSON, persistencia al reabrir y notificaciones con la app cerrada.

#### Arquitectura

Tres capas. Cada capa solo llama a la de abajo.

```
UI (pantallas, componentes)
  └─ Servicios (reglas de negocio)
       └─ Repositorio (lectura/escritura de JSON)
```

- **UI**: muestra datos del estado y lanza acciones. No escribe archivos.
- **Servicios**: validan, aplican reglas (casa no vacía, ids existentes), llaman al repositorio y programan notificaciones.
- **Repositorio**: único código que toca los JSON.

#### Estructura de carpetas

En la raíz solo hay `.gitignore`, `.gitattributes` y `README.md` (R12). Todo lo demás va en carpetas:

```
/                         .gitignore, .gitattributes, README.md
.claude/CLAUDE.md         instrucciones para el agente de IA
Software/                 especificaciones y archivos de datos de ejemplo
  prototipo/              prototipo de Google Stitch (capturas screen.png, code.html y pastel_sanctuary/DESIGN.md por pantalla)
memory-app/               proyecto web + Capacitor (appId: com.tupanditta.memory)
  android/                proyecto Android de Capacitor (se versiona; se abre en Android Studio)
  public/                 icono de la web (favicon)
  index.html              página única de la app
  capacitor.config.ts     appId, nombre, webDir dist y ajustes de plugins (splash)
  tailwind.config.ts      tokens del prototipo (ver Interfaz)
  vite.config.ts          Vite y Vitest
  src/
    main.tsx              arranque: fuentes, datos y splash hasta que ambos estén listos
    App.tsx               rutas y barra de pestañas
    estilos.css           Tailwind, fuentes y Material Symbols
    pantallas/            Inicio.tsx (CU3, CU9), Persona.tsx (CU1-CU4), Casa.tsx (CU7-CU9), Calendario.tsx (CU5), Ajustes.tsx (CU10-CU12)
    modelos/              tipos Persona, Casa, Fecha, Direccion, Ajustes
    repositorio/          lectura y escritura de JSON
    servicios/            personasService, casasService, notificacionesService, intercambioService
    estado/               contexto y reducer
    utilidades/           normalizar texto, calcular próxima fecha, búsqueda
    componentes/          piezas de UI reutilizables (ver Interfaz > Componentes)
  __tests__/              pruebas de Vitest
```

Rutas: `/` Inicio, `/calendario`, `/ajustes`, `/persona/:id` y `/casa/:id` (`id = "nueva"` para crear).

#### Datos y persistencia

- Archivos en el directorio de datos de la app (`Directory.Data` de `@capacitor/filesystem`): `personas.json`, `casas.json`. Estructura en [casos_de_uso.md](casos_de_uso.md).
- La hora de notificación se guarda en un tercer archivo, `ajustes.json` (`{ "horaNotificacion": "09:00" }`).
- Al arrancar, el repositorio carga los JSON a memoria. Si un archivo no existe, lo crea con `[]`.
- **Escritura segura (RNF7, RNF9)**: el servicio calcula el nuevo estado sin tocar el actual. El repositorio escribe cada archivo en `<nombre>.tmp` y luego lo renombra. Solo si termina bien, el estado en memoria cambia y la UI se actualiza. Si falla, se borran los `.tmp`, el estado queda igual y la UI muestra un error.
- **Varios archivos (RNF8)**: se escriben todos los `.tmp` primero y se renombran después. Si el arranque encuentra `.tmp` huérfanos de un cierre a mitad, los descarta y conserva los archivos válidos.
- **Interfaz `Almacen`** (`memory-app/src/repositorio/`): `leer`, `escribirTmp`, `confirmarTmp`, `borrarTmp`, `borrar`, `listarTmp`. Implementaciones: `AlmacenArchivos` (`@capacitor/filesystem`: `readFile`, `writeFile`, `rename`, `deleteFile`, `readdir`, Android) y `AlmacenLocalStorage` (solo vista previa web). Se elige con `Capacitor.isNativePlatform()`. `Repositorio` (`iniciar`, `guardar`) usa solo esta interfaz.
- Archivos del repositorio: `almacen.ts` (interfaz; `leer` devuelve `null` si el archivo no existe y `listarTmp` devuelve los nombres sin `.tmp`), `almacenArchivos.ts` (comprueba si un archivo existe con `readdir` del directorio; recibe el `Filesystem` por parámetro para las pruebas), `almacenLocalStorage.ts` (una clave `memory/<nombre>` por archivo; recibe el `Storage` por parámetro) y `repositorio.ts` (`Repositorio`, `Datos`, `crearAlmacen`, `limpiarCasas`). `iniciar()` devuelve `Resultado<Datos>`; `guardar(cambios)` recibe solo los archivos que cambian (`{ personas?, casas?, ajustes? }`) y devuelve `Resultado<void>`. `Resultado<T>` (`{ ok: true, valor }` o `{ ok: false, error }`) está en `modelos/tipos.ts`. Los JSON se escriben con sangría de 2 espacios.
- **Deshacer en operaciones dobles**: antes de confirmar, el repositorio guarda el contenido original de cada archivo; si un renombrado falla, restaura los ya confirmados y borra los `.tmp`.
- **Archivo dañado**: si un JSON no se puede analizar o no tiene la forma esperada, la carga devuelve un error y no escribe nada (ni crea los archivos que falten).
- **Integridad (RNF10)**: al cargar, el repositorio quita de las casas los ids que no existan en `personas.json` y descarta las casas que queden vacías. La limpieza se aplica en memoria; el archivo se reescribe en el siguiente guardado de casas.
- **Ids**: cadenas únicas generadas al crear (UUID v4, generado con `nuevoId()` en `utilidades/id.ts` a partir de `Math.random`; no depende de `crypto.randomUUID`, que falta en WebViews antiguos).

#### Modelos y utilidades

- `modelos/tipos.ts`: `Persona`, `Casa`, `Fecha` (`tipo` `"cumpleaños"` o `"aniversario"`, `anio` opcional), `Direccion` (los ocho campos de texto, vacíos si no se rellenan), `Ajustes`, `direccionVacia()` y `ajustesPorDefecto()` (`horaNotificacion` `"09:00"`). `apodo` es siempre un texto (vacío si no hay).
- `modelos/validadores.ts`: `validarPersona` (id y nombre no vacíos, dirección y fechas válidas), `validarFecha` (día que exista en el mes; el 29/02 es válido sin año o con año bisiesto; año entero opcional), `validarCasa` (id, apodo no vacío, al menos una persona sin repetir), `validarDireccion`, `validarHora` (`HH:MM`) y `validarAjustes`. Reciben `unknown` y devuelven `{ ok: true }` o `{ ok: false, error }` con el mensaje en español; los usan los servicios, el repositorio (forma de los JSON) y la importación.
- `utilidades/texto.ts`: `normalizarTexto` (NFD sin diacríticos y en minúsculas).
- `utilidades/fechas.ts`: `proximaFecha(fecha, desde)` (incluye el propio día; el 29/02 se celebra el 1 de marzo en años no bisiestos) y `fechaAviso(fecha, desde)` (día anterior a la próxima ocurrencia).

#### Servicios

- `Tienda` (`servicios/tienda.ts`) guarda el estado en memoria (`datos`). `aplicar(cambios)` llama a `Repositorio.guardar` y solo si devuelve `ok` actualiza el estado y devuelve `Resultado<Datos>` con el estado nuevo (RNF9). Los nombres y apodos se guardan sin espacios al principio ni al final; `editar` mezcla la dirección parcial con la actual. Las fechas se editan y borran por su índice en `fechas`. Los servicios reciben la `Tienda`, calculan el nuevo estado sin mutar el actual y devuelven `Resultado` (`ok`/`error`).
- `PersonasService`: `crear(datos, casasIds?)` (si recibe casas, añade la persona a ellas en el mismo `guardar`; formulario "Asignar a una casa"; un id de casa inexistente rechaza la operación), `editar(id, cambios, casasIds?)` (con casas, deja a la persona exactamente en ellas en el mismo `guardar`: la añade a las nuevas, la quita de las demás y borra las que quedan vacías; solo escribe `casas.json` si cambia), `borrar` (quita a la persona de sus casas y borra las que queden vacías, en un solo `guardar`), `casasQueSeBorrarian` (para avisar antes de borrar), `anadirFecha`, `editarFecha`, `borrarFecha`, `buscar`.
- `CasasService`: `crear`, `editar` (apodo, dirección parcial y lista completa de `personas`), `borrar`, `anadirPersona`, `quitarPersona(id, personaId, confirmado)` (si es la última devuelve `{ ok: false, requiereConfirmacion: true }` sin cambiar nada; con `confirmado` borra la casa y devuelve `valor: null`), `buscar`, `casasDePersona` (lista de `{ casa, convivientes }`, donde `convivientes` son los demás miembros), `miembros`. Una casa se rechaza si no tiene personas o alguna no existe. Borrar una casa no borra a sus personas.

#### Interfaz (prototipo de Google Stitch)

La interfaz reproduce el prototipo de [prototipo/](prototipo/) (sistema "Pastel Sanctuary", pantallas en `screen.png` y `code.html`). Regla general: **se copia el prototipo tal cual** (estructura, textos, mayúsculas, clases de Tailwind, iconos) y solo se cambia lo que contradice una especificación o no tiene datos detrás; cada cambio está en "Desviaciones". Orden de prioridad: 1) requisitos, restricciones y modelo de datos; 2) valores de `code.html` (Tailwind); 3) capturas; 4) la prosa de `pastel_sanctuary/DESIGN.md`. Esa prosa difiere en algunos valores del `code.html` (p. ej. primario `#6B8AFD` frente a `#3355C6`, radio de tarjeta 24 frente a 32, fondo de píldora activa 12 % frente a 10 %): se usan los de `code.html`, que son los que se ven en las capturas.

Como la app es HTML con Tailwind 3, igual que el prototipo, las clases de `code.html` se copian sin convertir (`p-4`, `gap-3.5`, `rounded-lg`, `bg-primary-fixed/80`…). Las medidas de este documento están en px de CSS (1 unidad de Tailwind = 4 px). Las clases `hover:` no se copian (no hay ratón); `active:scale-*` sí (ver Pulsación).

##### Tokens (`tailwind.config.ts`)

`memory-app/tailwind.config.ts` copia literalmente el bloque `tailwind.config` de los `code.html` (`theme.extend`: `colors`, `borderRadius`, `spacing`, `fontFamily`, `fontSize`) y añade solo las sombras con nombre de la tabla de abajo. Ningún componente escribe colores ni medidas sueltas fuera de esos tokens o de las clases que usa el prototipo. Las opacidades se escriben como en el prototipo (`bg-surface/80`).

Colores (nombres del bloque `tailwind.config` del prototipo; en las clases van en kebab-case, p. ej. `surface-container-low`):

| Token | Valor | Uso principal |
|---|---|---|
| `surface` / `background` | `#FAF8FF` | Fondo de pantalla, cabecera (80 %) y splash |
| `surfaceContainerLowest` | `#FFFFFF` | Tarjetas, buscador, barra de pestañas (85 %) |
| `surfaceContainerLow` | `#F2F3FF` | Campos de formulario, bloques internos, chips inactivos |
| `surfaceContainer` | `#EBEDFF` | Bloques de nota, botones de la hoja de opciones, chip de fecha normal |
| `surfaceContainerHigh` | `#E3E7FF` | Insignias de día, avatar "+N", contador de seleccionados |
| `surfaceContainerHighest` / `surfaceVariant` | `#DBE1FF` | Pista del deslizador, avatar neutro |
| `onSurface` | `#121A34` | Texto principal |
| `onSurfaceVariant` | `#444653` | Texto secundario |
| `outline` / `outlineVariant` | `#747685` / `#C4C5D5` | Metadatos, iconos de campo, marcadores de posición |
| `primary` / `onPrimary` | `#3355C6` / `#FFFFFF` | Chip de filtro activo, botón "Guardar casa", marca "Memory" |
| `primaryContainer` / `onPrimaryContainer` | `#6B8AFD` / `#002173` | Botón "Guardar persona", chips de selección activos, tinte de sombras |
| `primaryFixed` / `primaryFixedDim` | `#DCE1FF` / `#B7C4FF` | Botón "Persona", "Exportar", avatares azules |
| `onPrimaryFixed` / `onPrimaryFixedVariant` | `#001551` / `#0F3BAD` | Texto sobre `primaryFixed` |
| `secondary` / `onSecondary` | `#634EB1` / `#FFFFFF` | Acentos lilas |
| `secondaryContainer` / `onSecondaryContainer` | `#AC97FF` / `#3F288B` | Final de degradados, círculo de "Casas a las que pertenece" |
| `secondaryFixed` / `secondaryFixedDim` | `#E7DEFF` / `#CCBEFF` | Botón "Casa", "Importar", chips de casa, avatares lilas |
| `onSecondaryFixed` / `onSecondaryFixedVariant` | `#1E0060` / `#4B3597` | Texto sobre `secondaryFixed` |
| `tertiary` / `onTertiary` | `#1B6A56` / `#FFFFFF` | Corazón del avatar, iconos verdes (candado, escudo, check) |
| `tertiaryFixed` / `tertiaryFixedDim` | `#A6F2D7` / `#8BD5BC` | Avatares menta, estrella, chip de casa seleccionado |
| `onTertiaryFixed` / `onTertiaryFixedVariant` | `#002118` / `#00513F` | Texto sobre `tertiaryFixed` |
| `error` / `onError` | `#BA1A1A` / `#FFFFFF` | Errores, "Eliminar" |
| `errorContainer` / `onErrorContainer` | `#FFDAD6` / `#93000A` | Fecha cercana, fondo de "Eliminar" (40 %), banner de error |
| `inverseSurface` / `inverseOnSurface` | `#272F4A` / `#EFF0FF` | Aviso emergente; fondo de hojas (30 %) |
| `inversePrimary` / `surfaceDim` / `surfaceTint` | `#B7C4FF` / `#D1D9FB` / `#3355C6` | Reservados (están en el prototipo, no se usan) |

Tipografía (desviación pedida por el usuario el 2026-11-09): texto en Lora (pesos 400, 500, 600 y 700, y cursiva 400) y títulos en Playfair Display (600 y 700), cargadas en `main.tsx` desde `@fontsource/lora` y `@fontsource/playfair-display`, con respaldo `Georgia, serif`. `estilos.css` pone Lora en `html` y Playfair Display en `h1`–`h3`; en `tailwind.config.ts`, `fontFamily` lleva Playfair Display en las claves `headline-*` y Lora en las demás. Los tamaños son las clases `text-*` del bloque `fontSize` del prototipo (sin cambios); el peso se puede cambiar con `font-medium`, `font-bold`… como hace el prototipo. Interletra solo donde el prototipo la pone (`tracking-tight`, `tracking-wide`, `tracking-wider`).

| Estilo | Tamaño / interlínea (px) | Peso |
|---|---|---|
| `headline-lg` | 30 / 38 | 700 |
| `headline-md` | 24 / 32 | 600 |
| `headline-sm` | 20 / 28 | 600 |
| `body-lg` | 16 / 24 | 400 |
| `body-md` | 14 / 20 | 400 |
| `body-sm` | 12 / 18 | 400 |
| `label-lg` | 14 / 20 | 600 |
| `label-md` | 12 / 16 | 600 |
| `label-sm` | 11 / 14 | 500 |

`leading-relaxed` donde el prototipo lo indica (textos de ayuda largos).

Espacios (px): `space-xs` 4, `space-sm` 8, `space-md` 16 (= `gutter`), `space-lg` 24, `space-xl` 32, `margin` 20 (margen lateral de todas las pantallas).

Radios (px; ojo, el prototipo redefine `lg` y `xl`):

| Clase del prototipo | px | Uso |
|---|---|---|
| `rounded` (`DEFAULT`), `rounded-2xl` | 16 | Campos de persona, apodo de casa, bloques internos, filas de persona, botones de la hoja |
| `rounded-lg` | 32 | Tarjetas, tarjetas de sección, bloque de hora, iconos de casa de 48 (quedan circulares) |
| `rounded-xl` | 48 | Hojas inferiores, campos de dirección de casa (quedan en píldora) |
| `rounded-full` | 9999 | Chips, botones, avatares, barra de pestañas |

Sombras: las del prototipo, como clases de Tailwind (`shadow-sm`, `shadow-md`…) o con nombre en `tailwind.config.ts` (`boxShadow`) cuando el prototipo usa un valor propio:

| Token | Valor | Clase del prototipo |
|---|---|---|
| `shadow-tarjeta` | `0 8px 24px -4px rgba(107,138,253,0.08)` | Tarjetas de Inicio |
| `shadow-buscador` / `shadow-buscador-foco` | `0 8px 24px -4px rgba(107,138,253,0.10)` / `0 8px 28px -2px rgba(107,138,253,0.18)` | Buscador |
| `shadow-barra` | `0 8px 24px -4px rgba(107,138,253,0.15)` | Barra de pestañas |
| `shadow-boton-azul` / `shadow-boton-lila` | `0 4px 16px -2px rgba(107,138,253,0.14)` / `0 4px 16px -2px rgba(155,134,237,0.14)` | Botones "Persona" y "Casa" |
| `shadow-cabecera` | `0 1px 8px 0 rgba(0,0,0,0.03)` | Cabecera |
| `shadow-sm`, `shadow-md`, `shadow-xl`, `shadow-2xl`, `shadow-inner` | Valores de Tailwind 3 | Tarjetas del resto de pantallas, "Próximo aviso", aviso emergente, hojas inferiores, insignias de día |

`shadow-xs` no existe en Tailwind 3 (el del prototipo): esos elementos no llevan sombra.

Pulsación: todo elemento pulsable (`<button>` o enlace) reduce su escala con `transition-transform duration-150`: `active:scale-95` donde el prototipo lo pone (botones "Persona"/"Casa", chips de hora, exportar/importar, botón de opciones) y `active:scale-[0.98]` en el resto (tarjetas, botones de guardar, botones de la hoja). Zona táctil mínima 48 × 48 px (con relleno o un pseudo-elemento si el elemento visible es menor). Se quita el resaltado azul de pulsación del WebView (`-webkit-tap-highlight-color: transparent`). La app es solo en modo claro.

Iconos: componente `Icono` que pinta `<span class="material-symbols-outlined">nombre</span>` con la fuente del paquete `material-symbols` (sin red), con los mismos nombres que el prototipo y `FILL` 1 donde el prototipo pone `font-variation-settings: 'FILL' 1` (prop `relleno`). El tamaño va en px (`text-[20px]`). Un test comprueba que todos los nombres usados existen en la lista de nombres que publica el paquete (`index.d.ts`). Emojis 🎂 (cumpleaños) y 💍 (aniversario), con la fuente de emojis del sistema, donde el prototipo los pone.

##### Esqueleto común

- **Cabecera fija** (`componentes/Cabecera`, `header` del prototipo): alto 64 + margen seguro superior; fondo `surface` al 80 % con `backdrop-blur-xl` (respaldo `rgba(250,248,255,0.92)` si el WebView no soporta `backdrop-filter`); `shadow-cabecera`; padding lateral 20. En las pestañas, a la izquierda el texto "Memory" (`headline-sm`, `primary`, `tracking-tight`). En pantallas de pila, a la izquierda botón atrás de 44 × 44 circular con margen izquierdo −8 (icono `arrow_back` 22, `on-surface-variant`) y, separado 8, el título (`headline-sm`, `on-surface`, `tracking-tight`, ancho máx. 160, una línea con puntos suspensivos). Sin logotipo ni botón de perfil (Desviaciones).
- **Márgenes seguros**: la app se dibuja bajo las barras del sistema (borde a borde) y respeta `env(safe-area-inset-top)` y `env(safe-area-inset-bottom)` (clases `pt-safe`/`pb-safe` del prototipo). Si el WebView no da esos valores, se usan las variables que inyecta Capacitor 8 en Android (`--safe-area-inset-*`, plugin `SystemBars`): `estilos.css` define `--margen-seguro-sup` y `--margen-seguro-inf` como el mayor de los dos. `#raiz` tiene padding superior = margen seguro + 16, para que el bloque superior no quede pegado a la barra de estado (petición del usuario, 2026-11-09).
- **Cuerpo**: `<main>` con desplazamiento vertical, padding lateral 20 y padding superior = alto de la cabecera. Pantallas de pestaña: padding inferior 112 (`pb-28`) y separación vertical 24 entre bloques (`gap-space-lg`). Pantallas de pila: padding inferior = margen seguro + 40 (`pb-10`; formulario de casa + 32).
- **Barra de pestañas** (`componentes/BarraPestanas`, en `App.tsx` solo para las rutas de pestaña): contenedor fijo con margen lateral 20 y 8 sobre el margen seguro inferior; barra de ancho máximo 384 centrada, alto 64, `rounded-full`, fondo blanco al 85 % con `backdrop-blur` (respaldo `rgba(255,255,255,0.92)`), `shadow-barra`, padding lateral 8, elementos repartidos (`justify-around`). Cada elemento (`NavLink`): mínimo 64 × 44, padding 16 × 6, `rounded-full`, icono 22 sobre etiqueta `label-sm` con separación 4. Activo: fondo `primary` al 10 %, icono y texto `primary` y `aria-current="page"`; inactivo: `on-surface-variant`. Destinos: "Inicio" (`cottage`), "Calendario" (`calendar_month`), "Ajustes" (`tune`). No aparece en `/persona/:id` ni en `/casa/:id`.
- **Barra del sistema**: `@capacitor/status-bar` con iconos oscuros sobre fondo transparente.
- **Botón atrás de Android** (`@capacitor/app`, evento `backButton`): cierra la hoja o el diálogo abierto; si no hay, vuelve a la pantalla anterior; en una pestaña raíz, sale de la app.
- **Arranque**: `@capacitor/splash-screen` (`launchAutoHide: false`, fondo `#FAF8FF`) mantiene el splash hasta que se cargan las fuentes (`document.fonts.ready`) y los datos (`Repositorio.iniciar`); después se oculta con `SplashScreen.hide()`. Si la carga de datos falla, se muestra el error a pantalla completa.

##### Componentes (`componentes/`)

| Componente | Descripción |
|---|---|
| `Tarjeta` | Fondo `surface-container-lowest`, `rounded-lg` (32). Props: `padding` (16 o 24), `sombra` (`shadow-tarjeta` en Inicio, `shadow-sm` en el resto), `fondo` (color con opacidad, p. ej. `bg-secondary-fixed/20`) y `degradado` (`bg-gradient-to-*` con colores). `overflow-hidden` para franjas y círculos decorativos |
| `CirculoDifuso` | Círculo decorativo de color translúcido en una esquina de una tarjeta, como en el prototipo (`blur-xl`/`blur-2xl`, opacidad 20–30 %, `pointer-events-none`) |
| `Boton` | `<button>` en píldora con icono opcional a la izquierda (separación 8). Variantes: `azulSuave` (`primary-fixed`/`on-primary-fixed`), `lilaSuave` (`secondary-fixed`/`on-secondary-fixed`), `primario` (`primary`/`on-primary`, alto 56, `shadow-md`), `primarioSuave` (`primary-container`/`on-primary-container`, padding vertical 16, `shadow-sm`), `texto` (transparente, `on-surface-variant`), `opcionHoja` (radio 16, padding 16, fondo `surface-container`, icono y texto separados 16, `label-lg`) y `opcionHojaPeligro` (igual con fondo `error-container/40`, icono y texto `error`). `disabled` con opacidad 50 % |
| `Chip` | Píldora de texto (con icono o emoji opcional, separación 4–6). Medidas por uso, indicadas en cada pantalla (habitual: 10 × 4 con `label-sm`; 16 × 6 con `label-md`) |
| `Avatar` | Círculo con iniciales. Tamaños 20, 24, 40, 44, 48, 112. Color por `colorAvatar(id)`: hash estable del `id` sobre la paleta del prototipo `primary-fixed`/`on-primary-fixed`, `secondary-fixed`/`on-secondary-fixed`, `tertiary-fixed`/`on-tertiary-fixed`, `secondary-fixed-dim`/`on-secondary-fixed`, `surface-variant`/`on-surface`. Variante `destacado` (Inicio): degradado de abajo-izquierda a arriba-derecha `primary-container` → `secondary-container`, letra `on-primary`, `shadow-sm`, e insignia de 16 px `tertiary-fixed` en (−2, −2) abajo a la derecha con `star` 10 relleno `on-tertiary-fixed` |
| `FilaAvatares` | Avatares de 24 px solapados −6 px, letra 10 en 700. Con más de 2 personas: 2 avatares y un tercero "+N" (`surface-container-high`/`on-surface-variant`, letra 9) |
| `CabeceraSeccion` | Fila con padding lateral 4: icono 18 + título `headline-sm` (separación 8) a la izquierda y contador `label-sm` `outline` a la derecha |
| `CabeceraTarjeta` | La de las tarjetas de detalle: círculo de 36 con icono 20, y a su lado sobretítulo `label-sm` en mayúsculas `tracking-wider` `on-surface-variant` y título `headline-sm` (separación 8); chip opcional a la derecha |
| `Campo` | `<label>` + `<input>`/`<textarea>` (separación 6). La entrada lleva icono opcional a 14 px de la izquierda (20, `outline`; padding izquierdo 44). Variantes: `suave` (fondo `surface-container-low`, radio 16, padding 16 × 12, `body-md`), `blanco` (fondo blanco, radio 16, alto 56, `shadow-sm`, icono a 16 y padding izquierdo 48), `pildora` (fondo `surface-container-low`, radio 48, alto 48, padding 14, sin etiqueta visible: solo marcador y `aria-label`). Marcador `outline`. Foco: fondo blanco y anillo de 2 px `primary-container`. Error: anillo de 2 px `error`, `aria-invalid` y mensaje `label-sm` `error` debajo |
| `CamposDireccion` | Calle, número, portal, piso, puerta, código postal, ciudad y notas. Prop `forma`: `suave` (persona: con etiquetas `label-sm` `on-surface-variant`, separación 8 entre columnas) o `pildora` (casa: solo marcadores, separación 8 entre columnas y 12 entre filas). Disposición en las dos: Calle (2/3) + Nº (1/3, centrado) / Portal + Piso + Puerta / Código postal + Ciudad / Notas (área de texto) |
| `ChipSeleccion` | `<button>` de elección con `aria-pressed`: inactivo `surface-container-low`/`on-surface-variant`; activo según uso (tipo de fecha: `primary-container`/`on-primary-container`; casa: `tertiary-fixed`/`on-tertiary-fixed-variant` con `check` 16 al final) |
| `FilaPersonaSeleccionable` | Fila blanca (`role="checkbox"`, `aria-checked`), radio 16, padding 10, `shadow-sm`: avatar 44 con dos iniciales (`label-md`, `shadow-sm`), separación 12, nombre `label-lg` y apodo `body-sm` `on-surface-variant` (una línea cada uno); a la derecha círculo de 28 `surface-container` con `check` 18 transparente. Seleccionada: fila con fondo `primary-fixed/20` y círculo `primary` con `check` `on-primary` |
| `HojaInferior` | Capa `inverse-surface/30` a pantalla completa (`backdrop-blur-sm`) con padding 16; hoja blanca (`role="dialog"`, `aria-modal`) pegada abajo, ancho máx. 384, radio 48, padding 24, `shadow-2xl`, contenido con separación 8; entra deslizándose desde abajo con fundido (transición CSS de 200 ms). Cabecera: título `label-lg` y botón de cerrar de 32 (`close` 18, `on-surface-variant`, `aria-label` "Cerrar"). Se cierra al pulsar fuera, con el botón o con atrás |
| `DialogoConfirmacion` | `HojaInferior` con título, texto `body-md` y dos botones (`opcionHojaPeligro` u `opcionHoja`, y `texto` "Cancelar"). Sustituye a `window.confirm` en todas las confirmaciones |
| `BannerError` | Bajo la cabecera (`role="alert"`): fondo `error-container`, texto `on-error-container` (`label-md`), icono `error` 18 `error`, radio 16, padding 16 × 12, botón de cerrar |
| `AvisoEmergente` | Píldora `inverse-surface`/`inverse-on-surface` (`role="status"`), `label-md`, icono 18 `tertiary-fixed`, visible 2,4 s con fundido y desplazamiento de 8–12 px. Variante flotante (abajo, centrada, 24 sobre el margen seguro, padding 24 × 12, `shadow-xl`) y variante en línea (en el flujo de la página, padding 16 × 8, `shadow-md`) |
| `EstadoVacio` | Columna centrada con padding 16 × 40: círculo de 64 `surface-container-low` con icono 32 `primary`, separación 12, título `headline-sm`, texto `body-md` `outline` (ancho máx. 320) |
| `TarjetaDireccion` | Tarjeta "Dirección" de la ficha de persona y del detalle de casa (Sprint 11): franja, `CabeceraTarjeta`, las tres líneas de `lineasDireccion` o "Sin dirección guardada", y las notas con su título |
| `Icono` | Ver Iconos. Props: `nombre`, `tamano`, `relleno`; `aria-hidden` |

##### Pantallas

**Inicio** (`pantallas/Inicio.tsx`, pestaña; referencia `inicio_buscador_y_contactos`). Bloques separados 24.
1. Saludo (padding superior 4, fila con espacio entre): a la izquierda "Buenos días" (`label-md`, peso 500, `primary`, `tracking-wide`) — "Buenas tardes" de 12:00 a 20:59 y "Buenas noches" de 21:00 a 5:59 — y debajo "Tus recuerdos cerca" (`headline-md`). A la derecha círculo decorativo de 40 (`surface-container-low`, `shadow-sm`, `star_shine` 20 `primary`), no pulsable.
2. Buscador: píldora blanca de alto 52, padding 16 × 12, `shadow-buscador`; `search` 22 `outline` con separación 12; entrada `body-md` con marcador "Buscar persona, casa o dirección..."; al haber texto aparece a la derecha el botón `close` 18 `outline` (`aria-label` "Limpiar búsqueda") que la vacía y devuelve el foco. Filtra con la búsqueda de la sección Búsqueda (sin tocar la lógica).
3. Acciones rápidas: rejilla de 2 columnas, separación 12. "Persona" (`Boton azulSuave`, `shadow-boton-azul`) y "Casa" (`Boton lilaSuave`, `shadow-boton-lila`), padding 16 × 12, `label-lg`, contenido centrado con separación 10; cada uno con un círculo de 24 blanco al 80 % que contiene `add` 16 `primary` o `add_home` 16 `secondary`. Abren `/persona/nueva` y `/casa/nueva`. `aria-label` "Añadir persona" y "Añadir casa".
4. Filtros: fila horizontal desplazable, separación 8, chips de padding 16 × 6 `label-md`: "Todos (N)", "Personas (n)", "Casas (m)", con los recuentos del resultado de la búsqueda. Activo: `primary`/`on-primary` con `shadow-sm`; inactivo: `surface-container-low`/`on-surface-variant`.
5. Sección **Personas** (columna con separación 12): `CabeceraSeccion` con `favorite` relleno `primary`, "Personas" y "N guardadas" ("1 guardada"). Tarjetas (separación 12; `Tarjeta` padding 16, `shadow-tarjeta`), toda la tarjeta pulsable → `/persona/:id`. Contenido en fila alineada arriba con separación 14:
   - `Avatar` 48 (`headline-sm` 700, `shadow-sm`); `destacado` si su próxima fecha está a 7 días o menos.
   - Columna: nombre (`label-lg`, `on-surface`) y, separado 6, apodo entre paréntesis (`body-sm`, `outline`); debajo (2) `location_on` 15 `outline` + dirección en una línea (`body-sm`, `on-surface-variant`; "calle número, piso+puerta", p. ej. "Calle Alcalá 42, 3ºB"; sin calle, la ciudad; sin dirección, la línea no aparece); debajo (10) fila de chips con separación 6 y padding 10 × 4 `label-sm`:
   - Chip de la próxima fecha: emoji (🎂/💍) + "Cumpleaños (02 Jun)" o "Aniversario (28 Abr)" (la etiqueta sustituye al tipo si existe; día con dos cifras y mes abreviado con mayúscula), fondo `surface-container` y texto `primary`. A 7 días o menos: fondo `error-container`, texto `on-error-container` y "En 4 días (14 Mar)" ("Hoy (14 Mar)", "Mañana (14 Mar)").
   - Un chip por casa de la persona (máximo 2; el resto, "+N"): `secondary-fixed`/`on-secondary-fixed-variant` con `cottage` 13.
   - Orden: alfabético por nombre normalizado.
6. Sección **Casas y lugares**: `CabeceraSeccion` con `holiday_village` relleno `secondary` y "N hogares" ("1 hogar"). Tarjeta de casa (igual que la de persona) → `/casa/:id`, fila con separación 14:
   - Icono de 48 circular con `shadow-sm`: `villa` o `cabin` 24 según hash del `id`, fondo y color alternos `secondary-fixed`/`on-secondary-fixed` y `primary-fixed`/`on-primary-fixed`.
   - Columna: fila con apodo (`label-lg`) y, a la derecha, chip "N miembros" (`surface-container-low`, `label-sm` `outline`, padding 8 × 2); debajo (2) `pin_drop` 15 `outline` + dirección (misma regla); debajo (12) `FilaAvatares` y, separado 8, los nombres (`body-sm`, `on-surface-variant`, una línea): con 1 o 2 miembros, nombres completos separados por coma ("Ana García, Pedro García"); con más, los nombres de pila de los dos primeros + " y N más" ("Carlos, Marta y 1 más").
   - Orden alfabético por apodo.
7. Una sección sin elementos tras filtrar se oculta. Sin ningún resultado: `EstadoVacio` con `manage_search`, "Sin coincidencias" y "No encontramos a nadie ni ninguna casa con ese término. Prueba con otro nombre." Con la app vacía y sin búsqueda: `EstadoVacio` con `favorite`, "Todavía no hay nada guardado" y "Añade una persona o una casa con los botones de arriba."

**Calendario** (`pantallas/Calendario.tsx`, pestaña; referencia `calendario_de_fechas`). Bloques separados 24.
1. Encabezado (separación 4): fila con `star_shine` relleno 20 `secondary` y "FECHAS SEÑALADAS" (`label-md`, `secondary`, mayúsculas, `tracking-wider`) separados 4; "Próximas fechas" (`headline-md`); "Nunca olvides un momento especial con las personas que amas." (`body-md`, `on-surface-variant`).
2. Tarjeta **Próximo aviso** (primera entrada de `entradasCalendario`): radio 32, padding 24, `shadow-md`, degradado de arriba-izquierda a abajo-derecha `primary-fixed` → `secondary-fixed` → `surface-container`, `CirculoDifuso` de 128 `secondary-container` 30 % en (−24, −24) abajo a la derecha. Contenido con separación 16:
   - Fila con espacio entre: píldora (blanco 80 %, padding 12 × 4) con punto de 8 `primary` que late (opacidad 1 ↔ 0,5, animación CSS, 2 s) y "Próximo aviso" (`label-sm` 600 `primary`), separación 6; a la derecha `Avatar` 40 dentro de un círculo blanco de 2 px de borde con `shadow-sm`.
   - Columna (separación 4): nombre (`headline-sm`, `on-primary-fixed`); fila (`on-primary-fixed-variant`, separación 4) con `cake` (cumpleaños) o `favorite` (aniversario) 18 + "Cumpleaños en 4 días • Sábado, 14 de Marzo" (`body-md` 500; "hoy"/"mañana" en lugar de "en N días"; día de la semana y mes con mayúscula).
   - Con padding superior 4: píldora (blanco 90 %, padding 12 × 6, separación 6) con `notifications_active` 16 `secondary` y "09:00 h el día anterior (13 Mar)" (`body-sm`, `on-surface-variant`; hora de ajustes y fecha de `fechaAviso`).
3. Meses (separación 32 entre meses; dentro, 8 entre cabecera y filas y entre filas): cabecera con padding lateral 4 y espacio entre: punto de 8 (rota `primary`, `secondary`, `tertiary` por orden de mes en la lista) + nombre del mes con mayúscula (`headline-sm` 600) separados 4; a la derecha "2 momentos" / "1 momento" (`label-sm`, `outline`). Se agrupa por la próxima ocurrencia.
4. Fila de fecha: `Tarjeta` padding 16, `shadow-sm`, pulsable → `/persona/:id`; fila con espacio entre:
   - Izquierda (separación 16): insignia circular de 48 con `shadow-inner`, mes abreviado en mayúsculas ("MAR", `label-sm`, margen inferior −4) sobre el día (`headline-sm` 700). Cumpleaños: `surface-container-high`/`primary`; aniversario: `secondary-fixed`/`secondary`. Columna: nombre (`body-lg` 700, `on-surface`) + apodo entre paréntesis (`body-sm` 400 `outline`) separados 6; debajo (separación 4, `on-surface-variant`) icono 15 (`cake` `secondary` en cumpleaños; `favorite` `primary` en aniversario) + tipo o etiqueta y, con año, " (34 años)" (`body-sm`).
   - Derecha (padding izquierdo 4): chip padding 10 × 4 `label-sm` 600: "En 4 días" ("Hoy", "Mañana"). Cumpleaños a 7 días o menos: `primary-fixed`/`on-primary-fixed-variant`; aniversario: `secondary-fixed`/`on-secondary-fixed`; resto: `surface-container-high`/`on-surface-variant`.
5. Tarjeta final (margen superior 8): `surface-container-low`, radio 32, padding 24, centrada, separación 4: círculo blanco de 40 con `shadow-sm` y `calendar_add_on` 20 `primary` (margen inferior 4), "Cada día guarda una historia" (`body-md` 600) y "Memory te avisa el día anterior para que estés presente en el momento adecuado." (`body-sm`, `outline`, ancho máx. 320).
6. Sin fechas: en lugar de 2 a 4, `EstadoVacio` con `event`, "Aún no hay fechas guardadas" y "Añade cumpleaños o aniversarios en la ficha de una persona."

**Detalle de persona** (`pantallas/Persona.tsx`, ruta `/persona/:id`, pila; referencia `detalle_de_persona`). Título de cabecera "Detalle Persona".
1. Cabecera de perfil (columna centrada, padding 16 arriba y 32 abajo):
   - Botón de opciones arriba a la derecha (absoluto): círculo de 40 `surface-container-low`, `shadow-sm`, `more_horiz` 20 `on-surface-variant`, `aria-label` "Opciones de perfil". Abre una `HojaInferior` "Opciones de contacto" con `opcionHoja` "Editar información" (`edit` `primary`, texto `on-surface`) y `opcionHojaPeligro` "Eliminar de contactos" (`delete`). Eliminar abre el `DialogoConfirmacion` que lista las casas que también se borrarán.
   - Avatar (margen 8 arriba y 16 abajo): halo de 120 (4 por cada lado) con degradado `secondary-fixed` → `primary-fixed` → `secondary-container` al 60 % y desenfoque (`box-shadow` `0 0 12px rgba(172,151,255,0.6)`); encima, círculo de 112 con degradado de abajo-izquierda a arriba-derecha `primary-fixed` → `secondary-fixed` → `secondary-container`, `shadow-md`, inicial `headline-lg` 700 `on-secondary-container`; abajo a la derecha (4, 4) círculo blanco de 24 con `shadow-sm` y `favorite` 14 `tertiary`.
   - Nombre (`headline-md`, `tracking-tight`, centrado). Si hay apodo, debajo (4) píldora `surface-container-high` 60 % (padding 16 × 2) con “Anita” entre comillas tipográficas (`label-md`, `secondary`, cursiva, `tracking-wide`).
2. Tarjetas en columna con separación 24 (`Tarjeta` padding 24, `shadow-sm`, contenido con separación 16):
   - **Dirección**: franja superior de 4 a todo el ancho con degradado horizontal `primary-container` 40 % → `primary-fixed` → transparente. `CabeceraTarjeta` con círculo `primary-fixed` 60 % y `pin_drop` relleno `primary`, "UBICACIÓN PRINCIPAL" y "Dirección particular". Bloque `surface-container-low` (radio 16, padding 16, separación 4): "Calle Alcalá 42" (calle + número; `label-lg`), "Portal 2, Piso 3º, Puerta B" (`body-md` `on-surface-variant`), "28014 Madrid" (`body-sm` `outline`); las partes vacías se omiten y, sin datos de dirección, el bloque muestra "Sin dirección guardada" (`body-md` `outline`). Si hay notas: bloque `surface-container` (radio 16, padding 16, fila separación 8) con `lightbulb` 20 `secondary` y columna (separación 2) "Nota para visitas" (`label-sm` 600 `secondary`) + notas (`body-sm` `on-surface-variant`, `leading-relaxed`).
   - **Fechas memorables**: fondo con degradado de arriba-izquierda a abajo-derecha `surface-container-lowest` → `surface-container-low` → `surface-container`. `CabeceraTarjeta` con círculo `secondary-fixed`/`on-secondary-fixed` y `cake` relleno, "RECORDATORIO" y "Fechas memorables". Una pieza blanca por fecha (radio 16, padding 16, fila con espacio entre): columna con emoji + tipo o etiqueta (`label-lg`, separación 6) y debajo (2) "14 de Marzo" (`body-md` `on-surface-variant`) seguido, con año, de " (1990 — 34 años)" (`body-sm` `outline`); a la derecha, solo en cumpleaños, chip del signo zodiacal ("Piscis"; `label-sm` 700 `primary` sobre `primary-fixed` 40 %, padding 8 × 4). Debajo de las fechas, franja `secondary-fixed` 40 % (radio 16, padding 16 × 8, espacio entre): `notifications_active` 18 + "Aviso activado día anterior a las 09:00" (`label-sm`, `on-secondary-fixed-variant`, separación 4) y `check_circle` 16 `secondary`. Con el permiso denegado: `notifications_off` + "Avisos desactivados (sin permiso)". Sin fechas: una pieza blanca con "Sin fechas guardadas" y sin franja.
   - **Casas a las que pertenece**: fondo `secondary-fixed` 20 %. `CabeceraTarjeta` con círculo `secondary-container`/`on-secondary-container` y `cottage` relleno, "CÍRCULO FAMILIAR", "Casas a las que pertenece" y chip blanco "1 hogar" / "N hogares" (`label-sm` `secondary`, padding 8 × 2). Una pieza blanca por casa (radio 16, padding 16, separación 8): fila con espacio entre: columna con apodo (`label-lg` 600) y debajo (2) `location_on` 14 `outline` + dirección (`body-sm` `on-surface-variant`); a la derecha botón circular de 28 `surface-container` con `arrow_forward` 16 `on-surface-variant` que abre la casa. Debajo (padding superior 4, separación 4): "Convivientes en esta casa" (`label-sm` `outline`) y chips de los demás miembros con separación 4 (`surface-container-low`, padding 8 × 4, separación 6: `Avatar` 20 con letra 10 700 + nombre `label-sm` `on-surface`), que abren a esa persona. Si es el único miembro: "Vive sola en esta casa" (`label-sm` `outline`). Sin casas: una pieza blanca con "No pertenece a ninguna casa".
3. Pie (margen superior 32, centrado, opacidad 70 %): `auto_stories` 16 `primary` + "Libreta personal de memorias" (`body-sm`, `on-surface-variant`), separación 4.

**Formulario de persona** (`/persona/nueva` y edición; referencia `a_adir_persona`). Título de cabecera "Detalle Persona".
1. Barra de contexto (padding vertical 8, margen inferior 16, espacio entre): columna con "MEMORIA COMPARTIDA" (`label-sm` 600, `primary`, mayúsculas, `tracking-wider`) y "Nueva Persona" ("Editar Persona" al editar; `headline-md`); a la derecha píldora "Cancelar" (`surface-container`, padding 16 × 4, `label-md` `on-surface-variant`, `close` 16, separación 4).
2. Banner (margen inferior 24): `surface-container-low`, radio 32, padding 16, `shadow-sm`, fila separación 16: círculo de 48 `primary-container` 20 % con `favorite` 26 `primary`; columna con "Guarda los detalles que importan" (`label-lg`, una línea) y "Su dirección, cumpleaños y peculiaridades en un lugar seguro." (`body-sm` `on-surface-variant`, una línea).
3. Tarjetas en columna con separación 32 (`Tarjeta` padding 24, `shadow-sm`, contenido con separación 16). Las de sección empiezan con una fila (espacio entre) con icono 22 + título `headline-sm` (separación 8) y "Opcional" (`label-sm` `outline`), y debajo (−4) un texto de ayuda `body-sm` `on-surface-variant`.
   - **Identidad**: fila (separación 16, padding inferior 8) con círculo de 64 `surface-container-high` con `shadow-inner` que muestra `face` 32 `primary` mientras el nombre está vacío y, cuando hay nombre, la inicial con su `colorAvatar`; a su lado "Icono de contacto" (`label-md`) y "Se crea con la inicial del nombre" (`body-sm` `on-surface-variant`). Después `Campo suave` "Nombre completo" con asterisco `primary` 700 (etiqueta `label-md` `on-surface`), icono `person`, padding vertical 14, marcador "Ej. Lucía Sánchez"; y `Campo suave` "Apodo o alias" (etiqueta `label-md` `on-surface-variant`, "Opcional" a la derecha), icono `sentiment_satisfied`, marcador "Ej. Luci". Nombre vacío al guardar: anillo `error`, mensaje "Escribe el nombre" y foco en el campo (CU1).
   - **Dirección particular**: icono `home_pin` `primary`; ayuda "Para recordar dónde visitarle o enviar detalles especiales."; `CamposDireccion suave` con etiquetas y marcadores: "Calle" ("Ej. Calle Jazmín"), "Nº" ("14"), "Portal" ("Ej. B"), "Piso" ("Ej. 3º"), "Puerta" ("Ej. Izq"), "Código Postal" ("Ej. 28004"), "Ciudad o Localidad" ("Ej. Madrid"); y, con padding superior 4, la etiqueta "Notas de llegada o acceso" con `info` 16 `secondary` (separación 4) y área de 3 líneas (radio 16, padding 16) con marcador "Ej. El timbre no suena, llamar al móvil o golpear dos veces."
   - **Fechas memorables**: icono `calendar_today` `secondary`; ayuda "Nunca olvides un momento para felicitarle o celebrar juntos." Por cada fecha (bloques separados 16): "Tipo de conmemoración" (`label-sm` `on-surface-variant`) y debajo (8) los `ChipSeleccion` "Cumpleaños" (`cake` 18) y "Aniversario" (`celebration` 18), padding 16 × 8, `label-md`, separación 8; `Campo suave` "Etiqueta" (Opcional, marcador "Ej. Aniversario de bodas"); rejilla de 3 columnas (separación 8, padding superior 4) con etiqueta `label-sm` encima: "Día" (numérico, centrado, `label-lg`, marcador "14"), "Mes" (campo centrado `body-md` con marcador "Mes" que abre una `HojaInferior` "Mes" con "Ene" … "Dic"; elegido muestra la abreviatura) y "Año (opc.)" (numérico, centrado, `label-lg`, marcador "1992"). Las fechas a partir de la segunda tienen arriba a la derecha un botón `close` 18 (`aria-label` "Quitar fecha"). Día/mes no válidos: mensaje bajo la rejilla (T1.2). Al final, botón "Añadir otra fecha" (alineado a la izquierda, margen superior 8, `secondary-fixed` 50 %, `on-secondary-fixed-variant`, padding 16 × 8, `label-md`, `add` 18, separación 6).
   - **Asignar a una casa**: icono `cottage` `tertiary`; ayuda "Vincúlala a un núcleo o espacio familiar preexistente en Memory."; chips con separación 10 (padding 16 × 10, `label-md`, separación 8): punto de 10 (rota `tertiary-fixed-dim`, `secondary-container`, `primary-fixed-dim`) + apodo; seleccionado `tertiary-fixed`/`on-tertiary-fixed-variant` con `check` 16 `tertiary`. Sin casas: "Aún no hay casas. Crea una desde Inicio." (`body-sm` `outline`). Crear con casas marcadas escribe `personas.json` y `casas.json` en una sola operación (RNF8). Al editar, desmarcar una casa donde es la única persona abre `DialogoConfirmacion` (RF7b).
4. Fila centrada (padding vertical 4, separación 8, `on-surface-variant`): `lock` 18 `tertiary` + "Información privada guardada en tu santuario personal" (`label-sm`).
5. Botones (columna, separación 8, padding superior 4): `primarioSuave` "Guardar persona" con `save` 20 (ancho completo; `aria-label` "Guardar") y `texto` "Cancelar y descartar" (padding vertical 12, `label-md`). Cancelar (aquí o arriba) con cambios sin guardar abre `DialogoConfirmacion` "¿Descartar los cambios?"; sin cambios, vuelve atrás.
6. Al guardar bien: vuelve a la ficha y muestra `AvisoEmergente` flotante con `favorite` "Persona guardada con éxito en Memory".

**Formulario de casa** (`/casa/nueva` y edición; referencia `a_adir_casa`). Título de cabecera "Nueva Casa" / "Editar Casa".
1. Banner (margen inferior 24): `Tarjeta` con fondo `primary-fixed` 30 %, padding 24, `shadow-sm` y `CirculoDifuso` de 112 `secondary-container` 20 % en (−16, −16) abajo a la derecha. Fila alineada arriba, separación 16: círculo de 40 `primary-container` 25 % con `shadow-sm` y `cottage` 22 `primary`; columna (separación 4) con "Nueva Casa" ("Editar Casa"; `headline-sm`, `tracking-tight`) y "Las casas agrupan a familiares y amigos para que recuerdes dónde viven y con quién comparten sus días." (`body-sm` `on-surface-variant`, `leading-relaxed`).
2. Bloques en columna con separación 24:
   - **Apodo** (separación 4): fila con padding lateral 4 y espacio entre: "Apodo del hogar" + asterisco `primary` 700 (`label-lg`, separación 6) y "Obligatorio" (`label-sm` `on-surface-variant`). `Campo blanco` con `roofing` 20 `on-surface-variant` y marcador "Ej. Casa del pueblo, Piso de Lucía...". Vacío al guardar: anillo `error` y "Escribe el apodo".
   - **¿Quiénes viven aquí?**: `Tarjeta` con fondo `surface-container-low`, padding 16, `shadow-sm`, separación 8. Cabecera con padding lateral 4 y espacio entre: columna con "¿Quiénes viven aquí?" + asterisco (`label-lg`) y "Selecciona al menos una persona conviviente." (`body-sm` `on-surface-variant`); a la derecha chip contador (`surface-container-high`, padding 10 × 4, `label-sm` 500): "0 seleccionados" en `on-surface-variant`, "1 seleccionado" / "N seleccionados" en `primary`. Debajo (margen 4) la lista de `FilaPersonaSeleccionable` (todas las personas, orden alfabético, separación 8). Debajo, centrado, botón "Añadir nueva persona" (`person_add` 18, `secondary`, `label-md`, padding 12 × 8, separación 6) que abre `/persona/nueva`; al volver, la persona nueva aparece en la lista y lo escrito se conserva. Sin selección, "Guardar casa" queda desactivado (opacidad 50 %) y bajo la lista se lee "Elige al menos una persona" (`label-sm` `error`) (R8). Sin personas en la app: en lugar de la lista, "Aún no hay personas. Añade una primero." (`body-sm` `outline`).
   - **Dirección compartida**: `Tarjeta` padding 16, `shadow-sm`, separación 8. Fila con padding lateral 4 (separación 8): `location_on` 20 `primary`, "Dirección compartida" (`label-lg`) y, a la derecha, "Opcional" (`label-sm` 400 `on-surface-variant`). Debajo (margen 4) `CamposDireccion pildora` con marcadores "Calle / Avenida", "Nº", "Portal", "Piso", "Puerta", "Código postal", "Ciudad / Pueblo" y área de 2 líneas "Detalles útiles (ej. timbre con música, plaza de garaje, código de portal...)".
   - **Botones** (columna, separación 10, padding superior 8): `primario` "Guardar casa" con `check` 20 (`aria-label` "Guardar") y `texto` "Cancelar" (alto 48, `label-lg`). Cancelar con cambios pide confirmación como en persona.
3. Al guardar bien: al crear abre el detalle de la casa nueva y al editar vuelve al detalle (decisión del usuario, 2026-11-09), y muestra `AvisoEmergente` flotante con `check` "Casa guardada".

**Detalle de casa** (`pantallas/Casa.tsx`, ruta `/casa/:id`, pila). No está en el prototipo; se compone con piezas de las otras pantallas. Título de cabecera "Detalle Casa". Bloques separados 24.
1. Banner del formulario de casa (mismo fondo, círculo difuso e icono) con el apodo (`headline-sm`, `tracking-tight`) y "N miembros" (`body-sm` `on-surface-variant`), y el botón de opciones de la ficha de persona arriba a la derecha; su hoja "Opciones de la casa" tiene "Editar información" y "Eliminar casa" (con `DialogoConfirmacion`).
2. Tarjeta de dirección igual a la de la ficha de persona, con "UBICACIÓN COMPARTIDA" y "Dirección compartida"; las notas se titulan "Detalles útiles".
3. Tarjeta "¿Quiénes viven aquí?" con la misma cabecera y fondo que en el formulario (sin asterisco; el contador dice "N miembros"): una fila blanca por miembro (como `FilaPersonaSeleccionable` sin círculo), pulsable → persona, con un chip "Quitar" a la derecha (`error-container` 40 %, texto `error`, `label-sm`, padding 10 × 4). Quitar al último miembro abre `DialogoConfirmacion` (RF7b: aceptar borra la casa, cancelar no cambia nada). Debajo, "Añadir persona" como "Añadir nueva persona" del formulario, que abre la edición de la casa.

**Ajustes** (`pantallas/Ajustes.tsx`, pestaña; referencia `ajustes_y_copia_de_seguridad`). Bloques separados 24.
1. Encabezado (padding superior 4, separación 4): fila con espacio entre: "Ajustes y Datos" (`headline-md`, `tracking-tight`) y chip "Guardado local" (`secondary-fixed`/`on-secondary-fixed`, padding 12 × 4, `label-sm`, `shadow-sm`, punto de 6 `secondary` que late, separación 6). Debajo "Personaliza tus recordatorios y gestiona la privacidad de tus recuerdos." (`body-md` `on-surface-variant`).
2. Tarjeta atmosférica: alto 144, fondo `surface-container-low`, `shadow-sm`, padding lateral 24, fila centrada con espacio entre. Izquierda (ancho máx. 62 %, separación 4): "TRANQUILIDAD DIARIA" (`label-md`, `primary`, mayúsculas, `tracking-wider`) y "Tus recuerdos no se apresuran. Configura momentos serenos para conectar con quienes más quieres." (`body-sm` `on-surface-variant`, `leading-relaxed`). Derecha: círculo de 96 con `shadow-sm`, degradado `primary-fixed` → `secondary-fixed` y `local_cafe` 40 `primary` (en lugar de la foto).
3. Tarjeta **Aviso de fechas** (`Tarjeta` padding 24, `shadow-sm`, separación 16):
   - Cabecera (fila, separación 16): círculo de 48 `secondary-fixed` con `shadow-sm` y `notifications_active` 24 `secondary`; columna con "Aviso de fechas" (`headline-sm`, interlínea ajustada) y "Notificaciones serenas y puntuales" (`label-sm` `on-surface-variant`).
   - "Recibirás un aviso el día anterior a cada cumpleaños o aniversario para que siempre tengas tiempo de celebrar." (`body-sm` `on-surface-variant`, `leading-relaxed`).
   - Bloque de hora (`surface-container-low`, radio 32, padding 16, separación 16): fila con espacio entre: `schedule` 20 `primary` + "Hora de notificación" (`label-lg`, separación 8) y la lectura en píldora (`primary-fixed`/`on-primary-fixed`, padding 12 × 6, `headline-sm` 600, `tracking-tight`, `shadow-sm`) con "09:00". Debajo, fila desplazable (separación 8, padding vertical 4) de chips "08:00", "09:00", "10:30", "20:00" (padding 14 × 6, `label-md`, blanco/`on-surface-variant` con `shadow-sm`; el que coincide con la hora, `primary-container`/`on-primary-container`). Debajo (padding superior 4, separación 6) fila con "Mañana temprano" y "Noche" en los extremos (`label-sm` `on-surface-variant`) y, bajo ella, el `<input type="range">` de 06:00 a 22:00 (minutos 360–1320, paso 30; pista de 8 `surface-container-highest`, tramo y botón `primary`).
   - Comportamiento: mover el deslizador cambia la lectura y el chip activo al instante; la hora se guarda (`AjustesService.cambiarHora`) al soltar o al pulsar un chip, no en cada paso. Si la hora guardada no es múltiplo de 30, la lectura muestra la hora exacta, el deslizador se coloca en el paso más cercano y no se guarda nada.
4. Tarjeta **Copia de seguridad local** (`Tarjeta` padding 24, `shadow-sm`, separación 16):
   - Cabecera como la anterior con círculo `primary-fixed` y `shield_lock` 24 `primary`, "Copia de seguridad local" y "Control absoluto de tus recuerdos".
   - Bloque `surface-container-low` (radio 32, padding 16, fila alineada arriba, separación 8): `verified_user` 20 `tertiary` (margen superior 2) + "Tus datos son 100% privados y se guardan solo en tu dispositivo. Puedes exportarlos a un archivo JSON o restaurarlos cuando quieras sin servidores externos." (`body-sm` `on-surface`, `leading-relaxed`).
   - Botones (columna, separación 8, padding superior 4; ancho completo, alto mínimo 50, padding lateral 24, `label-lg`, `shadow-sm`): `azulSuave` "Exportar datos (JSON)" con `ios_share` 20 y `lilaSuave` "Importar datos (JSON)" con `system_update_alt` 20 (`aria-label` "Exportar" e "Importar").
   - Línea de estado (padding 4 arriba y a los lados, espacio entre, `label-sm` `on-surface-variant`), visible solo después de exportar o importar en esta sesión: tras exportar, `check_circle` 16 `tertiary` + "Realizada hoy a las 18:30" y a la derecha chip con el tamaño del archivo exportado ("24 KB"; `surface-container`, padding 8 × 2; menos de 1 KB: "<1 KB"); tras importar, el resumen "Personas: N añadidas, M omitidas. Casas: …" (CU12) sin chip. No se guarda en ningún archivo (CU11 no modifica datos).
   - Tras la tarjeta, `AvisoEmergente` en línea: "Copia exportada en formato JSON" o "Datos importados correctamente". Los fallos usan `BannerError`.
5. Tarjeta de cita (`surface-container-high` 60 %, radio 32, padding 16, `shadow-sm`, fila separación 16): círculo blanco de 40 con `favorite` 20 `secondary` + "\"Recordar es volver a pasar por el corazón.\"" (`body-sm` cursiva `on-surface-variant`).
6. Pie (centrado, padding 4 arriba y 8 abajo, separación 4): "Memory v{versión de `package.json`} • Hecho para recordar lo importante" (`label-sm` `outline`) y fila (separación 8, `label-sm` `outline-variant`) "Privacidad local", "•", "Sin conexión".

Formatos de fecha: meses abreviados "Ene Feb Mar Abr May Jun Jul Ago Sep Oct Nov Dic"; meses completos y días de la semana con mayúscula inicial ("14 de Marzo", "Sábado"), como en el prototipo.

Signo zodiacal (`signoZodiacal(dia, mes)`, fronteras inclusivas): Capricornio 22 dic–19 ene; Acuario 20 ene–18 feb; Piscis 19 feb–20 mar; Aries 21 mar–19 abr; Tauro 20 abr–20 may; Géminis 21 may–20 jun; Cáncer 21 jun–22 jul; Leo 23 jul–22 ago; Virgo 23 ago–22 sep; Libra 23 sep–22 oct; Escorpio 23 oct–21 nov; Sagitario 22 nov–21 dic.


##### Desviaciones respecto al prototipo

Todo lo que no figura aquí se reproduce como en el prototipo.

| Prototipo | En la app | Motivo |
|---|---|---|
| Logotipo (imagen) y botón de perfil en la cabecera | Solo el texto "Memory" | El logotipo es una imagen remota rota en el propio prototipo; el perfil implica cuentas (R2) |
| Foto de contacto con botón de cámara (formulario), foto en "Próximo aviso" | Icono `face` que pasa a la inicial; avatar con inicial | El modelo no guarda imágenes (R9, R10) |
| Fotografía de la tarjeta "Tranquilidad diaria" | Círculo con degradado y `local_cafe` | Sin recursos de imagen; la app no usa red |
| Chip "Frecuente", barrio "Centro", "(Hermano)", "Hermana mayor"…, "Última actualización hace 3 días" | No existen; bajo el nombre en las filas de persona se muestra el apodo | El modelo no tiene esos campos |
| Estrella en el avatar de Ana (sin regla) | Estrella = fecha a 7 días o menos | Se le da una regla con los datos que hay |
| Punto verde junto al apodo de la casa (detalle de persona) | No existe | Sin significado en los datos |
| Plus Jakarta Sans en todo | Lora en el texto y Playfair Display en los títulos | Petición del usuario (2026-11-09): tipografía formal, menos sencilla |
| Barra de pestañas 8 sobre el margen seguro inferior; etiquetas `label-sm` | 24 sobre el margen seguro inferior; etiquetas de 16 px en negrita (`text-base font-bold`) | Petición del usuario (2026-11-09): barra más alta y texto del menú mayor |
| Tipo de fecha "Santo" | Solo "Cumpleaños" y "Aniversario" | RF3, R5 |
| Sin campo de etiqueta en las fechas | Campo "Etiqueta" opcional | Modelo de datos (RF3) |
| "Añadir otra fecha" muestra una nota y no añade | Añade otra fecha al formulario | Una persona puede tener varias fechas |
| "Compartir ficha de Ana" en las opciones | No existe | R10 |
| "Personas recientes" | "Personas", orden alfabético | No hay fecha de creación |
| Campo "Calle y número"; "Piso / Portal"; "Piso / Puerta" | Calle, Nº, Portal, Piso y Puerta separados | Modelo de datos (RF2) |
| Título "Detalle Persona" en el formulario de casa | "Nueva Casa" / "Editar Casa" | Error del prototipo |
| Chip "Sincronizado" | Chip "Guardado local" con el mismo aspecto | No hay sincronización (R7) |
| "Cifrado nativo" en el pie | "Sin conexión" | Los datos no se cifran |
| "Realizada el 10 Mar 2026 a las 18:30" | "Realizada hoy a las HH:MM" solo tras exportar en la sesión | Guardar la fecha modificaría el modelo (CU11) |
| "Memory sincroniza automáticamente aniversarios…" | "Memory te avisa el día anterior…" | No hay sincronización |
| Fuentes e iconos cargados desde Google Fonts y Tailwind desde su CDN | Fuente, iconos y CSS empaquetados en la app | La app funciona sin conexión (RNF2) y no llama a terceros (RNF4) |
| Etiquetas de los campos del formulario de persona en `label-sm` (nombre y apodo en `label-md`) | `label-lg` (14 px) en las etiquetas que quedan fuera del campo (nombre, apodo, tipo de conmemoración, etiqueta, día, mes y año), el mismo tamaño que la etiqueta "Apodo" del formulario de casa (`ETIQUETA_FORMULARIO` en `Campo.tsx`) | Petición del usuario (2026-11-09): etiquetas más grandes e iguales en los dos formularios |
| Dirección del formulario de persona con etiquetas encima, marcadores de ejemplo y `info` en las notas (`CamposDireccion suave`) | `CamposDireccion pildora`, como en el formulario de casa: el nombre de cada campo ("Calle", "Nº", "Portal", "Piso", "Puerta", "Código Postal", "Ciudad o Localidad", "Notas de llegada o acceso") va dentro del campo como marcador y nombre accesible | Petición del usuario (2026-11-09): mismo estilo que en casas |
| Iconos `auto_awesome`, `delete_outline`, `person_outline` y `tips_and_updates` | `star_shine`, `delete`, `person` y `lightbulb` | No están en la lista de nombres de `material-symbols` 0.48.3 (T9.2); en la fuente Outlined, `delete` y `person` ya son el contorno (Sprint 10) |
| Icono `done` del aviso "Casa guardada" | `check` | No está en la lista de nombres de `material-symbols` 0.48.3 (T9.2; Sprint 11) |
| Campos "Piso / Puerta" de la dirección compartida | Portal, Piso y Puerta separados, como en persona | Modelo de datos (RF2) |
| `<select>` de mes | Campo que abre una hoja con los meses | Control coherente con el resto de hojas |
| `min-height: max(884px, 100dvh)` del `body` | Alto de la pantalla del móvil | Esa altura fija es del lienzo de Stitch |
| Textos de ejemplo (Ana, Carlos, "En 4 días"…) | Datos reales de los JSON | Son datos de muestra |

Textos que el prototipo no tiene y añade la app (estados vacíos, errores, confirmaciones, detalle de casa) siguen el mismo tono y los estilos de piezas equivalentes.

##### Detalles fijados en el Sprint 9

- `utilidades/presentacion.ts`: `saludo(fecha)`, `colorAvatar(id)` (hash FNV-1a del `id` sobre `PALETA_AVATAR`; devuelve clases `{ fondo, texto }`), `iniciales`, `textoMiembros`, `signoZodiacal`, `edad`, `diasHasta`, `esCercana` (≤ 7 días), `etiquetaProximaFecha`, `fechaCorta` ("02 Jun"), `fechaLarga` ("14 de Marzo"), `fechaConDiaSemana` ("Sábado, 14 de Marzo") y `textoSeleccionados`.
- Cada pantalla pinta su `Cabecera` y su cuerpo con `componentes/Pantalla` (`tipo` `pestana` o `pila`: márgenes, hueco inferior y los banners `BannerError` y `BannerAviso` bajo la cabecera). En las pantallas de pila el título de la cabecera es el `h1` de la pantalla; en Inicio, "Memory" es el `h1` (prop `marcaComoTitulo`); en Calendario y Ajustes, "Memory" no es un título y el `h1` está en el cuerpo.
- El botón atrás de la cabecera es un `<button aria-label="Volver">`: vuelve a la pantalla anterior o, si la pantalla es la primera del historial, a Inicio. Durante la edición de una persona o casa, la cancela.
- Botón atrás de Android: `componentes/atras.ts` guarda una pila de cierres (`registrarCierre`, `cerrarUltimo`, `useCierreAtras`); `HojaInferior` y la edición de persona o casa se registran mientras están abiertas. `App.tsx` escucha `backButton` solo en Android: cierra lo último abierto; si no hay nada, en una pestaña raíz sale de la app (`App.exitApp`) y en otra pantalla vuelve atrás.
- `DialogoConfirmacion` tiene `role="alertdialog"` (es una `HojaInferior`) y nombre accesible `etiqueta` o el título. Las confirmaciones de borrar persona, borrar casa y quitar al último miembro ya lo usan.
- Arranque: `estado/arranque.ts` (`crearSplash`, `fuentesListas`). `ProveedorApp` espera `Repositorio.iniciar()` y las fuentes (`document.fonts.ready`, como máximo 3 s) antes de pintar las pantallas y después llama a `Splash.ocultar()` (que en web no hace nada). `externos` acepta también `splash` y `fuentes` para las pruebas. `main.tsx` pone en Android la barra de estado sobre la web (`setOverlaysWebView`) con iconos oscuros (`Style.Light`).
- `estilos.css` importa `material-symbols/outlined.css` (la fuente de iconos ocupa unos 4 MB en `dist/`) y define `icono-relleno`, `zona-tactil` (pseudo-elemento de 48 × 48), `fondo-cabecera` y `fondo-barra` (con el respaldo sin `backdrop-filter`) y las animaciones de entrada de hojas y avisos.

##### Detalles fijados en el Sprint 10

- **Bloques de fecha del formulario** (decisión del usuario, 2026-11-09): siempre hay al menos un bloque. Un bloque sin día, mes, año ni etiqueta no es una fecha y no se guarda. "Quitar fecha" (`close`) aparece desde la segunda fecha y, en la primera, solo cuando tiene datos; quitar el único bloque lo deja vacío. Un bloque con datos incompletos o imposibles (31/02, etiqueta sin día ni mes) muestra el mensaje de `validarFecha` bajo su rejilla (`role="alert"`) y no se guarda nada.
- **Mes**: botón con la etiqueta "Mes" que abre la `HojaInferior` "Mes" con 12 botones ("Ene"… "Dic", nombre accesible con el mes completo, `aria-pressed` el elegido).
- **Desmarcar una casa al editar** (decisión del usuario, 2026-11-09): si la persona es su único miembro, `DialogoConfirmacion` "¿Quitar de {apodo}?" (nombre accesible "Confirmar quitar de la casa"). Aceptar solo desmarca el chip; la casa se borra al pulsar "Guardar persona", en el mismo guardado que el resto de cambios (`PersonasService.editar(id, cambios, casasIds)`). Si se descartan los cambios, no se borra nada. Cancelar deja el chip marcado.
- **Cambios sin guardar**: el formulario compara lo escrito con los valores iniciales (los bloques de fecha vacíos no cuentan). "Cancelar" (arriba), "Cancelar y descartar", el botón atrás de la cabecera y el de Android abren "¿Descartar los cambios?" si hay cambios ("Descartar" sale sin guardar); sin cambios, vuelven directamente (a la pantalla anterior o, al editar, a la ficha).
- **Nombre vacío**: `Campo` marca la entrada (`aria-invalid`), muestra "Escribe el nombre" debajo (`role="alert"`, enlazado con `aria-describedby`) y le da el foco; al escribir, el error desaparece.
- **Aviso emergente**: `ProveedorApp` guarda `emergente` (texto e icono; no se escribe en ningún archivo) con `mostrarEmergente` y `limpiarEmergente`; `Pantalla` lo pinta con `AvisoEmergente`, así sigue visible tras cambiar de pantalla. Tras crear o editar una persona: "Persona guardada con éxito en Memory" con `favorite`.
- **Permiso de notificaciones**: `ProveedorApp` consulta `Notificador.permiso()` al cargar, sin retrasar el arranque, y lo actualiza tras cada sincronización ("programadas" → concedido; "sinPermiso" → denegado). La ficha muestra "Avisos desactivados (sin permiso)" solo con el permiso denegado. `BannerAviso` tiene el nombre accesible "Aviso de notificaciones", para distinguirlo del aviso emergente (los dos son `role="status"`).
- **Inicio**: cada tarjeta es un enlace con nombre accesible igual a su título (nombre y apodo, o apodo de la casa; `aria-labelledby`), con el nombre en un `h3`. Las secciones son regiones nombradas por su título ("Personas", "Casas y lugares"). Los filtros son botones con `aria-pressed` dentro del grupo "Filtros". El icono de cada casa (`villa` o `cabin`, con su color) sale de `hashTexto(id)`.
- **Ficha de persona**: el nombre es un `h2` (el `h1` es el título de la cabecera, "Detalle Persona"). Las tarjetas son regiones nombradas por su título ("Dirección particular", "Fechas memorables", "Casas a las que pertenece"). El botón de cada casa es un enlace "Abrir {apodo}"; cada conviviente, un enlace a su ficha. La edad es la de hoy con `edad`; sin año no se muestra.
- `utilidades/presentacion.ts` añade `hashTexto` (FNV-1a, también usado por `colorAvatar`), `contar` ("1 guardada" / "2 guardadas"), `nombreFecha` (etiqueta o tipo), `emojiFecha`, `proximaDe` (fecha más próxima y días que faltan), `textoChipFecha` ("Cumpleaños (02 Jun)", "En 4 días (14 Mar)"), `direccionCorta` ("Calle Alcalá 42, 3ºB"; sin calle, la ciudad) y `lineasDireccion` (las tres líneas de la ficha).
- Componentes: `Campo` acepta `asterisco`, `iconoEtiqueta`, `claseEtiqueta`, `claseRelleno` y `claseTexto` (sin clases de Tailwind en conflicto), y un área de texto lleva padding 16; `CamposDireccion` acepta `etiquetas`, `marcadores`, `leyenda`/`leyendaOculta`, `iconoNotas` y `lineasNotas`; `Avatar` acepta `claseTexto`; `CabeceraSeccion` y `CabeceraTarjeta` aceptan `id` (título) y pintan su icono relleno; el `check` del `ChipSeleccion` de casa es `tertiary`.

##### Detalles fijados en el Sprint 11

- **Tras crear una casa** (decisión del usuario, 2026-11-09): se abre su detalle (`/casa/:id`, como la ficha tras crear una persona); al editar, se vuelve al detalle. En los dos casos sale "Casa guardada".
- **"Añadir nueva persona"** (decisión del usuario, 2026-11-09): el formulario guarda lo escrito (apodo, dirección y selección) en un borrador de `ProveedorApp` (`guardarBorradorCasa`; solo en memoria, no se escribe en ningún archivo) y abre `/persona/nueva` con el estado de navegación `{ desdeCasa: true }`. Al guardar la persona, se marca en el borrador (`anadirPersonaABorrador`) y se vuelve atrás; al cancelarla, también se vuelve. La pantalla de casa recupera el borrador al montarse (también en edición: vuelve a la edición) y lo descarta, así que solo se usa una vez.
- **Formulario**: pinta la pantalla entera (cabecera incluida), como el de persona: "Cancelar", el botón atrás de la cabecera y el de Android abren "¿Descartar los cambios?" si hay cambios; sin cambios, vuelven a la pantalla anterior (al editar, al detalle). El apodo es un `Campo blanco` con etiqueta "Apodo del hogar", asterisco y rótulo "Obligatorio"; vacío al guardar: `aria-invalid`, "Escribe el apodo" (`role="alert"`) y foco. La lista es un grupo nombrado "¿Quiénes viven aquí?" de `FilaPersonaSeleccionable` (`role="checkbox"` con el nombre). Los campos de la dirección compartida tienen como nombre accesible su marcador ("Calle / Avenida", "Nº", "Portal", "Piso", "Puerta", "Código postal", "Ciudad / Pueblo", "Detalles útiles (…)"). "Guardar casa" tiene el nombre accesible "Guardar".
- **Detalle**: título de cabecera "Detalle Casa" (`h1`); el apodo es un `h2`. Botón "Opciones de la casa" en el banner; hoja "Opciones de la casa" con "Editar información" y "Eliminar casa" (`DialogoConfirmacion` "¿Eliminar {apodo}?", nombre accesible "Confirmar borrado", botón "Eliminar"). Regiones "Dirección compartida" y "¿Quiénes viven aquí?" (subtítulo "Personas que comparten esta casa."). Cada miembro es un enlace con su nombre a su ficha y un botón "Quitar a {nombre}". "Añadir persona" abre la edición de la casa.
- `componentes/TarjetaDireccion` es la tarjeta de dirección de la ficha de persona y del detalle de casa (sobretítulo, título y título de las notas por props).

##### Detalles fijados en el Sprint 12

- **Calendario**: el `h1` es "Próximas fechas" ("Memory" de la cabecera no es título). La tarjeta "Próximo aviso" es la región "Próximo aviso"; los meses van dentro de la región "Próximas fechas", cada uno como región nombrada por su título (`h3`) con una lista de filas (enlaces a la ficha). Los meses se agrupan por mes y año de la próxima ocurrencia (`agruparPorMes` en `utilidades/calendario.ts`); si un mes sale dos veces (el mes actual, con fechas que ya pasaron este año), el segundo lleva el año ("Marzo 2027"). La insignia muestra el día y mes de la próxima ocurrencia (un 29/02 en año no bisiesto sale como 1 de marzo, igual que `proximaFecha`). La edad de la fila son los años que se cumplen en esa fecha ("Cumpleaños (34 años)" cuatro días antes de cumplirlos), también en aniversarios. "Próximo aviso" usa la etiqueta de la fecha si la tiene ("Boda hoy • …") y el día de aviso de `diaAvisoAnual` (el que se programa de verdad, nunca el 29/02), no `fechaAviso`. La tarjeta final se muestra también sin fechas. El punto que late es `animate-pulse` de Tailwind (opacidad 1 ↔ 0,5, 2 s).
- **Ajustes**: el `h1` es "Ajustes y Datos". Tarjetas como regiones "Aviso de fechas" y "Copia de seguridad local". El bloque de hora es el grupo "Hora de notificación"; la lectura tiene el nombre accesible "Hora elegida"; los chips son botones con `aria-pressed`; el deslizador tiene el nombre accesible "Hora de aviso" y `aria-valuetext` con la hora. Mientras se arrastra (evento `input`) solo cambian la lectura y el chip activo; al soltar (evento nativo `change` del `range`, que también llega con cada tecla) se guarda con `AjustesService.cambiarHora`, y no se guarda si la hora es la que ya está guardada. Si guardar falla, la lectura y el deslizador vuelven a la hora guardada y se ve el banner de error. `pasoMasCercano` (`pantallas/Ajustes.tsx`) coloca el deslizador; `minutosDeHora`, `horaDeMinutos`, `textoTamano` ("<1 KB", KB de 1024 redondeados), `etiquetaDias` y `cuandoEnFrase` están en `utilidades/presentacion.ts`.
- **Línea de estado de la copia**: `ProveedorApp` guarda `copia` (`EstadoCopia`: exportada con hora y bytes, o importada con el resumen) con `anotarCopia`; solo en memoria, así que sigue al cambiar de pestaña y desaparece al reiniciar. Tras exportar: "Realizada hoy a las HH:MM" (nombre accesible "Última copia") y el tamaño de `memory-export.json` (`bytesExportacion` en `servicios/intercambioService.ts`, mismo texto que se comparte: `contenidoExportacion`). Tras importar: el resumen (nombre accesible "Resumen de importación"). El aviso en línea ("Copia exportada en formato JSON" / "Datos importados correctamente", icono `check`) es estado de la pantalla. Cerrar el menú de compartir sin elegir cuenta como exportación hecha (el plugin no distingue si se guardó).
- Los botones conservan los nombres accesibles "Exportar" e "Importar" con los textos "Exportar datos (JSON)" e "Importar datos (JSON)". La versión del pie se importa de `package.json` (`import { version }`; solo ese campo entra en el paquete).
- Pruebas: `testTimeout` de 20 s en `vite.config.ts`; las pruebas de pantallas con `user-event` tardan 2–3 s y en la primera ejecución en frío superaban los 5 s por defecto (fallos intermitentes por tiempo, no de comprobación).

##### Pruebas de interfaz

- Cada pantalla se prueba con Testing Library (Vitest + jsdom) sobre los mismos casos que los sprints 5 a 8; los textos visibles pueden cambiar, pero cada acción conserva su nombre accesible (`aria-label` o texto del botón: "Añadir persona", "Añadir casa", "Guardar", "Exportar", "Importar", etc.) y las pruebas la buscan por rol y nombre (`getByRole("button", { name: "Guardar" })`).
- `__tests__/tema.test.ts`: los colores, radios, espacios y tamaños de letra de `tailwind.config.ts` coinciden con el bloque `tailwind.config` de los `code.html` de `prototipo/` (se leen del archivo y se comparan).
- `__tests__/iconos.test.ts`: todos los nombres de icono usados existen en la lista del paquete `material-symbols`.
- Reglas derivadas con tests unitarios: saludo por hora, textos de fecha (hoy / mañana / en N días, ≤ 7 días), formatos de fecha, signo zodiacal, edad, texto de miembros de una casa, contador "seleccionado(s)", `colorAvatar` estable.
- jsdom no aplica CSS: las pruebas comprueban estructura, textos, estados (`aria-*`) y clases, no el aspecto. La fidelidad visual la comprueba el usuario comparando la vista previa web y el móvil con las capturas de `prototipo/`.

#### Estado y pantallas

- **Navegación**: `App.tsx` define las rutas con React Router (`createHashRouter`; en pruebas, `createMemoryRouter`). Las rutas `/`, `/calendario` y `/ajustes` muestran la barra de pestañas (Inicio, Calendario y Ajustes); `/persona/:id` y `/casa/:id` son pantallas de pila sin barra.
- `estado/contexto.tsx`: `ProveedorApp` carga los datos con `Repositorio.iniciar` (muestra "Cargando…" o, si un JSON está dañado, un error claro) y crea la `Tienda` y los servicios. `useReducer` guarda `{ fase, datos, error }`. `ejecutar(operacion)` llama a un servicio; solo si devuelve `ok` el reducer recibe los datos nuevos (`datos`); si falla, solo se guarda el `error` y los datos anteriores se mantienen. El error se muestra en un banner (`componentes/BannerError`) encima de las pantallas. El `Almacen` se puede inyectar (pruebas); por defecto `localStorage` en web y archivos en Android.
- `pantallas/Inicio.tsx` (desde el Sprint 10, según "Interfaz > Pantallas > Inicio"): saludo, buscador con "Limpiar búsqueda", "Añadir persona" y "Añadir casa", filtros con recuentos, secciones "Personas" y "Casas y lugares" (pulsar una tarjeta abre la ficha o la casa) y estados vacíos. El acceso a calendario y ajustes es por la barra de pestañas.
- `pantallas/Persona.tsx`: `id = "nueva"` muestra el formulario de creación; otro `id` muestra la ficha (dirección, fechas, casas con dirección y convivientes) con la hoja "Opciones de contacto" ("Editar información" y "Eliminar de contactos"). Eliminar pide confirmación y avisa de las casas que también se borrarán.
- `pantallas/Calendario.tsx`: lista las fechas de todas las personas por próxima ocurrencia (`utilidades/calendario.ts`, `entradasCalendario`; a igual día, por nombre) (CU5). Desde el Sprint 9, la barra de pestañas es `componentes/BarraPestanas` (`<nav aria-label="Pestañas">`), que `App.tsx` pinta solo en las rutas de pestaña. `pantallas/Ajustes.tsx`: hora de aviso (`HH:MM`, validada en `AjustesService.cambiarHora`, `servicios/ajustesService.ts`; desde el Sprint 12, chips y deslizador según "Interfaz > Pantallas > Ajustes"), "Exportar" e "Importar" con resumen (`Personas: N añadidas, M omitidas. Casas: …`).
- `ProveedorApp` acepta `externos` (`notificador`, `compartidor`, `selector`) para inyectar en pruebas lo que toca el sistema (el Sprint 7 añade `notificador`; el estado guarda además `aviso`, que muestra `BannerAviso`). Tras un guardado correcto que cambie `personas` o `ajustes`, llama a `NotificacionesService.sincronizar`; si el permiso está denegado, muestra un aviso una vez por sesión. `importarDesdeArchivo()` elige el archivo y llama a `IntercambioService.importar`.
- `pantallas/Casa.tsx`: `id = "nueva"` muestra el formulario de creación; otro `id` muestra el detalle (dirección y miembros) con la hoja "Opciones de la casa" ("Editar información" y "Eliminar casa", con confirmación) y "Quitar" por miembro (desde el Sprint 11, ver "Detalles fijados en el Sprint 11"). Quitar al último miembro muestra un diálogo (`requiere-confirmacion`); aceptar borra la casa, cancelar no cambia nada (RF7b). En el detalle de persona, cada casa abre su detalle.
- `componentes/FormularioCasa.tsx`: apodo (obligatorio), dirección (`CamposDireccion`, compartido con el formulario de persona) y selector de personas (varias); sin personas no guarda (R8). `CasasService.editar` acepta también `personas` para cambiar los miembros en un solo guardado.
- `componentes/FormularioPersona.tsx`: nombre (obligatorio), apodo, dirección, fechas (tipo, etiqueta, día, mes, año opcional) y casas a las que pertenece. Desde el Sprint 10 pinta la pantalla entera (cabecera incluida); ver "Detalles fijados en el Sprint 10".

#### Búsqueda

- Carga en memoria y filtro por coincidencia parcial.
- Se normaliza con `String.normalize("NFD")` quitando diacríticos y pasando a minúsculas (RNF3).
- Busca en todos los datos (RF4): de cada persona, nombre, apodo, todos los campos de dirección, notas, y tipo/etiqueta de sus fechas; de cada casa, apodo, dirección y nombres de sus miembros. Una persona también aparece si coincide el apodo o la dirección de una de sus casas (no los nombres de sus convivientes; para eso se busca la casa). Consulta vacía: devuelve todo.
- Construye para cada registro un texto único con todos esos campos normalizados y busca la consulta en él. Varias palabras en la consulta deben coincidir todas (en cualquier orden).
- Código: `utilidades/busqueda.ts` (`textoPersona`, `textoCasa`, `palabrasConsulta`, `coincide`); lo usan `PersonasService.buscar` y `CasasService.buscar`.

#### Exportar e importar

- Servicio: `IntercambioService(tienda, compartidor)` (`exportar`, `importar`). `Compartidor` (`CompartidorCapacitor` en `servicios/archivosExternos.ts`) escribe `memory-export.json` en la caché (`Directory.Cache` de `@capacitor/filesystem`) y lo comparte con `@capacitor/share` (menú de compartir/guardar del sistema); en web descarga el archivo con un enlace `download`. `SelectorArchivo` abre un `<input type="file" accept="application/json,.json">` y devuelve el texto del archivo elegido, o `null` si se cancela. La validación rechaza el archivo entero si falta `version` (debe ser 1), si `personas`/`casas` no son listas o si alguna persona o casa tiene estructura o datos no válidos.
- Paquetes: `@capacitor/share` (menú de compartir/guardar) y `@capacitor/filesystem` (archivo temporal). Elegir archivo no necesita paquete: el WebView de Capacitor abre el selector de archivos de Android.
- **Exportar (CU11)**: `intercambioService` genera `memory-export.json` (`version`, `exportadoEn`, `personas`, `casas`) y lo comparte. No modifica los datos.
- **Importar (CU12)**: valida el archivo (versión, estructura, validadores de modelos) y calcula en memoria el estado resultante: añade personas y casas que no existen; las existentes no se tocan. Persona duplicada: mismo `id` o mismo nombre normalizado. Casa duplicada: mismo `id` o mismo apodo normalizado. Antes de añadir casas, construye un mapa `idArchivo → idExistente` para las personas duplicadas y reescribe con él los miembros de las casas. Una casa solo se añade si todos sus miembros existen. Guarda `personas.json` y `casas.json` como una sola operación segura (ver Varios archivos). Devuelve el recuento de añadidos y omitidos.
- Detalles fijados en el Sprint 8 (`servicios/intercambioService.ts`: `IntercambioService`, `leerExportacion`, `textoResumen`; `servicios/archivosExternos.ts`: `Compartidor`, `CompartidorCapacitor`, `CompartidorWeb`, `SelectorArchivo`, `SelectorArchivoInput`, `crearCompartidor`):
  - Los duplicados se comprueban contra los datos de la app y contra lo ya añadido del mismo archivo (dos personas del archivo con el mismo nombre: se añade la primera y la segunda se omite y apunta a ella). Nombres y apodos se comparan sin espacios al principio ni al final, sin mayúsculas y sin acentos.
  - Si un miembro de una casa lleva, tras el mapa, a una persona que ya está en la lista, se deja una sola vez.
  - Se importan solo los campos del modelo; los campos de más del archivo se descartan.
  - Si no hay nada que añadir, no se escribe ningún archivo. Solo se escriben los archivos que cambian.
  - Cerrar el menú de compartir sin elegir (`Share canceled`) no es un error. Si no se puede escribir el archivo, se muestra "No se pudo crear el archivo de exportación".
  - `SelectorArchivoInput` detecta la cancelación con el evento `cancel` del `<input>`; `importarDesdeArchivo()` devuelve `null` si se cancela y no muestra nada.
  - En Ajustes, el resumen se muestra en un párrafo con `aria-label` "Resumen de importación" (desde el Sprint 12, en la línea de estado de la copia); los errores salen en el banner de error. Tras importar, las notificaciones se reprograman como tras cualquier guardado que cambie personas.

#### Notificaciones

- `NotificacionesService.sincronizar(personas, hora)` cancela todo y programa una notificación local por cada fecha: el día anterior a la hora de `ajustes.json`, repetida cada año (`schedule.on` con mes, día, hora y minuto, y `allowWhileIdle`). La frontera con el sistema es la interfaz `Notificador`: `NotificadorCapacitor` (`@capacitor/local-notifications`, canal `avisos`) en Android y `NotificadorNulo` en web (no hace nada). Los ids de notificación son números (lo exige el plugin): se derivan de forma estable de `personaId:índice` (FNV-1a de 32 bits, positivo; `idAviso`). Mes de `schedule.on`: en Android el plugin lo pasa tal cual a `Calendar.MONTH`, que empieza en 0 (enero = 0), así que `NotificadorCapacitor` envía `mes - 1`; lo fija un test del Sprint 7. Nunca lanza: un fallo de notificaciones no deshace un guardado (devuelve `"error"` y la app muestra un aviso). El texto lleva el nombre y el tipo de fecha: título "Mañana: cumpleaños de Ana", cuerpo "14 de marzo" (más la etiqueta entre paréntesis si la hay).
- Código: `servicios/notificador.ts` (`Notificador` con `permiso`, `pedirPermiso`, `cancelarTodas` y `programar(avisos)`; `NotificadorCapacitor`, que recibe el plugin por parámetro para las pruebas y crea el canal `avisos` la primera vez; `NotificadorNulo`; `crearNotificador()` elige con `Capacitor.isNativePlatform()`) y `servicios/notificacionesService.ts` (`NotificacionesService`, `avisosDe`, `idAviso`). `sincronizar` devuelve `"programadas"`, `"sinFechas"`, `"sinPermiso"` o `"error"`, y encadena las llamadas para que dos sincronizaciones seguidas no se mezclen. El día del aviso anual sale de `diaAvisoAnual` en `utilidades/calendario.ts`.
- Se reprograman todas tras cualquier cambio en fechas o personas, y al cambiar la hora (CU10).
- Se piden permisos de notificación solo cuando hay alguna fecha que avisar (la primera vez que se guarda una), como mucho una vez por sesión (Android puede volver a ofrecer el diálogo tras una negativa; no se insiste). Si se deniegan, no se programa nada y la app avisa una vez por sesión (`componentes/BannerAviso`, `role="status"`, separado del banner de error de guardado).
- Al arrancar no se sincroniza: las notificaciones programadas siguen en Android; solo se reprograman tras un guardado que cambie personas o ajustes.
- Un aviso anual no puede caer el 29/02: si el día de aviso es el 29/02 (celebración el 1 de marzo de un año bisiesto) se usa el 28/02. Una fecha 29 de febrero se avisa el 28 en años no bisiestos (en esos años se considera celebrada el 1 de marzo; el aviso es siempre el día anterior). `proximaFecha` incluye hoy.

#### Decisiones y límites

- Sin backend, cuenta ni red (R2, R3). Fuentes, iconos y CSS van empaquetados; la app no carga nada de Internet.
- Sin copia en la nube ni sincronización en la primera versión (R7).
- Ficheros JSON en lugar de SQLite por requisito del proyecto; el volumen esperado (cientos de registros) lo permite.
- Capacitor en lugar de React Native/Expo (cambio del 2026-11-08): Expo no compilaba en Windows sin activar las rutas largas del sistema y cambiar el ninja del SDK, porque su compilación C++ genera rutas de más de 260 caracteres. Capacitor no compila C++ y el proyecto Android se abre y se compila directamente en Android Studio. Además, el prototipo ya está en HTML con Tailwind.
