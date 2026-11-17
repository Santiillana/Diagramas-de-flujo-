import test from "node:test";
import assert from "node:assert/strict";
import { add, compare, evaluateMathExpression, formatDecimalOrRational, formatRational, parseMathExpression, parseRationalAnswer, rational, solveDirectRule, solveInverseRule, subtract } from "../src/math/exact.js";
import { generateMathExercise } from "../src/math/generators.js";
import { mathExercises } from "../src/math/exercises.js";

function independentEvaluate(source){
  const tokens=String(source).replace(/[−–]/g,"-").replace(/[×·]/g,"*").replace(/÷/g,"/").replace(/[\[\]]/g,ch=>ch==="["?"(":")").match(/\d+(?:\.\d+)?|[()+\-*/]/g)||[];
  const expanded=[];
  for(const token of tokens){const previous=expanded.at(-1);if(previous&&/[\d)]/.test(previous)&&/[\d(]/.test(token))expanded.push("*");expanded.push(token);}
  const output=[],operators=[],precedence={"+":1,"-":1,"*":2,"/":2,"u-":3,"u+":3};let previous="start";
  for(let token of expanded){
    if(/^\d/.test(token)){output.push(token);previous="value";continue;}
    if(token==="("){operators.push(token);previous="(";continue;}
    if(token===")"){while(operators.at(-1)!=="(")output.push(operators.pop());operators.pop();previous="value";continue;}
    if((token==="-"||token==="+")&&["start","(","operator"].includes(previous))token="u"+token;
    while(operators.length&&operators.at(-1)!=="("&&precedence[operators.at(-1)]>=precedence[token])output.push(operators.pop());
    operators.push(token);previous="operator";
  }
  while(operators.length)output.push(operators.pop());
  const stack=[];
  const norm=(n,d)=>{if(d<0n){n=-n;d=-d;}let a=n<0n?-n:n,b=d;while(b)[a,b]=[b,a%b];return {n:n/(a||1n),d:d/(a||1n)};};
  for(const token of output){
    if(/^\d/.test(token)){const [w,d=""]=token.split("."),p=10n**BigInt(d.length);stack.push(norm(BigInt((w||"0")+d),p));continue;}
    if(token==="u-"||token==="u+"){const a=stack.pop();stack.push(norm(token==="u-"?-a.n:a.n,a.d));continue;}
    const b=stack.pop(),a=stack.pop();
    stack.push(norm(token==="+"?a.n*b.d+b.n*a.d:token==="-"?a.n*b.d-b.n*a.d:token==="*"?a.n*b.n:a.n*b.d,token==="/"?a.d*b.n:a.d*b.d));
  }
  return stack[0];
}

test("el parser matemático reconoce operadores, multiplicación implícita y negativos sin eval",()=>{
  assert.equal(evaluateMathExpression("8(2)").formatted,"16");
  assert.equal(evaluateMathExpression("3(2)(4)").formatted,"24");
  assert.equal(evaluateMathExpression("[50−15](2)").formatted,"70");
  assert.equal(evaluateMathExpression("−3/7+1/7").formatted,"−2/7");
});

test("los ejercicios de clase conservan los resultados de verificación",()=>{
  const expectedIntegers=[3,2,14,-36,35,-3,14,34,36,49,114,158,68,68];
  const integers=mathExercises.filter(item=>item.topic==="enteros");
  for(let i=0;i<14;i++){assert.equal(integers[i].expected.n,BigInt(expectedIntegers[i]),integers[i].id);assert.equal(integers[i].expected.d,1n);}
  assert.equal(integers[14].pending,true);assert.equal(integers[14].expected,null);
  const expectedRationals=["1/2","1","−3/7","−3/5","11/10","13/16","−2/3","7/12","1/3"];
  assert.deepEqual(mathExercises.filter(item=>item.topic==="racionales").map(item=>formatRational(item.expected)),expectedRationals);
  const r3=mathExercises.filter(item=>item.topic==="regla-de-tres");
  assert.deepEqual(r3.map(item=>item.type),["inversa","directa","directa","inversa","directa","inversa","directa","inversa","directa","inversa","directa","inversa","directa","directa","inversa"]);
  assert.deepEqual(r3.map(item=>item.expectedText),["10","980.000","48.000","6","90","12","900","15","2.040.000","10","6.000","18","1.350.000","1.600","6"]);
  assert.ok(r3.every(item=>item.verification&&item.classExercise));
});

test("el evaluador independiente coincide en expresiones y retos generados por semilla",()=>{
  for(const item of mathExercises.filter(candidate=>candidate.expression&&!candidate.pending)){
    const independent=independentEvaluate(item.expression);
    assert.equal(item.expected.n*independent.d,item.expected.d*independent.n,`${item.id}: ${item.expression}`);
  }
  for(const topic of ["enteros","racionales"]){
    for(let difficulty=1;difficulty<=4;difficulty++)for(let seed=0;seed<20;seed++){
      const item=generateMathExercise(topic,difficulty,`audit-${seed}`),independent=independentEvaluate(item.expression);
      assert.equal(item.expected.n*independent.d,item.expected.d*independent.n,`${topic} nivel ${difficulty} semilla ${seed}: ${item.expression} (motor ${item.expected.n}/${item.expected.d}; oráculo ${independent.n}/${independent.d})`);
      assert.deepEqual(generateMathExercise(topic,difficulty,`audit-${seed}`),item);
    }
  }
  for(let difficulty=1;difficulty<=4;difficulty++)for(let seed=0;seed<20;seed++){
    const item=generateMathExercise("regla-de-tres",difficulty,`audit-${seed}`),{a,b,c}=item.rule;
    const expected=item.type==="directa"?rational(BigInt(b*c),BigInt(a)):rational(BigInt(a*c),BigInt(b));
    assert.equal(compare(item.expected,expected),0);
    if(difficulty===4)assert.match(item.expectedText,/,/);
  }
});

test("el formato de respuesta respeta puntos de miles, coma decimal y fracciones equivalentes",()=>{
  assert.equal(formatRational(parseRationalAnswer("$280.000")),"280.000");
  assert.equal(formatDecimalOrRational(parseRationalAnswer("1.234,50")),"1.234,5");
  assert.equal(compare(parseRationalAnswer("3/6"),rational(1,2)),0);
  assert.equal(compare(parseRationalAnswer("−3/7"),rational(-3,7)),0);
  assert.throws(()=>parseRationalAnswer("hola"));
  assert.equal(formatDecimalOrRational(rational(5,2)),"2,5");
  assert.equal(formatDecimalOrRational(rational(1,3)),"1/3");
  assert.equal(formatRational(add(rational(1,2),rational(1,3))),"5/6");
  assert.equal(formatRational(subtract(rational(1,2),rational(1,3))),"1/6");
});

test("el parser señala división por cero y expresiones mal formadas con errores claros",()=>{
  assert.throws(()=>evaluateMathExpression("5÷0"),/dividir entre cero/);
  assert.throws(()=>parseMathExpression("2+(3"),/Falta cerrar el paréntesis/);
  assert.throws(()=>parseMathExpression("2@3"),/Carácter no permitido/);
  assert.equal(formatRational(solveDirectRule(4,14,280000)),"980.000");
  assert.equal(formatRational(solveInverseRule(8,15,12)),"10");
});
