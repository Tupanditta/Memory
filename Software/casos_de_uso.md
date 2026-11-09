### Casos de uso

Actor único: el usuario.

#### CU1. Añadir persona
- Requisitos: RF1, RF2, RF3
- Flujo: el usuario introduce el nombre (obligatorio) y, opcionalmente, apodo, dirección y fechas. La app guarda la persona en `personas.json`.
- Alternativa: nombre vacío, la app no guarda y pide el nombre.

#### CU2. Editar o borrar persona
- Requisitos: RF1, RF2, RF3, RF7b
- Flujo: el usuario abre una persona y cambia sus datos, o la borra.
- Alternativa: si la persona es la única de una casa, la app avisa de que la casa también se borrará y pide confirmación.

#### CU3. Buscar persona
- Requisitos: RF4, RF7, RNF3
- Flujo: el usuario escribe un texto. La app lista las personas y casas cuyo cualquier dato coincide (nombre, apodo, dirección, notas, fechas, miembros de casas), sin distinguir mayúsculas ni acentos. Al elegir una persona, muestra todos sus datos: su dirección, fechas y todas sus casas con dirección y convivientes.
- Alternativa: sin resultados, la app lo indica.

#### CU4. Añadir fecha importante
- Requisitos: RF3
- Flujo: el usuario elige una persona, añade tipo (cumpleaños o aniversario), etiqueta, día, mes y año opcional. La app la guarda en la persona.

#### CU5. Ver calendario de fechas
- Requisitos: RF8
- Flujo: la app muestra solo cumpleaños y aniversarios, ordenados por próxima fecha.

#### CU6. Recibir notificación de fecha
- Requisitos: RF9, RF10, RNF5
- Flujo: el día anterior a una fecha, a la hora configurada, la app lanza una notificación local con el nombre y el tipo de fecha.

#### CU7. Crear casa
- Requisitos: RF5
- Flujo: el usuario pone un apodo, una dirección opcional y elige una o más personas. La app guarda la casa en `casas.json`.
- Alternativa: sin personas seleccionadas, la app no guarda (una casa no puede estar vacía).

#### CU8. Editar casa y sus miembros
- Requisitos: RF5, RF7b
- Flujo: el usuario cambia apodo o dirección, añade personas o las quita. Una persona puede estar en varias casas.
- Alternativa: al quitar a la última persona, la app avisa y pide borrar la casa.

#### CU9. Buscar casa
- Requisitos: RF6
- Flujo: el usuario escribe cualquier dato de la casa (apodo, dirección, nombre de un miembro). La app muestra la casa con su dirección y todas las personas que viven en ella.

#### CU10. Configurar hora de notificación
- Requisitos: RF10
- Flujo: el usuario elige la hora; se aplica a las notificaciones futuras.

#### CU11. Exportar datos
- Requisitos: RF11, RNF4
- Flujo: el usuario pulsa "Exportar". La app crea un archivo `memory-export.json` con todas las personas y casas y abre el menú de compartir/guardar del sistema.
- Alternativa: sin datos, la app exporta un archivo con listas vacías. Si falla la creación del archivo, muestra un error.

#### CU12. Importar datos
- Requisitos: RF12, R11, RNF8, RNF10
- Flujo: el usuario elige un archivo JSON. La app lo valida y añade a los datos existentes solo lo que no existe todavía (por `id`). No modifica ni borra nada existente. Al terminar, muestra cuántas personas y casas se añadieron y cuántas se omitieron.
- Alternativa: archivo inválido o de otra versión, la app lo rechaza y no cambia nada.
- Duplicados: una persona del archivo es duplicada si ya existe una con el mismo `id` o con el mismo nombre (sin distinguir mayúsculas ni acentos). Una casa es duplicada si ya existe una con el mismo `id` o el mismo apodo (normalizado). Los duplicados se omiten y la existente no se toca.
- Casas importadas: si un miembro es una persona duplicada, la casa pasa a apuntar a la persona existente. Se añaden solo si todos sus miembros existen (ya en la app o en el mismo archivo). Se omiten las casas sin miembros válidos.
- Limitación: dos personas distintas con el mismo nombre se tratan como la misma al importar. El usuario puede añadirlas a mano.
- La importación es una sola operación: se aplica entera o no se aplica nada.

#### Regla común a CU1, CU2, CU4, CU7, CU8, CU10 y CU12 (operaciones que modifican datos)
- Flujo: la app valida, escribe los JSON afectados y, solo si la escritura termina bien, actualiza la interfaz.
- Alternativa (fallo de escritura): la app descarta el cambio, mantiene los datos anteriores en pantalla y muestra un mensaje de error. Nunca se muestran datos que no estén guardados.
- Operaciones sobre varios archivos (p. ej. CU2 borrar persona que está en casas): se aplican completas o ninguna.

---

#### Modelo de datos

`personas.json`: lista de objetos
```json
{
  "id": "p1",
  "nombre": "Ana García",
  "apodo": "Anita",
  "direccion": { "calle": "", "numero": "", "portal": "", "piso": "", "puerta": "", "codigoPostal": "", "ciudad": "", "notas": "" },
  "fechas": [
    { "tipo": "cumpleaños", "etiqueta": "", "dia": 1, "mes": 1, "anio": 1990 }
  ]
}
```

`casas.json`: lista de objetos
```json
{
  "id": "c1",
  "apodo": "Casa de los abuelos",
  "direccion": { "calle": "", "numero": "", "portal": "", "piso": "", "puerta": "", "codigoPostal": "", "ciudad": "", "notas": "" },
  "personas": ["p1"]
}
```

`personas` en una casa contiene ids de `personas.json` (relación muchos a muchos, mínimo 1 id). `anio` es opcional.

`memory-export.json` (exportación):
```json
{ "version": 1, "exportadoEn": "2026-01-01T00:00:00.000Z", "personas": [], "casas": [] }
```
`personas` y `casas` tienen la misma estructura que los archivos de datos.
