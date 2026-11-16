import {
  createFichaBackup, importFichaBackup, readFichaData, validateFichaBackup
} from "./ficha-store.js";

const MAX_BACKUP_BYTES = 2 * 1024 * 1024;

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
  let storageAvailable = false;
  try {
    window.localStorage.getItem("traza:v4:ficha");
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  if (!storageAvailable) return { ok: false, reason: "storage_unavailable" };

  const backup = createFichaBackup(readFichaData());
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
  if (!exportButton || !importButton || !fileInput || !status) return;

  exportButton.addEventListener("click", () => {
    const result = downloadBackup();
    setStatus(status,
      result.ok ? "Respaldo descargado. Guárdalo en un lugar seguro." :
        "No se pudo leer el almacenamiento local; no se generó un respaldo vacío.",
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
}
