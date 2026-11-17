const gcd = (a, b) => {
  a = a < 0n ? -a : a; b = b < 0n ? -b : b;
  while (b) [a, b] = [b, a % b];
  return a || 1n;
};

export function rational(numerator, denominator = 1n) {
  let n = BigInt(numerator), d = BigInt(denominator);
  if (!d) throw new RangeError("El denominador no puede ser cero.");
  if (d < 0n) { n = -n; d = -d; }
  const divisor = gcd(n, d);
  return Object.freeze({ n: n / divisor, d: d / divisor });
}

export const add = (a, b) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
export const subtract = (a, b) => rational(a.n * b.d - b.n * a.d, a.d * b.d);
export const multiply = (a, b) => rational(a.n * b.n, a.d * b.d);
export const divide = (a, b) => {
  if (!b.n) throw new RangeError("No se puede dividir entre cero.");
  return rational(a.n * b.d, a.d * b.n);
};
export const compare = (a, b) => {
  const difference = a.n * b.d - b.n * a.d;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
};
export const formatRational = value => {
  const numerator = value.n < 0n ? `−${formatInteger(-value.n)}` : formatInteger(value.n);
  return value.d === 1n ? numerator : `${numerator}/${formatInteger(value.d)}`;
};
export const formatInteger = value => new Intl.NumberFormat("es-CO").format(value);
export const formatSignedInteger = value => value < 0 ? `−${formatInteger(-value)}` : formatInteger(value);

export function formatDecimalOrRational(value) {
  let denominator = value.d, twos = 0, fives = 0;
  while (denominator % 2n === 0n) { denominator /= 2n; twos++; }
  while (denominator % 5n === 0n) { denominator /= 5n; fives++; }
  if (denominator !== 1n) return formatRational(value);
  const places = Math.max(twos, fives);
  if (!places) return formatRational(value);
  const scale = 10n ** BigInt(places), scaled = value.n * scale / value.d;
  const negative = scaled < 0n, absolute = negative ? -scaled : scaled;
  const whole = absolute / scale, fraction = String(absolute % scale).padStart(places,"0").replace(/0+$/," ").trim();
  return `${negative?"−":""}${formatInteger(whole)}${fraction?","+fraction:""}`;
}

export class MathExpressionError extends Error {
  constructor(message, position=0) { super(message); this.name="MathExpressionError"; this.position=position; }
}

function tokenizeMath(source) {
  const text=String(source??"").replace(/[−–]/g,"-").replace(/[×·]/g,"*").replace(/÷/g,"/").replace(/[\[\]]/g,ch=>ch==="["?"(":")");
  const tokens=[];let i=0;
  while(i<text.length){
    if(/\s/.test(text[i])){i++;continue;}
    const number=/^(?:\d+(?:\.\d+)?|\.\d+)/.exec(text.slice(i));
    if(number){tokens.push({type:"number",raw:number[0],start:i,end:i+number[0].length});i+=number[0].length;continue;}
    const ch=text[i];
    if("+-*/()".includes(ch)){tokens.push({type:ch==="("||ch===")"?"paren":"operator",raw:ch,start:i,end:i+1});i++;continue;}
    throw new MathExpressionError(`Carácter no permitido: «${ch}».`,i);
  }
  if(!tokens.length)throw new MathExpressionError("Escribe una expresión matemática.");
  const expanded=[];
  for(const token of tokens){
    const previous=expanded.at(-1);
    if(previous&&["number",")"].includes(previous.type==="paren"?previous.raw:previous.type)&&["number","("].includes(token.type==="paren"?token.raw:token.type)){
      expanded.push({type:"operator",raw:"·",start:previous.end,end:token.start,implicit:true});
    }
    expanded.push(token);
  }
  expanded.push({type:"eof",raw:"",start:text.length,end:text.length});
  return {tokens:expanded,text};
}

export function parseMathExpression(source) {
  const {tokens,text}=tokenizeMath(source);let index=0;
  const peek=()=>tokens[index],take=()=>tokens[index++];
  const primary=()=>{
    const token=peek();
    if(token.type==="number"){
      take();const [whole,decimal=""]=token.raw.split(".");
      const scale=10n**BigInt(decimal.length),numerator=BigInt((whole||"0")+decimal);
      return {type:"rational",value:rational(numerator,scale),start:token.start,end:token.end};
    }
    if(token.raw==="("){take();const node=expression();if(peek().raw!==")")throw new MathExpressionError("Falta cerrar el paréntesis.",peek().start);const end=take();node.start=token.start;node.end=end.end;return node;}
    throw new MathExpressionError("Se esperaba un número o una agrupación.",token.start);
  };
  const unary=()=>peek().raw==="+"||peek().raw==="-"?(()=>{const op=take(),argument=unary();return {type:"unary",operator:op.raw,argument,start:op.start,end:argument.end};})():primary();
  const product=()=>{let node=unary();while(["*","/","·"].includes(peek().raw)){const op=take(),right=unary();node={type:"binary",operator:op.raw==="·"?"*":op.raw,left:node,right,start:node.start,end:right.end,implicit:op.implicit};}return node;};
  const expression=()=>{let node=product();while(["+","-"].includes(peek().raw)){const op=take(),right=product();node={type:"binary",operator:op.raw,left:node,right,start:node.start,end:right.end};}return node;};
  const ast=expression();if(peek().type!=="eof")throw new MathExpressionError(`Símbolo inesperado: «${peek().raw}».`,peek().start);
  return {ast,source:text};
}

function evaluateMathNode(node,steps,source) {
  if(node.type==="rational")return node.value;
  if(node.type==="unary"){
    const value=evaluateMathNode(node.argument,steps,source),result=node.operator==="-"?rational(-value.n,value.d):value;
    steps.push({operator:node.operator,expression:source.slice(node.start,node.end),left:formatRational(value),result:formatRational(result),start:node.start,end:node.end});return result;
  }
  const left=evaluateMathNode(node.left,steps,source),right=evaluateMathNode(node.right,steps,source);
  let result;try{result=node.operator==="+"?add(left,right):node.operator==="-"?subtract(left,right):node.operator==="*"?multiply(left,right):divide(left,right);}
  catch(error){if(error instanceof RangeError)throw new MathExpressionError(error.message,node.right.start);throw error;}
  steps.push({operator:node.operator,expression:source.slice(node.start,node.end),left:formatRational(left),right:formatRational(right),result:formatRational(result),start:node.start,end:node.end});
  return result;
}

export function evaluateMathExpression(source) {
  const {ast,source:normalized}=parseMathExpression(source),steps=[];
  const value=evaluateMathNode(ast,steps,normalized);
  return {value,steps,formatted:formatRational(value)};
}

export function parseRationalAnswer(input) {
  let text=String(input??"").trim().replace(/^\$\s*/,"").replace(/[−–]/g,"-").replace(/\s+/g,"");
  const fraction=/^([+-]?\d+)\/([+-]?\d+)$/.exec(text);
  if(fraction)return rational(BigInt(fraction[1]),BigInt(fraction[2]));
  if(!/^[+-]?(?:(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?|,\d+)$/.test(text)){
    throw new MathExpressionError("Escribe un número o una fracción, por ejemplo −3/7.");
  }
  const normalized=text.replaceAll(".","").replace(",","."),negative=normalized.startsWith("-"),unsigned=normalized.replace(/^[+-]/,"");
  const [whole,decimal=""]=unsigned.split("."),scale=10n**BigInt(decimal.length);
  const numerator=BigInt((whole||"0")+decimal)*(negative?-1n:1n);
  return rational(numerator,scale);
}

export function solveDirectRule(a, b, c) {
  return divide(multiply(rational(b), rational(c)), rational(a));
}
export function solveInverseRule(a, b, c) {
  return divide(multiply(rational(a), rational(b)), rational(c));
}
