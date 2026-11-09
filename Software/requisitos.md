### Requisitos

#### Funcionales
- RF1. Crear, editar y borrar personas con nombre y apodo opcional.
- RF2. Guardar dirección de cada persona: calle, número, portal, piso, puerta, código postal, ciudad y notas.
- RF3. Guardar fechas importantes de cada persona: cumpleaños y aniversarios (con etiqueta y año opcional).
- RF4. Buscar por texto y mostrar toda la información guardada. La búsqueda recorre todos los datos: nombre, apodo, dirección y notas de personas, etiquetas y tipos de fechas, y apodo, dirección y miembros de las casas.
- RF5. Crear "casas" o grupos con un apodo (p. ej. "Casa de los abuelos") y asociarles una o más personas. Una persona puede pertenecer a varias casas.
- RF6. Buscar una casa por cualquiera de sus datos (RF4) y ver su dirección y las personas que viven en ella.
- RF7. Al mostrar una persona, se muestran todos sus datos: su propia dirección (si la tiene), todas las casas a las que pertenece con su dirección, y el resto de convivientes.
- RF7b. Al quitar a la última persona de una casa, avisar y pedir borrar la casa (no puede quedar vacía).
- RF8. Vista de calendario o lista que muestre solo cumpleaños y aniversarios, ordenados por próxima fecha.
- RF9. Notificación local el día anterior a cada cumpleaños o aniversario.
- RF10. Permitir configurar la hora de la notificación.
- RF11. Exportar todas las personas y casas a un archivo JSON que el usuario pueda guardar o compartir.
- RF12. Importar un archivo JSON exportado. La importación solo añade datos: nunca modifica ni borra los existentes, y no crea duplicados (misma persona por `id` o por nombre; misma casa por `id` o por apodo).

#### No funcionales
- RNF1. App móvil simple: añadir una persona en pocos pasos y con pocos campos obligatorios (solo el nombre).
- RNF2. Funciona sin conexión; los datos se guardan en el dispositivo.
- RNF3. Búsqueda rápida y tolerante a mayúsculas y acentos.
- RNF4. Los datos son privados: no se envían a terceros. Solo salen del dispositivo cuando el usuario exporta.
- RNF5. Las notificaciones siguen funcionando con la app cerrada.
- RNF6. Interfaz en español.
- RNF7. Persistencia: toda creación, modificación o borrado se guarda en `personas.json` y/o `casas.json` y sobrevive al cerrar la app.
- RNF8. Atomicidad: una operación que afecta a varios archivos (p. ej. borrar una persona y quitarla de sus casas, o importar) se aplica completa o no se aplica.
- RNF9. Fiabilidad de la interfaz: la UI solo muestra datos confirmados como guardados. Si el guardado falla, no se muestra el cambio, se conserva el estado anterior y se informa del error al usuario.
- RNF10. Integridad: los ids de `casas.json` apuntan siempre a personas existentes en `personas.json`.
- RNF11. Compatibilidad: funciona en Android 7.0 (API 24) o superior.
