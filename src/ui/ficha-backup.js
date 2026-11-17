import {
  createFichaBackup, importFichaBackup, readFichaDataStrict, validateFichaBackup
} from "./ficha-store.js";
import {
  createFullFichaBackup, importFullFichaBackup, validateFullFichaBackup
} from "./ficha-full-backup.js";

const MAX_BACKUP_BYTES = 2 * 1024 * 1024;
const MAX_FULL_BACKUP_BYTES = 4 * 1024 * 1024;

function setStatus(node, message, kind = "info") {
  if (!node) return;
  node.textContent = message;
  node.dataset.status = kind;
}

function localDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return values.year + "-" + values.month + "-" + values.day;
}

function downloadBackup() {
  const stored = readFichaDataStrict();
  if (!stored.ok) return { ok: false, reason: stored.reason };

  let backup;
  try {
    backup = createFichaBackup(stored.data);
  } catch {
    return { ok: false, reason: "invalid_data" };
  }
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "traza-mi-ficha-" + localDateKey() + ".json";
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return { ok: true };
}

export function initFichaBackup() {
  const exportButton = document.querySelector("#ficha-backup-export");
  const importButton = document.querySelector("#ficha-backup-import");
  const fileInput = document.querySelector("#ficha-backup-file");
  const status = document.querySelector("#ficha-backup-status");
  const fullExportButton = document.querySelector("#ficha-full-backup-export");
  const fullImportButton = document.querySelector("#ficha-full-backup-import");
  const fullFileInput = document.querySelector("#ficha-full-backup-file");
  const fullStatus = document.querySelector("#ficha-full-backup-status");
  if (!exportButton || !importButton || !fileInput || !status) return;

  exportButton.addEventListener("click", () => {
    const result = downloadBackup();
    setStatus(status,
      result.ok ? "Respaldo descargado. Guárdalo en un lugar seguro." :
        result.reason === "corrupt_storage" || result.reason === "unsupported_schema" || result.reason === "invalid_records"
        ? "Los datos locales necesitan recuperación o actualización. No se generó un respaldo vacío."
        : "No se pudo leer el almacenamiento local; no se generó un respaldo vacío.",
      result.ok ? "success" : "error");
  });

  importButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      setStatus(status, "El archivo supera el límite de 2 MB.", "error");
      fileInput.value = "";
      return;
    }

    try {
      const parsed = JSON.parse(await file.text());
      const validation = validateFichaBackup(parsed);
      if (!validation.ok) {
        setStatus(status, "El respaldo no es válido o contiene referencias inconsistentes. No se modificaron tus datos.", "error");
        return;
      }
      const count = validation.data.activities.length;
      const confirmed = window.confirm(
        "Vas a reemplazar los datos locales de Mi ficha por " + count +
        " actividad(es) del respaldo. Esta acción no se puede deshacer desde la aplicación. ¿Continuar?"
      );
      if (!confirmed) {
        setStatus(status, "Importación cancelada. Tus datos siguen intactos.");
        return;
      }
      const result = importFichaBackup(parsed);
      setStatus(status,
        result.ok ? "Respaldo restaurado. Se importaron " + count + " actividad(es)." :
          "No se pudo guardar el respaldo. Tus datos anteriores se conservaron.",
        result.ok ? "success" : "error");
    } catch {
      setStatus(status, "No se pudo leer el archivo JSON. No se modificaron tus datos.", "error");
    } finally {
      fileInput.value = "";
    }
  });
  if (fullExportButton && fullImportButton && fullFileInput && fullStatus) {
    fullExportButton.addEventListener("click", () => {
      try {
        const backup = createFullFichaBackup();
        const blob = new Blob([JSON.stringify(backup, null, 2)], {
          type: "application/json;charset=utf-8"
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "traza-mi-ficha-completa-" + localDateKey() + ".json";
        anchor.hidden = true;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
        setStatus(fullStatus, "Respaldo completo descargado. Incluye Actividades y Biblioteca personales.", "success");
      } catch (error) {
        setStatus(fullStatus, "No se pudo crear el respaldo completo (" +
          String(error.message || "error") + "). No se descargó un archivo parcial.", "error");
      }
    });

    fullImportButton.addEventListener("click", () => fullFileInput.click());
    fullFileInput.addEventListener("change", async () => {
      const file = fullFileInput.files?.[0];
      if (!file) return;
      try {
        if (file.size > MAX_FULL_BACKUP_BYTES) {
          setStatus(fullStatus, "El archivo supera el límite de 4 MB.", "error");
          return;
        }
        const parsed = JSON.parse(await file.text());
        const validation = validateFullFichaBackup(parsed);
        if (!validation.ok) {
          setStatus(fullStatus, "El respaldo completo no es válido. No se modificaron tus datos.", "error");
          return;
        }
        const activitiesCount = validation.data.activities.activities.length;
        const resourcesCount = validation.data.library.resources.length;
        const confirmed = window.confirm(
          "Vas a reemplazar Actividades (" + activitiesCount + ") y Biblioteca (" +
          resourcesCount + ") de este navegador. Traza validará ambas áreas antes de restaurar. ¿Continuar?"
        );
        if (!confirmed) {
          setStatus(fullStatus, "Importación cancelada. Tus dos áreas personales siguen intactas.");
          return;
        }
        const result = importFullFichaBackup(parsed);
        if (!result.ok) {
          setStatus(fullStatus, result.rolledBack
            ? "La restauración se revirtió porque falló una escritura. Los datos anteriores se conservaron."
            : "No se pudo restaurar el respaldo completo (" + result.reason + ").", "error");
          return;
        }
        setStatus(fullStatus, "Respaldo completo restaurado: " + activitiesCount +
          " actividad(es) y " + resourcesCount + " recurso(s).", "success");
      } catch {
        setStatus(fullStatus, "No se pudo leer el respaldo completo. No se modificaron tus datos.", "error");
      } finally {
        fullFileInput.value = "";
      }
    });
  }
}
