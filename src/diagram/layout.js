const WIDTH = 240;
const HEIGHT = 56;
const DECISION_HEIGHT = 84;
const FOR_HEIGHT = 64;
const VERTICAL_GAP = 40;
const BRANCH_GAP = 260;
const VIEWBOX_MARGIN = 40;

const labelFor = node => {
  if (node.type === "input") return "Leer " + node.variables.join(", ");
  if (node.type === "output") return "Imprimir " + node.expression;
  if (node.type === "assignment") return node.variable + " = " + node.expression;
  if (node.type === "if" || node.type === "while" || node.type === "doWhile") return node.condition;
  if (node.type === "for") return "Para " + node.initial.variable + "=" + node.initial.value + "; " +
    node.condition + "; " + node.update.variable + (node.update.operator ?? "");
  return node.source;
};

export function layoutFlow(program) {
  const nodes = [], edges = [], byId = new Map();
  let synthetic = 0;

  const addNode = (id, type, label, x, y, line = null, source = "", statement = null) => {
    const decision = ["if", "while", "doWhile"].includes(type);
    const node = {
      id: String(id), sourceId: typeof id === "number" ? id : null, type, label, x, y,
      width: type === "merge" ? 28 : WIDTH,
      height: type === "merge" ? 28 : decision ? DECISION_HEIGHT : type === "for" ? FOR_HEIGHT : HEIGHT,
      line, source,
      forParts: type === "for" ? [
        statement.initial.variable + "=" + statement.initial.value,
        statement.condition,
        statement.update.variable + (statement.update.operator ?? "")
      ] : null
    };
    nodes.push(node); byId.set(node.id, node); return node;
  };
  const connect = (from, to, label = "", kind = "flow") => {
    if (from && to) edges.push({ id: "edge-" + edges.length, from: String(from), to: String(to), label, kind });
  };
  const mergeNode = (x, y) => addNode("merge-" + (++synthetic), "merge", "Continuar", x, y);

  const place = (statements, x, y, incoming = null) => {
    let previous = incoming, first = null, cursorY = y;
    for (const statement of statements) {
      if (["input", "output", "assignment"].includes(statement.type)) {
        const node = addNode(statement.id, statement.type, labelFor(statement), x, cursorY, statement.line, statement.source, statement);
        if (!first) first = node.id;
        connect(previous, node.id); previous = node.id; cursorY += HEIGHT + VERTICAL_GAP; continue;
      }
      if (statement.type === "if") {
        const decision = addNode(statement.id, "if", labelFor(statement), x, cursorY, statement.line, statement.source, statement);
        if (!first) first = decision.id;
        connect(previous, decision.id);
        const branchY = cursorY + DECISION_HEIGHT + VERTICAL_GAP;
        const yes = place(statement.thenBody, x - BRANCH_GAP / 2, branchY);
        const no = place(statement.elseBody, x + BRANCH_GAP / 2, branchY);
        if (yes.entry) connect(decision.id, yes.entry, "V", "true");
        if (no.entry) connect(decision.id, no.entry, "F", "false");
        const joinY = Math.max(branchY + HEIGHT, yes.bottom, no.bottom) + VERTICAL_GAP;
        const join = mergeNode(x, joinY);
        connect(yes.exit ?? decision.id, join.id, "", "merge");
        connect(no.exit ?? decision.id, join.id, "", "merge");
        previous = join.id; cursorY = joinY + 28 + VERTICAL_GAP; continue;
      }
      if (statement.type === "while" || statement.type === "for") {
        const loop = addNode(statement.id, statement.type, labelFor(statement), x, cursorY, statement.line, statement.source, statement);
        if (!first) first = loop.id;
        connect(previous, loop.id);
        const bodyY = cursorY + loop.height + VERTICAL_GAP;
        const body = place(statement.body, x, bodyY);
        if (body.entry) connect(loop.id, body.entry, "V", "true");
        if (body.exit) connect(body.exit, loop.id, "", "back");
        const joinY = Math.max(bodyY + HEIGHT, body.bottom) + VERTICAL_GAP;
        const join = mergeNode(x + BRANCH_GAP / 2, joinY);
        connect(loop.id, join.id, "F", "false");
        previous = join.id; cursorY = joinY + 28 + VERTICAL_GAP; continue;
      }
      if (statement.type === "doWhile") {
        const bodyY = cursorY + HEIGHT + VERTICAL_GAP;
        const bodyStart = addNode("body-" + statement.id, "body", "Ejecutar cuerpo", x, bodyY, statement.line, statement.source);
        if (!first) first = bodyStart.id;
        connect(previous, bodyStart.id);
        const body = place(statement.body, x, bodyY + HEIGHT + VERTICAL_GAP, bodyStart.id);
        const checkY = Math.max(bodyY + HEIGHT + VERTICAL_GAP, body.bottom) + VERTICAL_GAP;
        const decision = addNode(statement.id, "doWhile", labelFor(statement), x, checkY,
          statement.conditionLine ?? statement.line, "hm " + statement.condition, statement);
        connect(body.exit ?? bodyStart.id, decision.id); connect(decision.id, bodyStart.id, "V", "back");
        const join = mergeNode(x + BRANCH_GAP / 2, checkY + DECISION_HEIGHT + VERTICAL_GAP);
        connect(decision.id, join.id, "F", "false");
        previous = join.id; cursorY = join.y + 28 + VERTICAL_GAP;
      }
    }
    return { entry: first, exit: previous, bottom: cursorY };
  };

  const start = addNode("start", "terminal", "Inicio", 520, 40);
  const body = place(program.body, 520, 40 + HEIGHT + VERTICAL_GAP, start.id);
  const endY = Math.max(body.bottom + VERTICAL_GAP, 40 + HEIGHT + VERTICAL_GAP * 2);
  const end = addNode("end", "terminal", "Fin", 520, endY);
  connect(body.exit ?? start.id, end.id);

  let minX = Math.min(...nodes.map(node => node.x - node.width / 2));
  const minY = Math.min(...nodes.map(node => node.y));
  let maxX = Math.max(...nodes.map(node => node.x + node.width / 2));
  const maxY = Math.max(...nodes.map(node => node.y + node.height));
  for (const edge of edges) {
    if (edge.kind === "back") {
      const from = byId.get(edge.from), to = byId.get(edge.to);
      if (from && to) minX = Math.min(minX, Math.min(from.x, to.x) - 100);
    }
  }
  const offsetX = VIEWBOX_MARGIN - minX, offsetY = VIEWBOX_MARGIN - minY;
  for (const node of nodes) { node.x += offsetX; node.y += offsetY; }
  return {
    nodes, edges, byId,
    width: Math.ceil(maxX + offsetX - VIEWBOX_MARGIN + VIEWBOX_MARGIN * 2),
    height: Math.ceil(maxY + offsetY - VIEWBOX_MARGIN + VIEWBOX_MARGIN * 2),
    startId: start.id, endId: end.id,
    bounds: { minX: VIEWBOX_MARGIN, minY: VIEWBOX_MARGIN, maxX: maxX + offsetX, maxY: maxY + offsetY }
  };
}
