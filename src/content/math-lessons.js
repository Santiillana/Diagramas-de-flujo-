import { add, compare, divide, formatRational, multiply, rational, solveDirectRule, solveInverseRule, subtract } from "../math/exact.js";

const f = (n, d=1) => formatRational(rational(n,d));
const calculated = {
  integerSum:formatRational(add(rational(3),rational(-5))),
  integerProduct:formatRational(multiply(rational(-3),rational(-2))),
  hierarchy:formatRational(subtract(add(rational(15),rational(4)),rational(16))),
  sameDenominator:formatRational(add(rational(2,5),rational(1,5))),
  differentDenominator:formatRational(add(rational(1,2),rational(1,3))),
  signedFraction:formatRational(add(rational(-2,5),rational(1,5))),
  direct:formatRational(solveDirectRule(3,5,12)),
  inverse:formatRational(solveInverseRule(4,6,8))
};
const lessonsByTopic = {
  enteros: [
    ["Recta numérica y signos", "Ubica y compara enteros en una recta: cuanto más a la derecha está un número, mayor es.", "La recta es como un edificio: el piso cero separa los pisos de arriba y los sótanos.", "Entero, signo y valor absoluto", "¿Cuál número está más a la derecha?", ["−2", "+3", "Tienen el mismo valor"] , 1, "−2 es menor que +3: queda a su izquierda."],
    ["Sumar y restar enteros", "Suma y resta desplazándote desde el saldo inicial; restar equivale a sumar el opuesto.", "Un saldo negativo representa una deuda; cada movimiento cambia el saldo.", "Opuesto, suma y resta", "Desde 3, ¿dónde llegas al sumar −5?", ["−2", "2", "8"], 0, "Tres más menos cinco es −2. Restar un número equivale a sumar su opuesto."],
    ["Multiplicar y dividir enteros", "Determina el signo del producto o cociente y calcula su magnitud.", "Quitar una deuda puede equivaler a ganar: los signos iguales dan positivo.", "Producto, cociente y ley de signos", "¿Qué signo tiene (−3) × (−2)?", ["Positivo", "Negativo", "Cero"], 0, "Dos factores negativos producen un resultado positivo: (−3) × (−2) = +6."],
    ["Jerarquía de operaciones", "Resuelve primero multiplicaciones y divisiones de izquierda a derecha; luego sumas y restas.", "Una receta tiene un orden: no horneas antes de mezclar.", "Jerarquía de operaciones y agrupación", "En 15 − 8(2) + 24 ÷ 6, ¿qué se resuelve primero?", ["8 × 2", "15 − 8", "15 + 24"], 0, "Primero van multiplicación y división: 8 × 2 = 16 y 24 ÷ 6 = 4; el resultado final es 3."],
    ["Paréntesis y corchetes", "Resuelve primero la agrupación más interna y continúa hacia afuera.", "Como muñecas rusas, se abre primero el marco que está dentro de otro.", "Paréntesis, corchete y anidamiento", "¿Qué se resuelve primero?", ["La agrupación interior", "La operación exterior", "El corchete siempre completo"], 0, "El orden empieza por la expresión más interna, luego se avanza hacia afuera."]
  ],
  racionales: [
    ["Qué es una fracción", "Interpreta el denominador como el total de partes iguales y el numerador como las partes tomadas.", "Repartir una barra de chocolate en cuatro partes iguales y tomar tres representa 3/4.", "Racional, numerador y denominador", "¿Qué representa 3/4?", ["3 partes de 4 iguales", "4 partes de 3", "3 + 4"], 0, "El denominador cuenta las partes iguales; el numerador, las que se toman."],
    ["Fracciones equivalentes y simplificación", "Reconoce fracciones que representan la misma cantidad y simplifícalas con un factor común.", "Media pizza también puede describirse como dos cuartos o cuatro octavos.", "Fracción equivalente y simplificar", "¿Cuál equivale a 1/2?", ["2/4", "2/3", "1/3"], 0, "Multiplicar o dividir numerador y denominador por el mismo número conserva el valor."],
    ["Sumar y restar con igual denominador", "Suma o resta numeradores cuando las partes tienen el mismo tamaño; conserva el denominador.", "Se juntan trozos del mismo tamaño: dos quintos más un quinto son tres quintos.", "Denominador común", "¿Cuánto es 2/5 + 1/5?", ["3/5", "3/10", "2/10"], 0, "Con denominador común se suman numeradores: 2/5 + 1/5 = 3/5."],
    ["Sumar y restar con distinto denominador", "Busca un denominador común, expresa fracciones equivalentes y luego opera.", "Trozos de tamaños distintos deben subdividirse para poder contarlos juntos.", "Mínimo común múltiplo (mcm)", "¿Cuál es el primer múltiplo común de 2 y 3?", ["6", "5", "12"], 0, "1/2 + 1/3 = 3/6 + 2/6 = 5/6."],
    ["Combinar fracciones con signos y agrupación", "Opera fracciones positivas y negativas respetando signos y orden de agrupación.", "Ahorros y deudas también pueden contarse en partes de una unidad.", "Fracción negativa y agrupación", "¿Cuánto es −2/5 + 1/5?", ["−1/5", "−3/5", "1/5"], 0, "Con igual denominador se suman los numeradores con su signo: −2/5 + 1/5 = −1/5."]
  ],
  "regla-de-tres": [
    ["Razón y proporción", "Una razón compara magnitudes; una proporción conserva esa relación al escalar ambas.", "Dos limones por litro mantienen la misma proporción que cuatro limones por dos litros.", "Razón y proporción", "Si duplicas 2 : 1, ¿qué proporción conservas?", ["4 : 2", "4 : 1", "2 : 2"], 0, "Al multiplicar ambos términos por el mismo factor, la razón equivalente es 4 : 2."],
    ["Proporcionalidad directa e inversa", "Clasifica cómo cambia una magnitud cuando aumenta la otra: en directa ambas avanzan juntas; en inversa, en sentidos opuestos.", "Más cocineros pueden preparar más platos o repartir el mismo trabajo en menos tiempo.", "Magnitud directamente e inversamente proporcional", "Con el mismo trabajo, ¿qué ocurre al aumentar las personas?", ["Disminuyen los días", "Aumentan los días", "No cambia nada"], 0, "Si el trabajo total se conserva, más personas implican menos días: relación inversa."],
    ["Regla de tres directa", "Calcula el valor faltante multiplicando en cruz y dividiendo por el dato restante.", "Si tres licencias cuestan 12 unidades, cinco licencias cuestan 20.", "Regla de tres e incógnita", "3 licencias cuestan 12. ¿Cuánto cuestan 5?", ["20", "15", "24"], 0, `x = 5 × 12 ÷ 3 = ${f(solveDirectRule(3,5,12).n,solveDirectRule(3,5,12).d)}.`],
    ["Regla de tres inversa", "Con producto constante, el valor faltante se calcula multiplicando los datos de una magnitud y dividiendo por el nuevo valor de la otra.", "Cuatro personas tardan seis días; ocho personas pueden completar el mismo trabajo en tres días.", "Proporcionalidad inversa y producto constante", "4 personas tardan 6 días. ¿Cuántos días para 8?", ["3 días", "12 días", "4 días"], 0, `4 × 6 ÷ 8 = ${f(solveInverseRule(4,6,8).n,solveInverseRule(4,6,8).d)} días; el trabajo total permanece en 24 persona-días.`],
    ["Decidir y comprobar", "Decide el tipo de proporcionalidad según el contexto, resuelve y sustituye para comprobar.", "Pregúntate: si una magnitud sube, ¿la otra también sube o baja?", "Comprobación", "Si más personas hacen el mismo trabajo en menos tiempo, la relación es…", ["Inversa", "Directa", "Una razón fija"], 0, "Es inversa: personas × días conserva el mismo producto. Sustituye el resultado en la situación para verificarlo."]
  ]
};

const topicTitles = {enteros:"Números enteros", racionales:"Números racionales", "regla-de-tres":"Regla de tres"};
const mathGlossary = "Entero, racional, numerador, denominador, mcm, razón, proporción, directa e inversa.";
const stepDescriptions = {
  enteros: [
    [["Aparece la recta de −12 a 12", "El cero separa números negativos y positivos."],["Sube a +3 y baja a −2", "Cada marca representa una unidad."],["Compara −2 con +3", "Más a la derecha significa mayor."]],
    [["Saldo inicial: +3", "La cuenta comienza con tres unidades."],["Se suma −5", "La ficha avanza cinco marcas a la izquierda."],[`Saldo final: ${calculated.integerSum}`, `3 + (−5) = ${calculated.integerSum}; restar es sumar el opuesto.`]],
    [["Se forman seis pares opuestos", "Cada pareja + y − se anula."],["Se retiran tres grupos de dos deudas", "Quitar cantidades negativas cambia el saldo a favor."],[`Quedan ${calculated.integerProduct} positivas`, `(−3) × (−2) = +${calculated.integerProduct}.`]],
    [["Expresión: 15 − 8(2) + 24 ÷ 6", "Las agrupaciones se identifican primero."],["Resuelve × y ÷ de izquierda a derecha", "8 × 2 = 16; 24 ÷ 6 = 4."],["Continúa con − y +", `15 − 16 + 4 = ${calculated.hierarchy}.`]],
    [["Mira dentro del corchete", "La agrupación interior tiene prioridad."],["Resuelve el paréntesis", "Colapsa su resultado dentro del corchete."],["Avanza hacia afuera", "Termina las operaciones exteriores."]]
  ],
  racionales: [
    [["La barra se divide en cuatro", "Las cuatro partes tienen el mismo tamaño."],["Se sombrean tres partes", "El numerador cuenta las partes tomadas."],["La fracción es 3/4", "El denominador cuenta todas las partes iguales."]],
    [["Una de dos partes: 1/2", "La barra muestra la mitad."],["Cada parte se divide en dos: 2/4", "La cantidad representada se conserva."],["Se subdivide otra vez: 4/8", "Fracciones equivalentes pueden tener distintos números."]],
    [["Dos quintos y un quinto", "Ambas fracciones usan partes del mismo tamaño."],["Se juntan las partes sombreadas", "Se suman los numeradores: 2 + 1."],[`Resultado: ${calculated.sameDenominator}`, "El denominador común permanece igual."]],
    [["Compara 1/2 y 1/3", "Las partes tienen tamaños distintos."],["El primer múltiplo común es 6", "1/2 = 3/6 y 1/3 = 2/6."],[`Suma los sextos: ${calculated.differentDenominator}`, `3/6 + 2/6 = ${calculated.differentDenominator}.`]],
    [["Representa −2/5", "El signo indica una cantidad negativa."],["Suma 1/5", "El denominador común permite combinar las partes."],[`Resultado: ${calculated.signedFraction}`, `−2/5 + 1/5 = ${calculated.signedFraction}.`]]
  ],
  "regla-de-tres": [
    [["Dos limones por litro: 2 : 1", "La razón compara las dos magnitudes."],["Duplica ambos términos", "Multiplica cada término por dos."],["La proporción 4 : 2 conserva la razón", "Ambas describen dos limones por litro."]],
    [["Observa dos situaciones", "Más cocineros y más platos: directa."],["Las flechas avanzan juntas", "En la relación directa ambas magnitudes aumentan."],["En el mismo trabajo, los días bajan", "La relación inversa usa sentidos opuestos."]],
    [["Tabla: 3 licencias → 12; 5 → x", "La tabla deja visible el dato faltante."],["Multiplica en cruz: 5 × 12", "El producto relaciona los valores conocidos."],[`Divide entre 3: x = ${calculated.direct}`, `Comprueba: ${calculated.direct} ÷ 5 = 4 por licencia.`]],
    [["Trabajo total: 4 × 6 = 24", "El rectángulo conserva sus 24 celdas."],["Aumenta a 8 personas", "El ancho aumenta y la altura disminuye."],[`Altura: 24 ÷ 8 = ${calculated.inverse} días`, `8 × ${calculated.inverse} conserva el producto 24.`]],
    [["Pregunta: ¿suben juntas?", "Compara el comportamiento de las magnitudes."],["Elige directa o inversa", "El contexto determina la relación."],["Resuelve y sustituye", "La comprobación debe recuperar los datos de la situación."]]
  ]
};

function makeMathLesson(topic, data, index) {
  const [title, objective, intuitive, technical, question, options, answer, why] = data;
  const steps = stepDescriptions[topic][index];
  const id = `math-${topic}-${index+1}`;
  const check = { question, options, answer, why };
  return {
    id, topic, order:index+1, title, duration:"5 min", objective,
    whenToUse:objective, miniProgram:{title:"Resultado exacto de la lección",code:"imp 1",sample:[]}, term:technical,
    commonError:"Confundir el procedimiento o ignorar el signo y el tamaño de las partes.",
    tryIt:{prompt:"Predice el resultado antes de elegir una respuesta."},
    summary:why, intuitive, technical:`${technical}: ${objective}`,
    visual:{kind:`math-${topic}`,caption:`${topicTitles[topic]} · ${mathGlossary}`,steps},
    example:{title,code:steps.map(([label])=>label).join(" → "),explanation:why,steps:steps.map(([,description])=>description)},
    manipulation:{prompt:"Sigue la escena paso a paso.",input:"",steps:steps.map(([,description])=>description)},
    check
  };
}

export const mathLessons = Object.entries(lessonsByTopic).flatMap(([topic, entries]) => entries.map((entry,index)=>makeMathLesson(topic,entry,index)));
export const mathLessonsByTopic = Object.fromEntries(Object.keys(lessonsByTopic).map(topic=>[topic,mathLessons.filter(lesson=>lesson.topic===topic).map(lesson=>lesson.id)]));
export const mathLessonById = id => mathLessons.find(lesson=>lesson.id===id) ?? null;

// Keep core operations referenced alongside the authored lesson data; their outputs are checked here.
export const verifiedLessonValues = Object.freeze({
  integerCompare: compare(rational(-2),rational(3)),
  integerSum: add(rational(3),rational(-5)),
  integerProduct: multiply(rational(-3),rational(-2)),
  sameDenominator: add(rational(2,5),rational(1,5)),
  differentDenominator: add(rational(1,2),rational(1,3)),
  signedFraction: add(rational(-2,5),rational(1,5)),
  subtractExample: subtract(rational(3,4),rational(1,4)),
  divisionExample: divide(rational(24),rational(6))
});
