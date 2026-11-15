import test from "node:test";
import assert from "node:assert/strict";
import { exercises } from "../src/content/exercises.js";

const sum = values => values.reduce((total, value) => total + value, 0);
const maxFirst = values => {
  let value = values[0], position = 1;
  for (let i = 1; i < values.length; i++) {
    if (values[i] > value) { value = values[i]; position = i + 1; }
  }
  return [value, position];
};
const minFirst = values => {
  let value = values[0], position = 1;
  for (let i = 1; i < values.length; i++) {
    if (values[i] < value) { value = values[i]; position = i + 1; }
  }
  return [value, position];
};

// Oráculo independiente: calcula el resultado esperado desde la definición
// matemática del problema; no interpreta ni reutiliza el pseudocódigo.
function referenceOutput(id, input) {
  const n = input.map(Number);
  switch (id) {
    case 1: return [n[0] + n[1]];
    case 2: return [n[0] - n[1]];
    case 3: return [n[0] * n[1], 2 * (n[0] + n[1])];
    case 4: return [sum(n.slice(0, 3)) / 3];
    case 5: return [Math.max(n[0], n[1])];
    case 6: return [n[0] > 0 ? "positivo" : n[0] < 0 ? "negativo" : "cero"];
    case 7: return [n[0] >= 3 ? "aprueba" : "reprueba"];
    case 8: return [Math.max(n[0], n[1], n[2])];
    case 9: return [n[0] >= 100 ? n[0] * 0.9 : n[0] >= 50 ? n[0] * 0.95 : n[0]];
    case 10: return Array.from({ length: Math.max(0, n[0]) }, (_, i) => i + 1);
    case 11: return Array.from({ length: Math.max(0, n[0]) }, (_, i) => n[0] - i).filter(value => value >= 1);
    case 12: return Array.from({ length: 5 }, (_, i) => n[0] * (i + 1));
    case 13: return Array.from({ length: Math.max(0, Math.floor(n[0] / 2)) }, (_, i) => 2 * (i + 1));
    case 14: return [n[0] * (n[0] + 1) / 2];
    case 15: return [sum(Array.from({ length: Math.max(0, Math.floor(n[0] / 2)) }, (_, i) => 2 * (i + 1)))];
    case 16: return [Math.max(0, Math.floor(n[0] / 3))];
    case 17: return [n.slice(0, 5).filter(value => value > 0).length, n.slice(0, 5).filter(value => value < 0).length];
    case 18: return [sum(n.slice(0, 5)) / 5];
    case 19: {
      const accepted = n.find(value => value >= 0 && value <= 5);
      return [accepted];
    }
    case 20: {
      const stop = n.indexOf(0);
      return [sum(stop < 0 ? n : n.slice(0, stop))];
    }
    case 21: {
      let result = 1;
      for (let i = 2; i <= n[0]; i++) result *= i;
      return [result];
    }
    case 22: return [Math.pow(n[0], n[1])];
    case 23: {
      const values = [0, 1];
      while (values[values.length - 1] + values[values.length - 2] <= 40) {
        values.push(values[values.length - 1] + values[values.length - 2]);
      }
      return values;
    }
    case 24: return [Math.max(...n.slice(0, 10))];
    case 25: return [n.slice(0, n.indexOf(7) + 1).length];
    case 26: {
      const [value, position] = maxFirst(n.slice(0, 5));
      return [value, position];
    }
    case 27: return [Math.max(...n.slice(0, 5)), Math.min(...n.slice(0, 5))];
    case 28: {
      const averages = [];
      for (let i = 0; i < 5; i++) averages.push(sum(n.slice(i * 6, i * 6 + 6)) / 6);
      return averages;
    }
    case 29: {
      const stop = n.findIndex(value => value < 0);
      return [stop < 0 ? n.length : stop];
    }
    case 30: {
      const value = n.find(item => item >= 1 && item <= 10);
      return Array.from({ length: 5 }, (_, i) => value * (i + 1));
    }
    case 31: return [sum(n.slice(0, 30)) / 30];
    case 32: {
      const values = [];
      for (let row = 1; row <= 3; row++) for (let col = 1; col <= 3; col++) values.push(row * col);
      return values;
    }
    case 33: {
      let index = 0;
      let goal = n[index++];
      while (goal <= 0) goal = n[index++];
      let total = 0, deposits = 0;
      while (total < goal) {
        const deposit = n[index++];
        if (deposit > 0) { total += deposit; deposits++; }
      }
      return [deposits, total];
    }
    case 34: {
      const count = n[0], values = n.slice(1, 1 + count);
      const [maximum, maxPosition] = maxFirst(values);
      const [minimum, minPosition] = minFirst(values);
      return [maximum, maxPosition, minimum, minPosition];
    }
    case 35: {
      const count = n[0], values = n.slice(1, 1 + count);
      const positives = values.filter(value => value > 0);
      return [sum(positives), positives.length ? sum(positives) / positives.length : "Sin positivos",
        values.filter(value => value < 0).length, values.filter(value => value === 0).length];
    }
    case 36: {
      const count = n[0], values = n.slice(1, 1 + count);
      return [sum(values) / count, values.filter(value => value >= 3).length,
        values.filter(value => value < 3).length, Math.max(...values)];
    }
    case 37: {
      const stop = n.indexOf(0), values = stop < 0 ? n : n.slice(0, stop);
      return [sum(values), values.length, values.length ? sum(values) / values.length : "Sin datos",
        values.filter(value => value > 0).length, values.filter(value => value < 0).length];
    }
    case 38: {
      const values = [];
      for (let table = 1; table <= n[0]; table++) for (let factor = 1; factor <= 10; factor++) values.push(table * factor);
      return values;
    }
    case 39: {
      const averages = [];
      let passed = 0, failed = 0;
      for (let subject = 0; subject < 5; subject++) {
        const average = sum(n.slice(subject * 6, subject * 6 + 6)) / 6;
        averages.push(average);
        for (const grade of n.slice(subject * 6, subject * 6 + 6)) {
          if (grade >= 3) passed++; else failed++;
        }
      }
      return [...averages, sum(n.slice(0, 30)) / 30, passed, failed];
    }
    case 40: {
      const reference = n[0], count = n[1], values = n.slice(2, 2 + count);
      const greater = values.filter(value => value > reference);
      return [greater.length, values.filter(value => value < reference).length,
        values.filter(value => value === reference).length, sum(greater)];
    }
    case 41: {
      let a=n[0],b=n[1],iterations=0;
      const A=a,B=b;
      while(a!==b){if(a>b)a-=b;else b-=a;iterations++;}
      return [a,(A/a)*B,iterations];
    }
    case 42: {
      const value=n[0],divisors=[];
      for(let d=1;d<value;d++)if(value/d===Math.floor(value/d))divisors.push(d);
      return [divisors.length===1?"PRIMO":"COMPUESTO",divisors.length,sum(divisors)];
    }
    case 43: {
      const [a,b,c,d,e,f,g,h,i,r,s,t]=n;
      const det=(a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g));
      if(det===0)return ["SISTEMA SINGULAR"];
      const dx=r*(e*i-f*h)-b*(s*i-f*t)+c*(s*h-e*t);
      const dy=a*(s*i-f*t)-r*(d*i-f*g)+c*(d*t-s*g);
      const dz=a*(e*t-s*h)-b*(d*t-s*g)+r*(d*h-e*g);
      return [det,dx/det,dy/det,dz/det];
    }
    case 44: {
      let x=n[0],tol=n[1],max=n[2],delta=tol+1,der=3*x*x-2,k=0;
      while((delta>tol||delta< -tol)&&k<max&&der!==0){
        const fx=x*x*x-2*x-5,nuevo=x-fx/der;
        delta=nuevo-x;x=nuevo;der=3*x*x-2;k++;
      }
      return [x,x*x*x-2*x-5,k];
    }
    case 45: {
      const [a,b,count]=n;
      if(count%2!==0)return ["N DEBE SER PAR"];
      const h=(b-a)/count;
      let total=1/(1+a*a)+1/(1+b*b),weight=4;
      for(let k=1;k<count;k++){
        const x=a+k*h;
        total+=weight/(1+x*x);
        weight=weight===4?2:4;
      }
      const integral=h/3*total;
      return a===0&&b===1?[integral,Math.abs(integral-Math.PI/4)]:[integral];
    }
    default: throw new Error("No existe oráculo para el ejercicio " + id);
  }
}

function assertOutput(actual, expected, context) {
  assert.equal(actual.length, expected.length, context + ": cantidad de salidas");
  for (let i = 0; i < expected.length; i++) {
    if (typeof expected[i] === "number") {
      assert.equal(typeof actual[i], "number", context + ": tipo de salida " + i);
      assert.ok(Math.abs(actual[i] - expected[i]) < 1e-9,
        context + ": salida " + i + " (esperada " + expected[i] + ", calculada " + actual[i] + ")");
    } else {
      assert.equal(actual[i], expected[i], context + ": salida " + i);
    }
  }
}

test("cada resultado esperado de los 45 ejercicios coincide con un cálculo independiente", async t => {
  let scenarios = 0;
  for (const item of exercises) {
    for (const method of item.methods) {
      for (const scenario of method.tests) {
        await t.test("E" + item.id + " · " + method.name + " · " + scenario.name, () => {
          const actual = referenceOutput(item.id, scenario.input);
          assertOutput(actual, scenario.expected, "E" + item.id + " / " + scenario.name);
        });
        scenarios++;
      }
    }
  }
  assert.ok(scenarios >= 170, "Se deben comprobar al menos 170 escenarios por método.");
});
