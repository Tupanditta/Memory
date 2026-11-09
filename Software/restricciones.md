### Restricciones

- R1. Solo aplicación para Android 7.0 (API 24) o superior. Sin iOS ni escritorio. La vista web existe únicamente como vista previa en desarrollo.
- R2. Un único usuario: sin cuentas, login ni compartición de datos en línea.
- R3. Sin servidor ni backend; almacenamiento local en el dispositivo.
- R4. Las notificaciones son locales (sin servicio push externo).
- R5. El calendario solo contiene cumpleaños y aniversarios; no es un calendario general.
- R6. Sin mapas, geolocalización ni navegación en la primera versión.
- R7. Sin sincronización entre dispositivos ni copia en la nube. La copia de seguridad es manual: exportar e importar un archivo JSON.
- R8. Una casa debe tener al menos una persona; no puede existir vacía.
- R9. Los datos viven solo en `personas.json` y `casas.json` (más `ajustes.json`); la UI no guarda estado propio que no esté en ellos.
- R10. Alcance mínimo: funcionalidad simple; no añadir funciones fuera de lo descrito en el contexto y los requisitos.
- R11. La importación nunca reemplaza, modifica ni borra datos existentes; solo añade.
- R12. En la raíz del repositorio solo puede haber `.gitignore`, `.gitattributes` y `README.md`. Todo lo demás va en carpetas (`Software/`, `memory-app/`, `.claude/`).
- R13. Identificador de la app Android: `com.tupanditta.memory`.
