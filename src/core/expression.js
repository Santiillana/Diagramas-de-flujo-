export class ExpressionSyntaxError extends Error {
  constructor(message, position = 0) {
    super(message);
    this.name = "ExpressionSyntaxError";
    this.position = position;
  }
}

function tokenize(source) {
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) { i++; continue; }
    const rest = source.slice(i);
    const number = /^(?:\d+(?:\.\d*)?|\.\d+)/.exec(rest);
    if (number) {
      tokens.push({ type:"number", value:Number(number[0]), raw:number[0], position:i });
      i += number[0].length;
      continue;
    }
    if (ch === '"') {
      const start = i++;
      let value = "";
      let closed = false;
      while (i < source.length) {
        if (source[i] === "\\") {
          const next = source[i + 1];
          if (next === undefined) break;
          const escapes = { n:"\n", r:"\r", t:"\t", '"':'"', "\\":"\\" };
          value += escapes[next] ?? next;
          i += 2;
        } else if (source[i] === '"') {
          i++;
          closed = true;
          break;
        } else {
          value += source[i++];
        }
      }
      if (!closed) throw new ExpressionSyntaxError("Cadena de texto sin comillas de cierre.", start);
      tokens.push({ type:"string", value, raw:source.slice(start,i), position:start });
      continue;
    }
    const identifier = /^[A-Za-z_][A-Za-z0-9_]*/.exec(rest);
    if (identifier) {
      const raw = identifier[0];
      const upper = raw.toUpperCase();
      tokens.push({ type:["Y","O","NO"].includes(upper)?"operator":"identifier", value:upper, raw, position:i });
      i += raw.length;
      continue;
    }
    const op = ["<=",">=","<>","!=","=="].find(candidate=>rest.startsWith(candidate));
    if (op) {
      tokens.push({ type:"operator", value:op, raw:op, position:i });
      i += op.length;
      continue;
    }
    if ("()+-*/<>= ".includes(ch) && ch !== " ") {
      tokens.push({ type:ch==="("||ch===")"?"punctuation":"operator", value:ch, raw:ch, position:i });
      i++;
      continue;
    }
    throw new ExpressionSyntaxError("Carácter no permitido en la expresión: "+ch, i);
  }
  tokens.push({ type:"eof", value:"", raw:"", position:source.length });
  return tokens;
}

export function parseExpression(source) {
  if (typeof source !== "string" || !source.trim()) {
    throw new ExpressionSyntaxError("La expresión está vacía.");
  }
  const tokens = tokenize(source);
  let index = 0;
  const current = () => tokens[index];
  const take = () => tokens[index++];
  const match = value => current().value === value;
  const expect = value => {
    if (!match(value)) throw new ExpressionSyntaxError("Se esperaba '"+value+"'.", current().position);
    return take();
  };
  const primary = () => {
    const token = current();
    if (token.type === "number" || token.type === "string") {
      take();
      return { type:"literal", value:token.value, raw:token.raw, position:token.position };
    }
    if (token.type === "identifier") {
      take();
      return { type:"identifier", name:token.raw, position:token.position };
    }
    if (match("(")) {
      take();
      const value = parseOr();
      expect(")");
      return value;
    }
    throw new ExpressionSyntaxError("Se esperaba un número, variable o paréntesis.", token.position);
  };
  const unary = () => {
    if (match("+") || match("-")) {
      const operator = take();
      return { type:"unary", operator:operator.value, argument:unary(), position:operator.position };
    }
    return primary();
  };
  const multiplicative = () => {
    let node = unary();
    while (match("*") || match("/")) {
      const operator = take();
      node = { type:"binary", operator:operator.value, left:node, right:unary(), position:operator.position };
    }
    return node;
  };
  const additive = () => {
    let node = multiplicative();
    while (match("+") || match("-")) {
      const operator = take();
      node = { type:"binary", operator:operator.value, left:node, right:multiplicative(), position:operator.position };
    }
    return node;
  };
  const comparison = () => {
    let node = additive();
    while (["<","<=",">",">=","=","==","<>","!="].includes(current().value)) {
      const operator = take();
      node = { type:"binary", operator:operator.value, left:node, right:additive(), position:operator.position };
    }
    return node;
  };
  const logicalNot = () => {
    if (match("NO")) {
      const operator = take();
      return { type:"unary", operator:"NO", argument:logicalNot(), position:operator.position };
    }
    return comparison();
  };
  const logicalAnd = () => {
    let node = logicalNot();
    while (match("Y")) {
      const operator = take();
      node = { type:"binary", operator:"Y", left:node, right:logicalNot(), position:operator.position };
    }
    return node;
  };
  const parseOr = () => {
    let node = logicalAnd();
    while (match("O")) {
      const operator = take();
      node = { type:"binary", operator:"O", left:node, right:logicalAnd(), position:operator.position };
    }
    return node;
  };
  const ast = parseOr();
  if (current().type !== "eof") {
    throw new ExpressionSyntaxError("Texto inesperado después de la expresión: "+current().raw, current().position);
  }
  return ast;
}

function requireNumber(value, operator) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError("El operador "+operator+" requiere valores numéricos.");
  }
  return value;
}
function requireBoolean(value, operator) {
  if (typeof value !== "boolean") {
    throw new TypeError("El operador "+operator+" requiere una condición verdadera o falsa.");
  }
  return value;
}

export function evaluateExpression(astOrSource, variables = {}) {
  const ast = typeof astOrSource === "string" ? parseExpression(astOrSource) : astOrSource;
  const visit = node => {
    if (node.type === "literal") return node.value;
    if (node.type === "identifier") {
      if (!Object.hasOwn(variables,node.name)) {
        throw new ReferenceError("La variable '"+node.name+"' todavía no tiene un valor.");
      }
      return variables[node.name];
    }
    if (node.type === "unary") {
      const value = visit(node.argument);
      if (node.operator === "+") return requireNumber(value,"+");
      if (node.operator === "-") return -requireNumber(value,"-");
      if (node.operator === "NO") return !requireBoolean(value,"NO");
      throw new TypeError("Operador unario desconocido: "+node.operator);
    }
    if (node.type !== "binary") throw new TypeError("Nodo de expresión inválido.");
    const left = visit(node.left);
    if (node.operator === "Y") {
      return requireBoolean(left,"Y") && requireBoolean(visit(node.right),"Y");
    }
    if (node.operator === "O") {
      return requireBoolean(left,"O") || requireBoolean(visit(node.right),"O");
    }
    const right = visit(node.right);
    switch (node.operator) {
      case "+": return requireNumber(left,"+") + requireNumber(right,"+");
      case "-": return requireNumber(left,"-") - requireNumber(right,"-");
      case "*": return requireNumber(left,"*") * requireNumber(right,"*");
      case "/":
        requireNumber(left,"/");
        requireNumber(right,"/");
        if (right === 0) throw new RangeError("No se puede dividir entre cero.");
        return left / right;
      case "<": return requireNumber(left,"<") < requireNumber(right,"<");
      case "<=": return requireNumber(left,"<=") <= requireNumber(right,"<=");
      case ">": return requireNumber(left,">") > requireNumber(right,">");
      case ">=": return requireNumber(left,">=") >= requireNumber(right,">=");
      case "=":
      case "==": return left === right;
      case "<>":
      case "!=": return left !== right;
      default: throw new TypeError("Operador desconocido: "+node.operator);
    }
  };
  const result = visit(ast);
  if (typeof result === "number" && !Number.isFinite(result)) {
    throw new RangeError("La operación produjo un valor numérico no finito.");
  }
  return result;
}
