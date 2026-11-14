/**
 * Mini-programas de las 14 lecciones Aprende.
 * La sintaxis pertenece al parser del simulador; no son fragmentos JavaScript.
 */
export const lessonPrograms = Object.freeze({
  algorithm:{
    pseudocode:"leer n | doble = n * 2 | imp doble",
    sampleInputs:[4],expectedOutputs:[8],
    purpose:"Una entrada, una transformación y una salida en una sola secuencia."
  },
  reading:{
    pseudocode:"leer a | siguiente = a + 1 | imp siguiente",
    sampleInputs:[4],expectedOutputs:[5],
    purpose:"La ejecución sigue las conexiones en el orden que define el flujo."
  },
  terminals:{
    pseudocode:'imp "Hola"',
    sampleInputs:[],expectedOutputs:["Hola"],
    purpose:"El recorrido comienza, ejecuta una instrucción y alcanza el terminal Fin."
  },
  "io-process":{
    pseudocode:"leer base,altura | area = base * altura | imp area",
    sampleInputs:[4,3],expectedOutputs:[12],
    purpose:"Leer recibe los datos; la asignación calcula; Imprimir comunica el resultado."
  },
  variables:{
    pseudocode:"leer x | x = x + 5 | imp x",
    sampleInputs:[10],expectedOutputs:[15],
    purpose:"La expresión usa el valor anterior y guarda el nuevo valor en la misma variable."
  },
  arithmetic:{
    pseudocode:"leer a,b | resultado = (a + b) * 2 - 5 | imp resultado",
    sampleInputs:[3,4],expectedOutputs:[9],
    purpose:"Los paréntesis cambian el orden en que se evalúan las operaciones."
  },
  decisions:{
    pseudocode:'leer nota | si nota >= 3 | imp "aprueba" | sino | imp "reprueba" | fin',
    sampleInputs:[2],expectedOutputs:["reprueba"],
    purpose:"La condición elige una sola de las dos rutas."
  },
  "nested-decisions":{
    pseudocode:'leer n | si n > 0 | imp "positivo" | sino | si n < 0 | imp "negativo" | sino | imp "cero" | fin | fin',
    sampleInputs:[-2],expectedOutputs:["negativo"],
    purpose:"La segunda decisión solo se evalúa cuando la primera condición es falsa."
  },
  "counters-accumulators":{
    pseudocode:"leer n | suma = 0 | para i = 1; i <= n; i++ | suma = suma + i | fin | imp suma",
    sampleInputs:[3],expectedOutputs:[6],
    purpose:"i cuenta iteraciones; suma conserva el total acumulado."
  },
  for:{
    pseudocode:"leer n | para i = 1; i <= n; i++ | imp i | fin",
    sampleInputs:[3],expectedOutputs:[1,2,3],
    purpose:"La preparación ocurre una vez; la condición se evalúa antes del cuerpo y el avance al final."
  },
  while:{
    pseudocode:"leer n | i = 1 | mientras i <= n | imp i | i = i + 1 | fin",
    sampleInputs:[3],expectedOutputs:[1,2,3],
    purpose:"Mientras evalúa la condición antes de entrar; con n = 0 el cuerpo no se ejecuta."
  },
  "do-while":{
    pseudocode:"leer n | hacer | imp n | n = n - 1 | hm n > 0",
    sampleInputs:[3],expectedOutputs:[3,2,1],
    purpose:"Hacer–Mientras ejecuta el cuerpo antes de evaluar si debe repetir."
  },
  "nested-loops":{
    pseudocode:"leer filas,columnas | para fila = 1; fila <= filas; fila++ | para col = 1; col <= columnas; col++ | imp fila * col | fin | fin",
    sampleInputs:[2,3],expectedOutputs:[1,2,3,2,4,6],
    purpose:"El ciclo interior completa sus columnas antes de que avance la fila exterior."
  },
  "validation-sentinel":{
    pseudocode:"suma = 0 | leer n | mientras n <> 0 | suma = suma + n | leer n | fin | imp suma",
    sampleInputs:[4,7,0],expectedOutputs:[11],
    purpose:"El centinela 0 detiene la lectura y no se añade al acumulador."
  }
});
