import test from "node:test";import assert from "node:assert/strict";import {FICHA} from "../src/content/ficha.js";import {crearFichaInicial,validarFichaPersonal} from "../src/ficha/store.js";import {registroActividad,actualizarChecklistActividad,actualizarNotasActividad,registrarResultadoTranscrito} from "../src/ficha/actividades.js";const id=FICHA.actividades[0].id;
test("inicia seguimiento vacío sin alterar catálogo",()=>{const p=crearFichaInicial();assert.deepEqual(registroActividad(p,id),{estado:"pendiente",notas:"",checklist:{subida:false,enviada:false,confirmada:false},intentos:[]});});
test("checklist confirma entrega y aprobación bloquea cambios",()=>{let p=crearFichaInicial();for(const c of ["subida","enviada","confirmada"])p=actualizarChecklistActividad(p,id,c,true).datos;assert.equal(registroActividad(p,id).estado,"entregada");const a=registrarResultadoTranscrito(p,id,{juicio:"aprobado",fecha:"2026-11-17"},"2026-11-17");assert.equal(a.ok,true);assert.equal(registroActividad(a.datos,id).estado,"aprobada");assert.equal(actualizarChecklistActividad(a.datos,id,"confirmada",false).razon,"actividad_bloqueada");assert.equal(validarFichaPersonal(a.datos).ok,true);});
test("notas personales limitadas y separadas del contenido oficial",()=>{const p=crearFichaInicial(),r=actualizarNotasActividad(p,id,"Revisar el ejemplo 2");assert.equal(r.ok,true);assert.equal(registroActividad(r.datos,id).notas,"Revisar el ejemplo 2");assert.equal(actualizarNotasActividad(p,id,"x".repeat(4001)).razon,"notas_invalidas");});
test("resultado transcrito exige entrega y conserva intentos",()=>{let p=crearFichaInicial();assert.equal(registrarResultadoTranscrito(p,id,{juicio:"aprobado"}).razon,"entrega_no_confirmada");for(const c of ["subida","enviada","confirmada"])p=actualizarChecklistActividad(p,id,c,true).datos;const n=registrarResultadoTranscrito(p,id,{juicio:"no_aprobado",correccion:"Revisar decisión",fecha:"2026-11-17"});assert.equal(n.ok,true);let corregida=n.datos;for(const c of ["subida","enviada","confirmada"])corregida=actualizarChecklistActividad(corregida,id,c,true).datos;const a=registrarResultadoTranscrito(corregida,id,{juicio:"aprobado",fecha:"2026-11-18",enlace:"https://example.org/evidencia"});assert.equal(a.ok,true);assert.equal(registroActividad(a.datos,id).intentos.length,2);assert.equal(registroActividad(a.datos,id).intentos[0].correccion,"Revisar decisión");assert.equal(registrarResultadoTranscrito(a.datos,id,{juicio:"aprobado"}).razon,"actividad_bloqueada");});
test("rechaza enlaces inseguros, fechas inválidas y actividades inexistentes",()=>{let p=crearFichaInicial();for(const c of ["subida","enviada","confirmada"])p=actualizarChecklistActividad(p,id,c,true).datos;assert.equal(registrarResultadoTranscrito(p,id,{juicio:"aprobado",enlace:"javascript:alert(1)"}).razon,"enlace_invalido");assert.equal(registrarResultadoTranscrito(p,id,{juicio:"aprobado",fecha:"2026-02-30"}).razon,"fecha_invalida");assert.equal(actualizarChecklistActividad(p,"no-existe","subida",true).razon,"actividad_inexistente");});

import { readFile } from "node:fs/promises";
test("Actividades está conectada a navegación, inicialización y estilos", async () => {
  const read = path => readFile(new URL(path, import.meta.url), "utf8");
  const html = await read("../index.html");
  const init = await read("../src/ficha/init.js");
  const css = await read("../src/styles/ficha-activities.css");
  const app = await read("../src/ui/navigation.js");
  assert.match(html, /id="view-actividades" data-view="actividades"/);
  assert.doesNotMatch(html, /class="space-view ficha-placeholder" id="view-actividades"/);
  assert.match(html, /styles\/ficha-activities\.css/);
  assert.match(init, /initActividades\(\)/);
  assert.match(init, /renderActividades\(\)/);
  assert.match(app, /actividades: \{ title: "Actividades"/);
  assert.ok(css.includes(".ficha-activities-layout"));
});
