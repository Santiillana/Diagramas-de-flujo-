import { toSceneEvent } from "./scene-event.js";
import * as terminal from "./terminal.js";
import * as input from "./input.js";
import * as process from "./process.js";
import * as output from "./output.js";
import * as decision from "./decision.js";
import * as loopFor from "./loop-for.js";
import * as loopWhile from "./loop-while.js";
import * as loopDoWhile from "./loop-do-while.js";
import * as loopIteration from "./loop-iteration.js";
import * as loopExit from "./loop-exit.js";
import * as failure from "./failure.js";
import { escapeHTML } from "./common.js";

const renderers = {
  start:terminal.render,end:terminal.render,
  input:input.render,process:process.render,output:output.render,
  decision:decision.render,"for-init":loopFor.render,"for-cond":loopFor.render,"for-step":loopFor.render,
  "while-cond":loopWhile.render,"dowhile-cond":loopDoWhile.render,
  "loop-iteration":loopIteration.render,"loop-exit":loopExit.render,
  failure:failure.render
};

export function renderScene(event, context = {}) {
  const model = event?.kind ? event : toSceneEvent(event,context);
  const renderer = renderers[model.kind] ?? process.render;
  const markup = renderer(model);
  const title = model.scene?.title ?? "Paso del algoritmo";
  const body = model.scene?.body ?? model.failure?.message ?? model.sourceText ?? "";
  const alt = [title,body,model.expression,model.variable,model.next].filter(value=>value !== null && value !== undefined && value !== "").join(". ");
  return {model,markup,alt:escapeHTML(alt)};
}