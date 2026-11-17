import { evaluateMathExpression, formatDecimalOrRational, rational, solveDirectRule, solveInverseRule } from "./exact.js";

const integerSource = [
  ["15−8(2)+24÷6",3],["(−12)+5(4)−18÷3",2],["30−4(5)+36÷9",14],["(−5)(6)+48÷8−12",-36],
  ["20−(−3)(4)+18÷6",35],["(−18)+12(2)−45÷5",-3],["64÷8+7(3)−15",14],["50−[4(6)−8]",34],
  ["(−15+25)(4)−36÷9",36],["(−20+35)(4)−[(18÷3)+5]",49],["150−[(9)(8)−12]+24",114],
  ["200−[(14−6)(9)]+30",158],["(45−20)(3)−56÷8",68],["(50−15)(2)+36÷6−8",68]
];

const rationalSource = [
  ["7/6−2/3","1/2"],["(5/6−1/3)+1/2","1"],["−5/7+2/7","−3/7"],
  ["−2/5+3/10−1/2","−3/5"],["3/5+1/2","11/10"],["7/8−1/4+3/16","13/16"],
  ["−4/9−2/9","−2/3"],["5/6−1/4","7/12"],["2/3+1/6−1/2","1/3"]
];

const ruleSource = [
  {type:"inversa",a:8,b:15,c:12,unitA:"desarrolladores",unitB:"días",thing:"un módulo de software",statement:"Si 8 desarrolladores terminan un módulo de software en 15 días, ¿cuántos días tardarán 12 desarrolladores?",check:"El trabajo se conserva: desarrolladores × días."},
  {type:"directa",a:4,b:14,c:280000,unitA:"licencias",unitB:"pesos",thing:"licencias de software",statement:"Si 4 licencias de software cuestan $280.000, ¿cuánto costarán 14 licencias?",check:"El costo por licencia debe permanecer constante."},
  {type:"directa",a:5,b:12,c:20000,unitA:"minutos",unitB:"solicitudes",thing:"solicitudes de una API",statement:"Si una API procesa 20.000 solicitudes en 5 minutos, ¿cuántas solicitudes procesará en 12 minutos?",check:"La cantidad de solicitudes por minuto debe permanecer constante."},
  {type:"inversa",a:15,b:8,c:20,unitA:"servidores",unitB:"minutos",thing:"una tarea de servidores",statement:"Si 15 servidores realizan una tarea en 8 minutos, ¿cuánto tardarán 20 servidores?",check:"El trabajo total de servidor-minutos se conserva."},
  {type:"directa",a:6,b:10,c:54,unitA:"programadores",unitB:"errores",thing:"errores corregidos durante una jornada",statement:"Si 6 programadores corrigen 54 errores durante una jornada, ¿cuántos errores corregirán 10 programadores?",check:"Los errores corregidos por programador deben permanecer constantes."},
  {type:"inversa",a:10,b:18,c:15,unitA:"analistas",unitB:"horas",thing:"probar una aplicación",statement:"Si 10 analistas prueban una aplicación en 18 horas, ¿cuántas horas necesitarán 15 analistas?",check:"El total de analista-horas se conserva."},
  {type:"directa",a:8,b:12,c:600,unitA:"horas",unitB:"líneas de código",thing:"trabajo de un desarrollador",statement:"Si un desarrollador escribe 600 líneas de código en 8 horas, ¿cuántas líneas escribirá en 12 horas?",check:"Las líneas escritas por hora deben permanecer constantes."},
  {type:"inversa",a:18,b:10,c:12,unitA:"técnicos",unitB:"horas",thing:"instalar una red",statement:"Si 18 técnicos instalan una red en 10 horas, ¿cuántas horas necesitarán 12 técnicos?",check:"El trabajo total de técnico-horas se conserva."},
  {type:"directa",a:5,b:12,c:850000,unitA:"bases de datos",unitB:"registros",thing:"bases de datos iguales",statement:"Si 5 bases de datos almacenan 850.000 registros, ¿cuántos registros almacenarán 12 bases de datos iguales?",check:"Los registros por base de datos deben permanecer constantes."},
  {type:"inversa",a:6,b:30,c:18,unitA:"desarrolladores",unitB:"días",thing:"desarrollar una aplicación",statement:"Si 6 desarrolladores terminan una aplicación en 30 días, ¿cuántos días necesitarán 18 desarrolladores?",check:"El trabajo se conserva: desarrolladores × días."},
  {type:"directa",a:8,b:20,c:2400,unitA:"GB",unitB:"archivos",thing:"almacenamiento",statement:"Si 8 GB permiten almacenar 2.400 archivos, ¿cuántos archivos podrán almacenarse en 20 GB?",check:"Los archivos por GB deben permanecer constantes."},
  {type:"inversa",a:9,b:24,c:12,unitA:"programadores",unitB:"días",thing:"desarrollar una aplicación",statement:"Si 9 programadores desarrollan una aplicación en 24 días, ¿cuántos días tardarán 12 programadores?",check:"El trabajo se conserva: programadores × días."},
  {type:"directa",a:7,b:15,c:630000,unitA:"licencias",unitB:"pesos",thing:"licencias de software",statement:"Si 7 licencias de un software cuestan $630.000, ¿cuánto costarán 15 licencias?",check:"El costo por licencia debe permanecer constante."},
  {type:"directa",a:25,b:40,c:1000,unitA:"usuarios",unitB:"solicitudes",thing:"una plataforma",statement:"Si 25 usuarios generan 1.000 solicitudes en una plataforma, ¿cuántas solicitudes generarán 40 usuarios?",check:"Las solicitudes por usuario deben permanecer constantes."},
  {type:"inversa",a:12,b:9,c:18,unitA:"servidores",unitB:"horas",thing:"una copia de seguridad",statement:"Si 12 servidores realizan una copia de seguridad en 9 horas, ¿cuánto tiempo necesitarán 18 servidores?",check:"El trabajo total de servidor-horas se conserva."}
];

const exactInt = n => rational(BigInt(n));
export const mathExercises = [
  ...integerSource.map(([expression,expected],index)=>({
    id:`MAT-ENT-${String(index+1).padStart(2,"0")}`,topic:"enteros",difficulty:index<3?1:index<8?2: index<12?3:4,
    title:`Enteros · Ejercicio ${String(index+1).padStart(2,"0")}`,statement:`Resuelve respetando la jerarquía de operaciones: ${expression}`,
    expression,expected:exactInt(expected),expectedText:String(expected).replace("-","−"),classExercise:true,source:"Evidencia de Aprendizaje 1 · Parte A",solution:evaluateMathExpression(expression).steps
  })),
  {id:"MAT-ENT-15",topic:"enteros",difficulty:4,title:"Enteros · Ejercicio 15 (por confirmar)",statement:"El original dice «00−[(12−4)(5)]+18». Confirma si el primer término es 00 antes de resolver.",expression:"00−[(12−4)(5)]+18",expected:null,expectedText:null,classExercise:true,pending:true,source:"Evidencia de Aprendizaje 1 · Parte A"},
  ...rationalSource.map(([expression,expected],index)=>({
    id:`MAT-RAC-${String(index+1).padStart(2,"0")}`,topic:"racionales",difficulty:index<3?1:index<6?2:3,
    title:`Racionales · Ejercicio ${String(index+1).padStart(2,"0")}`,statement:`Resuelve y simplifica: ${expression}`,
    expression,expected:evaluateMathExpression(expected).value,expectedText:expected,classExercise:true,source:"Guía de construcción del paso 16 · Parte B",solution:evaluateMathExpression(expression).steps
  })),
  ...ruleSource.map((item,index)=>{
    const result=item.type==="directa"?solveDirectRule(item.a,item.b,item.c):solveInverseRule(item.a,item.b,item.c);
    const exactText=formatDecimalOrRational(result);
    return {id:`MAT-R3-${String(index+1).padStart(2,"0")}`,topic:"regla-de-tres",difficulty:index<5?1:index<10?2:index<14?3:4,
      title:`Regla de tres · Problema ${String(index+1).padStart(2,"0")}`,statement:item.statement,
      type:item.type,rule:item,expected:result,expectedText:exactText,classExercise:true,source:"Evidencia de Aprendizaje 1 · Parte C",
      verification:item.type==="directa"?`Tasa unitaria: ${item.c} ÷ ${item.a}; luego se multiplica por ${item.b}. ${item.check}`:`Producto constante: ${item.a} × ${item.b}; luego se divide entre ${item.c}. ${item.check}`};
  })
];

export const mathExerciseById = id => mathExercises.find(item=>item.id===id)??null;
export const mathExercisesByTopic = Object.fromEntries(["enteros","racionales","regla-de-tres"].map(topic=>[topic,mathExercises.filter(item=>item.topic===topic)]));
