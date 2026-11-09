### Tareas de implementación

Plan que sigue el agente de IA al implementar. Se basa en [design.md](design.md), [requisitos.md](requisitos.md), [restricciones.md](restricciones.md) y [casos_de_uso.md](casos_de_uso.md).

#### Reglas del agente

1. Los sprints se hacen en orden. No se empieza un sprint hasta que el anterior esté completo.
2. Un sprint está completo solo cuando **todos** sus tests de validación pasan. Si uno falla, el agente lo corrige y vuelve a ejecutar los tests del sprint. No se salta, no se elimina ni se debilita un test para que pase.
3. Antes de cerrar un sprint se ejecuta toda la suite acumulada (`npm test`), no solo los tests nuevos. Los de sprints anteriores también deben pasar.
4. Cada test indica el requisito (RF/RNF), caso de uso (CU) o restricción (R) que valida.
5. Si la implementación obliga a cambiar algo, el agente actualiza el archivo de `Software/` correspondiente en el mismo cambio (ver [README.md](../README.md)).
6. Al terminar un sprint, el agente marca sus casillas y su estado en este archivo, con el resultado de la ejecución de tests.
7. Si un test no se puede ejecutar o el agente duda del criterio, para y pregunta; no sigue.
8. Los sprints 9 a 12 rehacen la interfaz según el prototipo (ver "Interfaz" en [design.md](design.md)). Los textos visibles cambian, pero cada acción conserva su nombre accesible (`aria-label` o texto del botón). Un test de los sprints 5 a 8 que busque un texto visible se adapta para buscar por rol y nombre accesible o por el texto nuevo; su comprobación (qué se guarda, qué se muestra, qué error sale) no se cambia ni se debilita.
9. Los valores de la interfaz (colores, medidas, textos) salen de [design.md](design.md) y del prototipo en [prototipo/](prototipo/). Si el prototipo y una especificación se contradicen, manda la especificación y se anota en la tabla de desviaciones de design.md.

Estado de sprint: `pendiente` · `en curso` · `completo`.

---

#### Sprint 0. Proyecto base
Estado: completo

Tareas
- [x] Sustituir el proyecto Expo de `memory-app/` por un proyecto Vite + React + TypeScript en la misma carpeta. La raíz del repositorio solo puede tener `.gitignore`, `.gitattributes` y `README.md` (R12).
- [x] `.gitignore` y `.gitattributes` en la raíz (excluir `node_modules`, `dist`, `.gradle` y las carpetas `build` de Android).
- [x] Hacer un commit al cerrar cada sprint (el commit de las especificaciones ya existe).
- [x] Capacitor: `capacitor.config.ts` con `appId` `com.tupanditta.memory`, nombre "Memory" y `webDir` `dist`; añadir solo la plataforma Android (`npx cap add android`) y versionar `memory-app/android/`.
- [x] `minSdkVersion` 24 en `android/variables.gradle`.
- [x] Vista previa web con `npm run dev` (Vite) para usarla en VS Code.
- [x] Instalar los paquetes de [design.md](design.md) salvo `@capacitor/share` (Sprint 8): Capacitor y sus plugins, React, React Router, Tailwind 3, fuente, iconos, Vitest y Testing Library.
- [x] Tailwind 3 configurado con el bloque `tailwind.config` del prototipo en `tailwind.config.ts`.
- [x] Crear la estructura de carpetas de [design.md](design.md).
- [x] Fijar las versiones exactas en `package.json` y anotarlas en [design.md](design.md).
- [x] Definir los scripts `dev`, `test`, `typecheck`, `build`, `sync` y `android`.

Tests de validación
- [x] T0.1 `npm run typecheck` termina sin errores.
- [x] T0.2 `npm test` se ejecuta y pasa con un test de humo.
- [x] T0.3 La app arranca y muestra la pantalla inicial vacía (RNF6, texto en español).
- [x] T0.4 `npm run dev` sirve la pantalla inicial sin errores y es visible en el navegador de VS Code; `npm run build` genera `dist/`.
- [x] T0.5 La configuración tiene `appId` `com.tupanditta.memory`, `minSdkVersion` 24 y no incluye iOS (R1, R13, RNF11).
- [x] T0.6 `npm run sync` y `gradlew assembleDebug` en `android/` (lo mismo que compila Android Studio) terminan sin errores y generan el APK, sin permisos de administrador ni cambios en el sistema.

Resultado: `npm run typecheck` sin errores; `npm test` 2 archivos, 6 tests pasan (T0.2, T0.3, T0.5, `appId` y `webDir`). T0.4: `npm run dev` responde 200 y sirve `main.tsx`, `Inicio.tsx` y el CSS de Tailwind; `npm run build` genera `dist/`. Verificación visual en el navegador de VS Code: pendiente del usuario. T0.6: `npm run sync` copia la web y 5 plugins; `gradlew assembleDebug` con el JDK 21 de Android Studio termina con `BUILD SUCCESSFUL` desde la ruta normal del proyecto y genera `app-debug.apk` (4,4 MB), sin permisos de administrador. La instalación en el móvil desde Android Studio la prueba el usuario.

---

#### Sprint 1. Modelos y utilidades
Estado: completo

Tareas
- [x] Tipos `Persona`, `Casa`, `Fecha`, `Direccion`, `Ajustes` según el modelo de datos.
- [x] Validadores: persona (nombre obligatorio), fecha (día/mes válidos, año opcional), casa (≥ 1 persona).
- [x] `normalizarTexto`: minúsculas y sin acentos.
- [x] `proximaFecha`: próxima ocurrencia de día/mes desde una fecha dada.
- [x] `fechaAviso`: día anterior a la próxima ocurrencia.

Tests de validación
- [x] T1.1 Persona sin nombre o con nombre en blanco es inválida; solo con nombre es válida (RF1, RNF1).
- [x] T1.2 Fecha 31/02 es inválida; 29/02 es válida (RF3).
- [x] T1.3 Casa con lista de personas vacía es inválida; con una persona es válida (R8).
- [x] T1.4 `normalizarTexto("ÁNGEL Ñu")` devuelve `"angel nu"` (RNF3).
- [x] T1.5 `proximaFecha` devuelve este año si la fecha aún no pasó, y el siguiente si ya pasó.
- [x] T1.6 `fechaAviso` de un 1 de marzo es el 28 o 29 de febrero según el año.
- [x] T1.7 Cumpleaños 29/02 en año no bisiesto avisa el 28/02 (design.md).

Resultado: `npm run typecheck` sin errores; `npm test` 3 archivos, 13 tests pasan (6 del Sprint 0 y T1.1 a T1.7 en `modelos.test.ts`).

---

#### Sprint 2. Repositorio de JSON
Estado: completo

Tareas
- [x] Interfaz `Almacen` con dos implementaciones: archivos (Android, `@capacitor/filesystem`) y `localStorage` (solo vista previa web).
- [x] Cargar `personas.json`, `casas.json` y `ajustes.json`; crear con valor por defecto si no existen.
- [x] Guardar con archivo `.tmp` y renombrado.
- [x] Guardar varios archivos como una sola operación (escribir todos los `.tmp`, luego renombrar).
- [x] En el arranque, descartar `.tmp` huérfanos.
- [x] En la carga, quitar ids inexistentes de las casas y descartar casas vacías.
- [x] Los tests usan un sistema de archivos simulado (mock) en memoria.

Tests de validación
- [x] T2.1 Con archivos inexistentes, la carga devuelve `[]`, `[]` y ajustes por defecto, y los crea (RNF2).
- [x] T2.2 Guardar y volver a cargar devuelve los mismos datos (RNF7).
- [x] T2.3 Si falla la escritura de un `.tmp`, el archivo original no cambia y la operación devuelve error (RNF9).
- [x] T2.4 Si falla el renombrado del segundo archivo en una operación doble, ninguno de los dos queda modificado (RNF8).
- [x] T2.5 Un `.tmp` huérfano al arrancar se descarta y no afecta a los datos.
- [x] T2.6 Una casa con un id inexistente lo pierde al cargar; si queda vacía, se descarta (RNF10, R8).
- [x] T2.7 Un JSON corrupto produce un error claro y no sobrescribe el archivo.
- [x] T2.8 Las dos implementaciones de `Almacen` pasan los mismos tests T2.1 a T2.7.

Resultado: `npm run typecheck` sin errores; `npm test` 4 archivos, 38 tests pasan (13 de los sprints 0 y 1, y 25 en `repositorio.test.ts`: T2.1 a T2.7 con casos extra, ejecutados sobre `AlmacenArchivos` y `AlmacenLocalStorage` con almacenamiento simulado en memoria (T2.8), y la elección de `localStorage` en web). Se comprobó que T2.4 falla si se quita el deshacer.

---

#### Sprint 3. Servicio de personas
Estado: completo

Tareas
- [x] Crear, editar y borrar persona (CU1, CU2).
- [x] Añadir, editar y borrar fechas de una persona (CU4).
- [x] Borrar persona: quitarla de sus casas; si alguna queda vacía, se borra (junto en una sola operación).
- [x] Buscar por cualquier dato (CU3, RF4): nombre, apodo, dirección, notas, fechas, y apodo, dirección y miembros de sus casas.
- [x] Todas las operaciones validan antes de guardar y devuelven resultado `ok` o `error`.

Tests de validación
- [x] T3.1 Crear persona con solo nombre la guarda con un id único (CU1).
- [x] T3.2 Crear persona inválida no escribe en el JSON (RNF9).
- [x] T3.3 Editar cambia solo los campos indicados y se persiste (CU2).
- [x] T3.4 Añadir una fecha válida se guarda en la persona; una inválida se rechaza (CU4).
- [x] T3.5 Borrar una persona que está en dos casas la quita de ambas, en una sola operación (RNF8).
- [x] T3.6 Borrar la única persona de una casa borra también la casa (RF7b).
- [x] T3.7 Si el guardado falla, el servicio devuelve error y el estado no cambia (RNF9).
- [x] T3.8 Buscar `"jose"` encuentra `"José"` y `"JOSÉ"`; sin coincidencias devuelve lista vacía (RF4, RNF3).
- [x] T3.9 Buscar por calle, portal, ciudad, notas o etiqueta de fecha encuentra a la persona (RF4).
- [x] T3.10 Buscar por el apodo o la dirección de una casa encuentra a sus miembros (RF4).
- [x] T3.11 Con varias palabras (`"maria calle mayor"`), solo salen resultados que cumplen todas, en cualquier orden.

Resultado: `npm run typecheck` sin errores; `npm test` 5 archivos, 50 tests pasan (38 de los sprints 0 a 2 y 12 en `personas.test.ts`: T3.1 a T3.11, con T3.5 en dos casos: borrado en un solo `guardar` y fallo del segundo archivo sin cambios). Código nuevo: `servicios/tienda.ts`, `servicios/personasService.ts`, `utilidades/busqueda.ts` y `utilidades/id.ts`. `crear` con `casasIds` queda para el Sprint 10.

---

#### Sprint 4. Servicio de casas
Estado: completo

Tareas
- [x] Crear, editar y borrar casa (CU7, CU8).
- [x] Añadir y quitar personas de una casa; una persona puede estar en varias.
- [x] Rechazar casas sin personas o con ids inexistentes.
- [x] Quitar a la última persona: devolver una señal para pedir confirmación y borrar la casa solo si se confirma (RF7b).
- [x] Buscar casa por cualquier dato: apodo, dirección o nombre de un miembro (CU9, RF6).
- [x] Obtener las casas de una persona, con dirección y convivientes (RF7).

Tests de validación
- [x] T4.1 Crear casa con apodo y dos personas la guarda con los dos ids (RF5, CU7).
- [x] T4.2 Crear casa sin personas se rechaza y no escribe (R8, RNF9).
- [x] T4.3 Crear casa con un id de persona inexistente se rechaza (RNF10).
- [x] T4.4 La misma persona puede estar en dos casas distintas (RF5).
- [x] T4.5 Quitar a una persona de una casa con más miembros la deja con el resto.
- [x] T4.6 Quitar a la última persona devuelve la señal de confirmación y no modifica nada hasta confirmar (RF7b).
- [x] T4.7 Confirmar el borrado elimina la casa; cancelar la mantiene intacta.
- [x] T4.8 Buscar `"abuelos"` encuentra `"Casa de los abuelos"`; buscar el nombre de un miembro o la calle de la casa también la encuentra (RF6, CU9).
- [x] T4.9 `casasDePersona` devuelve todas sus casas con dirección y convivientes (RF7).

Resultado: `npm run typecheck` sin errores; `npm test` 6 archivos, 62 tests pasan (50 de los sprints 0 a 3 y 12 en `casas.test.ts`: T4.1 a T4.9, más editar, borrar y fallo de guardado al crear y quitar). Código nuevo: `servicios/casasService.ts`.

---

#### Sprint 5. Estado y pantallas de personas
Estado: completo

Tareas
- [x] Contexto y reducer que cargan datos al arrancar.
- [x] El estado solo se actualiza con resultado `ok` del servicio.
- [x] Pantalla de búsqueda (`pantallas/Inicio.tsx`) con lista de personas y casas.
- [x] Pantalla de detalle y formulario de persona, con fechas.
- [x] Mensaje de error visible cuando un guardado falla.
- [x] Textos en español.

Tests de validación
- [x] T5.1 Al arrancar, la UI muestra las personas del JSON (RNF7).
- [x] T5.2 Crear una persona desde el formulario la muestra en la lista y está en el JSON (CU1).
- [x] T5.3 Si el servicio devuelve error, la persona no aparece en la lista y se ve un mensaje de error (RNF9).
- [x] T5.4 Escribir en el buscador filtra la lista; ver una persona muestra todos sus datos: su dirección, fechas y todas sus casas con dirección y convivientes (CU3, RF7).
- [x] T5.5 Editar y borrar persona actualizan la lista y el JSON (CU2).
- [x] T5.6 Con el nombre vacío, el formulario no guarda y pide el nombre (CU1).

Resultado: `npm run typecheck` sin errores; `npm test` 7 archivos, 72 tests pasan (62 de los sprints 0 a 4 y 10 en `pantallasPersonas.test.tsx`: T5.1 a T5.6, más JSON dañado al arrancar (T5.1b), cancelar y fallo al borrar (T5.5) y fecha inválida en el formulario (T5.6b)); `npm run build` genera `dist/`. Código nuevo: `estado/contexto.tsx` (`ProveedorApp`, `reducer`, `useApp`, `ejecutar`), `componentes/BannerError.tsx`, `componentes/CamposDireccion.tsx`, `componentes/FormularioPersona.tsx` y `pantallas/Persona.tsx`; `App.tsx` envuelve las rutas con `ProveedorApp` y un marco con el banner de error. T0.3 espera con `findByRole` a que termine la carga de datos (la comprobación no cambia). Tras crear, la app abre el detalle de la persona nueva. El botón "Añadir casa" y la ruta `/casa/:id` quedan para el Sprint 6.

---

#### Sprint 6. Pantallas de casas
Estado: completo

Tareas
- [x] Formulario de casa con selector de personas (varias).
- [x] Detalle de casa con dirección y miembros.
- [x] Persona muestra todas sus casas.
- [x] Diálogo de confirmación al quitar al último miembro.

Tests de validación
- [x] T6.1 Crear una casa con personas desde la UI la guarda y la muestra (CU7).
- [x] T6.2 El formulario no permite guardar sin personas seleccionadas (R8).
- [x] T6.3 Buscar una casa por cualquiera de sus datos muestra dirección y todas las personas (CU9).
- [x] T6.4 Una persona en dos casas muestra ambas en su detalle (RF7).
- [x] T6.5 Quitar al último miembro muestra el diálogo; aceptar borra la casa, cancelar la deja igual (RF7b).
- [x] T6.6 Si el guardado falla, la casa no aparece en pantalla (RNF9).

Resultado: `npm run typecheck` sin errores; `npm test` 8 archivos, 82 tests pasan (72 de los sprints 0 a 5 y 10 en `pantallasCasas.test.tsx`: T6.1 a T6.6, más apodo vacío (T6.2b), quitar un miembro sin ser el último (T6.5b), editar y borrar casa (T6.5c) y fallo al borrar la casa desde el diálogo (T6.6b)); suite completa ejecutada 6 veces seguidas sin fallos; `npm run build` genera `dist/`. Código nuevo: `componentes/FormularioCasa.tsx` y `pantallas/Casa.tsx`; ruta `/casa/:id` en `App.tsx`; Inicio tiene "Añadir casa" y cada casa abre su detalle; en el detalle de persona cada casa abre su detalle. React Router pinta la navegación dentro de una transición, así que tras borrar la pantalla de detalle no muestra "no existe" mientras llega Inicio (no pinta nada), y T5.5 y T6.5 esperan con `findByRole` a que aparezca Inicio antes de comprobar la lista (la comprobación no cambia; antes T5.5 fallaba de forma intermitente al ejecutar toda la suite).

---

#### Sprint 7. Calendario, notificaciones y ajustes
Estado: pendiente

Tareas
- [ ] Pantalla de calendario con solo cumpleaños y aniversarios, por próxima fecha (CU5).
- [ ] `notificacionesService`: programar, cancelar y reprogramar todas las notificaciones.
- [ ] Reprogramar tras cambios en personas o fechas.
- [ ] Pantalla de ajustes para la hora de aviso (CU10), guardada en `ajustes.json`.
- [ ] Pedir permiso de notificaciones al guardar la primera fecha.
- [ ] Tests con el módulo de notificaciones simulado (mock).
- [ ] En la vista previa web, el servicio de notificaciones no hace nada y no falla.

Tests de validación
- [ ] T7.1 El calendario lista solo fechas, ordenadas por la más próxima (RF8).
- [ ] T7.2 Cada fecha tiene una notificación programada el día anterior a la hora de ajustes (RF9).
- [ ] T7.3 Borrar una persona o una fecha cancela sus notificaciones.
- [ ] T7.4 Editar una fecha reprograma su notificación sin duplicarla.
- [ ] T7.5 Cambiar la hora reprograma todas las notificaciones con la nueva hora (RF10, CU10).
- [ ] T7.6 Si se deniega el permiso, la app sigue funcionando y avisa al usuario.
- [ ] T7.7 La hora de ajustes se guarda en `ajustes.json` y se conserva al reabrir (RNF7).

---

#### Sprint 8. Exportar e importar
Estado: pendiente

Tareas
- [ ] Instalar `@capacitor/share` (versión en [design.md](design.md)); elegir el archivo con `<input type="file">`.
- [ ] `intercambioService.exportar`: genera `memory-export.json` con `version`, `exportadoEn`, `personas` y `casas`, y lo comparte con `@capacitor/share`.
- [ ] `intercambioService.importar`: valida el archivo y añade solo lo que no existe por `id`, sin modificar ni borrar datos existentes.
- [ ] Una casa importada se añade solo si todos sus miembros existen (ya en la app o en el mismo archivo).
- [ ] Guardar el resultado como una sola operación segura de varios archivos.
- [ ] Botones "Exportar" e "Importar" en `pantallas/Ajustes.tsx`, con resumen de añadidos y omitidos.

Tests de validación
- [ ] T8.1 Exportar produce un JSON con `version`, `personas` y `casas` iguales a los datos actuales (RF11, CU11).
- [ ] T8.2 Exportar sin datos produce listas vacías y no falla.
- [ ] T8.3 Exportar y luego importar en una app vacía reproduce exactamente los mismos datos (RF12).
- [ ] T8.4 Importar el mismo archivo dos veces no duplica nada: la segunda vez todo se omite (R11).
- [ ] T8.5 Importar nunca modifica una persona o casa existente con el mismo `id`, aunque el archivo tenga otros valores (R11).
- [ ] T8.5b Una persona del archivo con distinto `id` pero el mismo nombre (sin mayúsculas ni acentos) que una existente se omite y no se duplica (RF12).
- [ ] T8.5c Una casa del archivo con distinto `id` pero el mismo apodo que una existente se omite.
- [ ] T8.5d Una casa nueva cuyo miembro es una persona duplicada se importa apuntando a la persona existente.
- [ ] T8.6 Importar añade las personas nuevas y conserva las existentes (RF12).
- [ ] T8.7 Una casa del archivo con un miembro inexistente en la app y en el archivo se omite; las demás se importan (RNF10).
- [ ] T8.8 Un archivo inválido, sin `version` o con estructura incorrecta se rechaza y no cambia ningún dato.
- [ ] T8.9 Si falla el guardado durante la importación, no se añade nada (RNF8, RNF9).
- [ ] T8.10 El resumen muestra cuántas personas y casas se añadieron y cuántas se omitieron (CU12).

---

#### Sprint 9. Base visual
Estado: pendiente

Rehace la capa visual según el prototipo ([design.md](design.md), sección "Interfaz"). No cambia datos, servicios ni repositorio.

Tareas
- [ ] Comprobar el punto de partida: existe `memory-app/`, `npm install` termina bien y `npm test` y `npm run typecheck` pasan con la suite de los sprints 0 a 8. Si `memory-app/` no existe o la suite falla, parar y preguntar.
- [ ] `tailwind.config.ts` con todos los tokens de design.md (colores, tipografía, espacios, radios y sombras con nombre).
- [ ] Cargar Plus Jakarta Sans y Material Symbols desde sus paquetes (`estilos.css`) y mantener el splash (`@capacitor/splash-screen`, fondo `#FAF8FF`) hasta tener fuentes y datos; iconos oscuros en la barra de estado y borde a borde con márgenes seguros.
- [ ] `utilidades/presentacion.ts`: `saludo(hora)`, `colorAvatar(id)`, `textoMiembros(nombres)`, `signoZodiacal(dia, mes)`, `edad(fecha, hoy)`, `diasHasta(fecha, hoy)` y `etiquetaProximaFecha(fecha, hoy)` ("En 4 días", "Hoy", "Mañana").
- [ ] Componentes de design.md: `Cabecera`, `BarraPestanas` (en las rutas de pestaña), `Tarjeta`, `Boton`, `Chip`, `Avatar`, `FilaAvatares`, `CabeceraSeccion`, `CabeceraTarjeta`, `CirculoDifuso`, `Campo`, `CamposDireccion`, `ChipSeleccion`, `FilaPersonaSeleccionable`, `HojaInferior`, `DialogoConfirmacion`, `BannerError`, `AvisoEmergente`, `EstadoVacio`, `Icono`.
- [ ] Efecto de escala al pulsar (`active:scale-*`, 150 ms) y zona táctil mínima de 48 px; el botón atrás de Android (`@capacitor/app`) cierra hojas y diálogos y vuelve atrás.
- [ ] Sustituir los componentes básicos de los sprints 5 a 8 (`componentes/ui.tsx`) por los nuevos; las pantallas existentes siguen funcionando con ellos (sin cambiar su contenido todavía).

Tests de validación
- [ ] T9.0 La suite de los sprints 0 a 8 sigue pasando completa con los componentes nuevos (adaptando solo las búsquedas de texto, regla 8).
- [ ] T9.1 Los colores, radios, espacios y tipografía de `tailwind.config.ts` coinciden con el bloque `tailwind.config` de los `code.html` de `prototipo/`.
- [ ] T9.2 Todos los nombres de icono usados existen en la lista del paquete `material-symbols`.
- [ ] T9.3 `saludo`: 06:00 y 11:59 dan "Buenos días"; 12:00 y 20:59 "Buenas tardes"; 21:00 y 05:59 "Buenas noches".
- [ ] T9.4 `colorAvatar` devuelve siempre el mismo color para el mismo `id` y una de las cinco parejas fondo/texto de la paleta de design.md.
- [ ] T9.5 `textoMiembros`: con 1 o 2 nombres los muestra completos separados por coma; con 3 o más, los nombres de pila de los dos primeros y "y N más".
- [ ] T9.6 `signoZodiacal` (tabla de design.md): 19/02 y 20/03 son Piscis, 21/03 y 19/04 Aries, 20/04 Tauro, 18/02 Acuario, 29/02 Piscis y 31/12 Capricornio.
- [ ] T9.7 `edad`: con año calcula los años cumplidos hoy (antes y después del cumpleaños del año); sin año devuelve `null`.
- [ ] T9.8 `etiquetaProximaFecha`: hoy da "Hoy", mañana "Mañana", cinco días "En 5 días"; `diasHasta` ≤ 7 se marca como cercana y 8 no. Formatos: "02 Jun", "14 de Marzo", "Sábado, 14 de Marzo"; contador "0 seleccionados", "1 seleccionado", "3 seleccionados".
- [ ] T9.9 `BarraPestanas` muestra Inicio, Calendario y Ajustes, marca la activa y navega al pulsar otra.
- [ ] T9.10 `HojaInferior` se abre y se cierra al pulsar fuera; `DialogoConfirmacion` llama a confirmar o a cancelar según el botón y a nada más.
- [ ] T9.11 `Campo` muestra el mensaje de error y el rótulo "Obligatorio"/"Opcional"; `ChipSeleccion` alterna su estado y es accesible (`aria-pressed`).
- [ ] T9.12 Mientras las fuentes o los datos no están cargados, la raíz no renderiza las pantallas y no oculta el splash (`SplashScreen.hide` no se llama); al cargar, sí.
- [ ] T9.13 `npm run typecheck` y `npm test` pasan completos.

---

#### Sprint 10. Inicio y personas
Estado: pendiente

Tareas
- [ ] Inicio (`pantallas/Inicio.tsx`) según design.md: saludo, buscador con botón de limpiar, acciones "Persona" y "Casa", filtros con recuentos, secciones "Personas" y "Casas y lugares", tarjetas, estados vacíos. La búsqueda sigue usando `PersonasService.buscar` y `CasasService.buscar`.
- [ ] Detalle de persona: cabecera de perfil con hoja de opciones (editar, borrar), tarjetas Dirección, Fechas memorables y Casas, pie.
- [ ] Formulario de persona: identidad, dirección, fechas (tipo, etiqueta, día, mes en hoja, año opcional, varias), asignar a casas, aviso de privacidad, guardar y cancelar con confirmación si hay cambios.
- [ ] `PersonasService.crear(datos, casasIds?)`: añade la persona a las casas indicadas en el mismo `guardar`; rechaza ids de casa inexistentes.
- [ ] Todas las confirmaciones con `DialogoConfirmacion`; ningún `window.confirm`.

Tests de validación
- [ ] T10.1 Los chips `Todos (N)`, `Personas (n)`, `Casas (m)` muestran los recuentos del resultado de la búsqueda y filtran las secciones; una sección sin elementos se oculta (CU3).
- [ ] T10.2 La tarjeta de persona muestra nombre, apodo, dirección en una línea, chip de su próxima fecha y un chip por casa; con una fecha a 7 días o menos el chip es de tono peligro y el avatar es destacado.
- [ ] T10.3 La tarjeta de casa muestra apodo, "N miembros", dirección y los nombres de los miembros según `textoMiembros` (CU9).
- [ ] T10.4 Una búsqueda sin resultados muestra "Sin coincidencias"; con la app vacía, "Todavía no hay nada guardado" (CU3).
- [ ] T10.5 El detalle de persona muestra dirección (partes vacías omitidas), notas, fechas con edad y signo (solo cumpleaños), la hora de aviso y todas sus casas con dirección y convivientes; sin datos, los textos "Sin dirección guardada", "Sin fechas guardadas" y "No pertenece a ninguna casa" (RF7).
- [ ] T10.6 Con el permiso de notificaciones denegado, el detalle muestra "Avisos desactivados (sin permiso)" (T7.6).
- [ ] T10.7 Formulario con nombre vacío: no guarda, muestra "Escribe el nombre" bajo el campo y no escribe en el JSON (CU1, RNF1).
- [ ] T10.8 Una fecha 31/02 muestra el error bajo la fila y no guarda (RF3); se pueden añadir y quitar varias fechas.
- [ ] T10.9 Crear una persona con dos casas marcadas la guarda y la añade a ambas casas en una sola operación; si el guardado falla, no cambia ningún archivo ni la pantalla (RNF8, RNF9).
- [ ] T10.10 `PersonasService.crear` con un id de casa inexistente se rechaza y no escribe (RNF10).
- [ ] T10.11 Al editar, desmarcar una casa donde la persona es la única pide confirmación; aceptar borra la casa, cancelar la deja igual (RF7b).
- [ ] T10.12 Borrar desde la hoja de opciones avisa de las casas que se borrarán con ella; aceptar borra en una sola operación; cancelar no cambia nada (CU2, RNF8).
- [ ] T10.13 "Cancelar" con cambios sin guardar pide confirmación; sin cambios vuelve directamente.
- [ ] T10.14 Los tests T5.1 a T5.6 siguen pasando (regla 8) y la suite acumulada pasa completa.

---

#### Sprint 11. Casas
Estado: pendiente

Tareas
- [ ] Formulario de casa: tarjeta de bienvenida, apodo, selector de personas con contador, "Añadir nueva persona", dirección compartida en forma de píldora, guardar y cancelar.
- [ ] Detalle de casa (no está en el prototipo, ver design.md): cabecera, dirección y miembros con "Quitar".
- [ ] "Añadir nueva persona" abre el formulario de persona y, al volver, la persona nueva aparece en la lista sin perder el apodo, la dirección ni la selección.

Tests de validación
- [ ] T11.1 El contador ("0 seleccionados", "1 seleccionado", "N seleccionados") y el estado de cada fila (marcada en `primary`) reflejan la selección; sin ninguna, "Guardar casa" queda desactivado y se lee "Elige al menos una persona" (R8).
- [ ] T11.2 Crear una casa con apodo, dirección y dos personas la guarda y la muestra en Inicio (CU7).
- [ ] T11.3 Tras "Añadir nueva persona" y guardarla, vuelve al formulario con la persona en la lista y lo escrito intacto.
- [ ] T11.4 El detalle de casa muestra dirección y todos los miembros, y cada miembro abre su ficha (CU9, RF6).
- [ ] T11.5 "Quitar" al último miembro muestra el diálogo; aceptar borra la casa, cancelar la deja igual (RF7b).
- [ ] T11.6 Si el guardado falla, la casa no aparece y se ve el banner de error (RNF9).
- [ ] T11.7 Los tests T6.1 a T6.6 siguen pasando (regla 8) y la suite acumulada pasa completa.

---

#### Sprint 12. Calendario y ajustes
Estado: pendiente

Tareas
- [ ] Calendario según design.md: encabezado, tarjeta "Próximo aviso", meses con recuento, filas de fecha, tarjeta final, estado vacío. Usa `entradasCalendario`.
- [ ] Ajustes: tarjeta atmosférica, aviso de fechas (lectura, chips 08:00/09:00/10:30/20:00, deslizador de 06:00 a 22:00 en pasos de 30), copia de seguridad (exportar, importar), cita y pie con la versión de `package.json`.
- [ ] Resultado efímero de exportar e importar (no se guarda) y `AvisoEmergente`.

Tests de validación
- [ ] T12.1 "Próximo aviso" muestra la primera fecha: nombre, "Cumpleaños en 4 días • Sábado, 14 de Marzo" y "09:00 h el día anterior (13 Mar)" con la hora de ajustes (RF8, RF9).
- [ ] T12.2 Las fechas se agrupan por mes de la próxima ocurrencia con "1 momento" / "N momentos", ordenadas por próxima fecha (RF8).
- [ ] T12.3 Cada fila muestra insignia de mes y día, tipo o etiqueta, edad si hay año, y chip con "En N días", "Hoy" o "Mañana"; el color distingue cumpleaños y aniversario (R5).
- [ ] T12.4 Sin fechas se muestra "Aún no hay fechas guardadas" y no hay tarjeta de próximo aviso.
- [ ] T12.5 El deslizador cubre 06:00–22:00 en pasos de 30; moverlo cambia la lectura al instante y guarda una sola vez al soltar (CU10, RNF7).
- [ ] T12.6 Pulsar un chip de hora la guarda, mueve el deslizador y reprograma las notificaciones (RF10, T7.5).
- [ ] T12.7 Con una hora guardada que no es múltiplo de 30 (p. ej. 09:15), la lectura muestra 09:15 y no se guarda nada al abrir la pantalla.
- [ ] T12.8 Antes de exportar o importar no hay línea de estado. Tras exportar se lee "Realizada hoy a las HH:MM" con el tamaño del archivo ("24 KB" o "<1 KB") y el aviso "Copia exportada en formato JSON"; tras importar, el resumen "Personas: N añadidas, M omitidas. Casas: …" y "Datos importados correctamente" (CU11, CU12). Nada de esto se escribe en los JSON y desaparece al reiniciar la app.
- [ ] T12.9 Si exportar o importar falla, se ve el banner de error y los datos no cambian (RNF9, RNF8).
- [ ] T12.10 Los tests T7.1 a T7.7 y T8.1 a T8.10 siguen pasando (regla 8) y la suite acumulada pasa completa.

---

#### Sprint 13. Cierre
Estado: pendiente (las pruebas manuales en dispositivo, T13.3 a T13.8, las hace el usuario cuando terminen los sprints 9 a 12)

Tareas
- [ ] Revisar que cada requisito, restricción y caso de uso está cubierto por al menos un test (tabla de trazabilidad abajo, ampliada con los sprints 9 a 12). Hecho una vez antes del rediseño; hay que repetirlo.
- [ ] Prueba manual en dispositivo o emulador de los casos de uso CU1 a CU12.
- [ ] Comparar cada pantalla con su captura de [prototipo/](prototipo/) (ver T13.8).
- [ ] Reconciliar [Software/](.) con el código final (design.md con versiones y desviaciones, README y JSON de ejemplo; los JSON de ejemplo se validan en `cierre.test.ts`).
- [x] Completar el README con instrucciones de instalación y ejecución.

Tests de validación
- [ ] T13.1 `npm run typecheck` y `npm test` pasan completos (anotar aquí el resultado).
- [ ] T13.2 Tabla de trazabilidad en este archivo: cada RF, RNF y R figura con al menos un test que pasa (abajo).
- [ ] T13.3 Recorrido manual de CU1 a CU12 sin errores, anotado en este archivo. Pendiente del usuario.
- [ ] T13.4 Con la app cerrada, una notificación de prueba programada llega (RNF5). Pendiente del usuario, en móvil.
- [ ] T13.5 Sin conexión de red, todas las funciones siguen operativas (RNF2), incluida la carga de la fuente. Pendiente del usuario (los tests de `cierre.test.ts` comprueban que el código no usa red).
- [ ] T13.6 Android Studio (o `gradlew assembleDebug` tras `npm run sync`) compila e instala la app en el emulador o en el móvil sin errores.
- [ ] T13.7 La app queda instalada y funcional en un móvil real con Android 7.0 o superior (RNF11); lo comprueba el usuario.
- [ ] T13.8 Las seis pantallas (Inicio, Calendario, Detalle de persona, Formulario de persona, Formulario de casa, Ajustes) se parecen a sus capturas de `prototipo/` en estructura, colores, tipografía y espacios; las diferencias están en la tabla de desviaciones de design.md. Lo comprueba el usuario en el móvil y en la vista previa web.


Trazabilidad (test que pasa por requisito; los tests están en `memory-app/__tests__/`; `cierre` = `cierre.test.ts`)

| Req. | Tests |
|---|---|
| RF1 | T1.1, T3.1, T3.3, T5.2, T5.5 |
| RF2 | T3.9, T5.4 |
| RF3 | T1.2, T3.4 |
| RF4 | T3.8, T3.9, T3.10, T3.11, T5.4 |
| RF5 | T4.1, T4.4, T6.1 |
| RF6 | T4.8, T6.3 |
| RF7 | T4.9, T5.4, T6.4 |
| RF7b | T3.6, T4.6, T4.7, T6.5 |
| RF8 | T7.1 |
| RF9 | T7.2 |
| RF10 | T7.5 |
| RF11 | T8.1 |
| RF12 | T8.3, T8.4, T8.5, T8.5b, T8.5c, T8.5d, T8.6 |
| RNF1 | T1.1, T5.6, T10.7 |
| RNF2 | T2.1, cierre (sin red); manual T13.5 |
| RNF3 | T1.4, T3.8 |
| RNF4 | cierre (sin red ni servicios) |
| RNF5 | T7.2 (programación); manual T13.4 |
| RNF6 | T0.3 |
| RNF7 | T2.2, T5.1, T7.7 |
| RNF8 | T2.4, T3.5, T8.9, T10.9, T10.12 |
| RNF9 | T2.3, T3.7, T5.3, T6.6, T8.9, T10.9, T11.6, T12.9 |
| RNF10 | T2.6, T4.3, T8.7, T10.10 |
| RNF11 | T0.5; manual T13.7 |
| R1 | T0.5 |
| R2, R3 | cierre (sin backend, cuentas ni red) |
| R4 | cierre (sin push), T7.2 |
| R5 | T7.1, cierre |
| R6, R10 | cierre (sin mapas ni funciones extra) |
| R7 | cierre (sin nube), T8.1 |
| R8 | T1.3, T4.2, T6.2, T11.1 |
| R9 | T2.2, cierre (solo `personas.json`, `casas.json`, `ajustes.json`) |
| R11 | T8.4, T8.5 |
| R12 | cierre |
| R13 | T0.5 |
| Interfaz (design.md) | T9.1 a T9.12 (tokens, iconos, reglas de presentación, componentes), T10.1 a T10.6 (Inicio y detalle de persona), T11.4 (detalle de casa), T12.1 a T12.8 (calendario y ajustes); fidelidad visual: manual T13.8 |
| RF3, RF5, RF7, RF7b, RF8, RF10 (pantallas nuevas) | T10.5, T10.8, T10.11, T11.2, T11.5, T12.1 a T12.6 |

RNF2, RNF5 y RNF11 solo quedan cubiertos del todo con las pruebas manuales T13.5, T13.4 y T13.7.
