import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { FICHA } from "../src/content/ficha.js";
import {
  obtenerFiltros, actualizarFiltro, limpiarFiltros,
  actividadPasaFiltros, competenciaPasaFiltro, renderFiltros
} from "../src/ficha/filtros.js";

const read = path => readFile(new URL(path, import.meta.url), "utf8");

test("los filtros iniciales muestran todas las competencias, sin ocultar actividades", () => {
  limpiarFiltros(false);
  assert.deepEqual(obtenerFiltros(), { competenciaId: "todas", estado: "todos" });
  const actividad = { id: "x", competenciaId: "logica-programacion", limite: "2026-11-19" };
  assert.equal(actividadPasaFiltros(actividad, {}, "2026-11-17"), true);
  assert.equal(competenciaPasaFiltro("logica-programacion"), true);
});

test("el filtro de competencia acepta ids existentes y comparte su valor", () => {
  limpiarFiltros(false);
  const actualizado = actualizarFiltro("competenciaId", "matematicas", false);
  assert.equal(actualizado.competenciaId, "matematicas");
  assert.equal(competenciaPasaFiltro("matematicas"), true);
  assert.equal(competenciaPasaFiltro("comunicacion"), false);
  assert.equal(actualizarFiltro("competenciaId", "no-existe", false).competenciaId, "matematicas");
  assert.match(renderFiltros("test"), /value="matematicas" selected/);
  limpiarFiltros(false);
});

test("el filtro de estado separa una actividad atrasada de su estado manual pendiente", () => {
  limpiarFiltros(false);
  const vencida = { id: "v", competenciaId: "logica-programacion", limite: "2026-11-16" };
  const personal = { actividades: { v: { estado: "pendiente" } } };
  actualizarFiltro("estado", "atrasada", false);
  assert.equal(actividadPasaFiltros(vencida, personal, "2026-11-17"), true);
  actualizarFiltro("estado", "pendiente", false);
  assert.equal(actividadPasaFiltros(vencida, personal, "2026-11-17"), false);
  limpiarFiltros(false);
});

test("el horario coincide con los días, horas, temas e instructores de la imagen compartida", () => {
  assert.equal(FICHA.horario.length, 8);
  const porDia = dia => FICHA.horario.filter(item => item.dia === dia);
  assert.deepEqual(porDia(1).map(item => [item.competenciaId, item.inicio, item.fin, item.instructorId, item.vigenteDesde, item.vigenteHasta]), [
    ["evaluar-requisitos", "18:00", "22:00", "jair-castaneda", null, "2026-11-01"],
    ["matematicas", "18:00", "22:00", "yilliam-romero", "2026-11-02", null]
  ]);
  assert.deepEqual(porDia(2).map(item => [item.competenciaId, item.inicio, item.fin, item.instructorId]), [
    ["comunicacion", "18:00", "22:00", "sandra-lizcano"]
  ]);
  assert.deepEqual(porDia(3).map(item => [item.competenciaId, item.inicio, item.fin, item.instructorId]), [
    ["evaluar-requisitos", "18:00", "22:00", "jair-castaneda"]
  ]);
  assert.deepEqual(porDia(4).map(item => [item.competenciaId, item.inicio, item.fin, item.instructorId]), [
    ["tics", "18:00", "22:00", "yonel-torres"]
  ]);
  assert.deepEqual(porDia(5).map(item => [item.competenciaId, item.inicio, item.fin, item.instructorId]), [
    ["establecer-requisitos", "18:00", "22:00", "gloria-romero"]
  ]);
  assert.deepEqual(porDia(6).map(item => [item.inicio, item.fin, item.instructorId]), [
    ["12:00", "16:00", "gloria-romero"], ["16:00", "22:00", "jair-castaneda"]
  ]);
  assert.equal(porDia(7).length, 0);
  assert.equal(FICHA.horarioNotas.length, 0);
});

test("las vistas de Mi ficha están conectadas a la aplicación y tienen estilos", async () => {
  const html = await read("../index.html");
  const app = await read("../src/app.js");
  const init = await read("../src/ficha/init.js");
  const css = await read("../src/styles/ficha.css");
  for (const id of ["view-hoy", "view-semana", "view-calendario"]) {
    assert.match(html, new RegExp('id="' + id + '"'));
    assert.doesNotMatch(html, new RegExp('id="' + id + '"[^>]*ficha-placeholder'));
  }
  assert.match(html, /styles\/ficha\.css/);
  assert.match(app, /import \{ initFicha \}/);
  assert.match(app, /initFicha\(\)/);
  for (const marker of ["initHoy", "initSemana", "initCalendario", "traza:ficha-actualizada"]) {
    assert.ok(init.includes(marker), "Falta conectar " + marker);
  }
  for (const selector of [".ficha-week-grid", ".ficha-calendar-grid", ".ficha-activity-card", ".ficha-day-picker"]) {
    assert.ok(css.includes(selector), "Falta estilo " + selector);
  }
});
