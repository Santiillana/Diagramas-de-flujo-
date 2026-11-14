import { parseExpression } from "./expression.js";

export class PseudocodeSyntaxError extends SyntaxError {
  constructor(message, line = 1, sourceText = "") {
    super(message+" (línea "+line+").");
    this.name = "PseudocodeSyntaxError";
    this.line = line;
    this.sourceText = sourceText;
  }
}

const assignmentPattern = /^([A-Za-z_][A-Za-z0-9_]*)\s*=(?!=)\s*(.+)$/;

function validateExpression(source,line,sourceText) {
  try { return parseExpression(source); }
  catch (error) { throw new PseudocodeSyntaxError(error.message,line,sourceText); }
}
function parseAssignment(source,line,sourceText) {
  const match = assignmentPattern.exec(source.trim());
  if (!match) throw new PseudocodeSyntaxError("Asignación inválida; usa nombre = expresión.",line,sourceText);
  return {
    variable:match[1],
    expression:match[2].trim(),
    expressionAst:validateExpression(match[2].trim(),line,sourceText)
  };
}
function parseUpdate(source,line,sourceText) {
  const text = source.trim();
  const increment = /^([A-Za-z_][A-Za-z0-9_]*)(\+\+|--)$/.exec(text);
  if (increment) return { variable:increment[1], operator:increment[2], kind:"step" };
  const assignment = parseAssignment(text,line,sourceText);
  return { ...assignment, kind:"assignment" };
}
function isStop(line, stops) {
  if (!line) return null;
  if (stops.has(line.text)) return line.text;
  if ([...stops].some(stop=>stop==="hm"&&/^hm\s+/.test(line.text))) return "hm";
  return null;
}

export function parsePseudocode(source) {
  if (typeof source !== "string" || !source.trim()) {
    throw new PseudocodeSyntaxError("El pseudocódigo está vacío.",1,"");
  }
  const lines = source.split("|").map((text,index)=>({ text:text.trim(), line:index+1 })).filter(item=>item.text);
  let index = 0;
  let nextId = 1;
  const current = () => lines[index];
  const consume = () => lines[index++];
  const syntax = (message,line=current()) => {
    throw new PseudocodeSyntaxError(message,line?.line??lines.length+1,line?.text??"");
  };
  const parseBlock = (stops = new Set()) => {
    const body = [];
    while (index < lines.length) {
      const line = current();
      if (isStop(line,stops)) break;
      const text = line.text;
      if (text === "fin" || text === "sino" || /^hm\b/.test(text)) {
        syntax("Cierre inesperado: "+text,line);
      }
      consume();
      const node = { id:nextId++, line:line.line, source:text };
      let match;
      if ((match=/^leer\s+(.+)$/.exec(text))) {
        const variables = match[1].split(",").map(name=>name.trim());
        if (!variables.length || variables.some(name=>!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name))) {
          syntax("La instrucción Leer necesita nombres de variables separados por comas.",line);
        }
        Object.assign(node,{type:"input",variables});
      } else if ((match=/^imp\s+(.+)$/.exec(text))) {
        const expression = match[1].trim();
        Object.assign(node,{type:"output",expression,expressionAst:validateExpression(expression,line.line,text)});
      } else if ((match=/^si\s+(.+)$/.exec(text))) {
        const condition = match[1].trim();
        node.type = "if";
        node.condition = condition;
        node.conditionAst = validateExpression(condition,line.line,text);
        node.thenBody = parseBlock(new Set(["sino","fin"]));
        node.elseBody = [];
        if (current()?.text === "sino") {
          consume();
          node.elseBody = parseBlock(new Set(["fin"]));
        }
        if (current()?.text !== "fin") syntax("La decisión Si necesita su cierre fin.",line);
        consume();
      } else if ((match=/^mientras\s+(.+)$/.exec(text))) {
        const condition = match[1].trim();
        node.type = "while";
        node.condition = condition;
        node.conditionAst = validateExpression(condition,line.line,text);
        node.body = parseBlock(new Set(["fin"]));
        if (current()?.text !== "fin") syntax("El ciclo Mientras necesita su cierre fin.",line);
        consume();
      } else if ((match=/^para\s+(.+)$/.exec(text))) {
        const parts = match[1].split(";").map(part=>part.trim());
        if (parts.length !== 3) syntax("Para necesita preparación;condición;avance.",line);
        node.type = "for";
        node.initial = parseAssignment(parts[0],line.line,text);
        node.condition = parts[1];
        node.conditionAst = validateExpression(parts[1],line.line,text);
        node.update = parseUpdate(parts[2],line.line,text);
        node.body = parseBlock(new Set(["fin"]));
        if (current()?.text !== "fin") syntax("El ciclo Para necesita su cierre fin.",line);
        consume();
      } else if (text === "hacer") {
        node.type = "doWhile";
        node.body = parseBlock(new Set(["hm"]));
        const terminator = current();
        if (!terminator || !/^hm\s+/.test(terminator.text)) {
          syntax("Hacer necesita una condición final hm condición.",line);
        }
        consume();
        node.condition = terminator.text.replace(/^hm\s+/,"").trim();
        node.conditionLine = terminator.line;
        node.conditionAst = validateExpression(node.condition,terminator.line,terminator.text);
      } else if ((match=assignmentPattern.exec(text))) {
        node.type = "assignment";
        Object.assign(node,parseAssignment(text,line.line,text));
      } else {
        syntax("Instrucción no reconocida. Revisa Leer, Imp, asignación, Si, Para, Mientras o Hacer.",line);
      }
      body.push(node);
    }
    return body;
  };
  const body = parseBlock();
  if (index < lines.length) syntax("Cierre inesperado: "+current().text,current());
  return { type:"program", body, source, lines:lines.map(line=>({...line})) };
}

export function flattenPseudocode(program) {
  const rows = [];
  const walk = nodes => {
    for (const node of nodes) {
      rows.push({ id:node.id, line:node.line, source:node.source, type:node.type });
      if (node.type === "if") { walk(node.thenBody); walk(node.elseBody); }
      if (["for","while","doWhile"].includes(node.type)) walk(node.body);
    }
  };
  walk(program.body);
  return rows;
}
