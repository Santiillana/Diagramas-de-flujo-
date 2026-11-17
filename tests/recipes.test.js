import test from "node:test";
import assert from "node:assert/strict";
import { lessonRecipe, recipeFrame, recipeMoment, recipeSceneMarkup } from "../src/ui/kit/recipes.js";

test("las lecciones 01 a 15 tienen recetas visuales propias y completas",()=>{
  const ids=["algorithm","reading","terminals","input","process","output","variables","arithmetic","comparisons","decisions","nested-decisions","counters-accumulators","for","while","do-while"];
  const recipes=ids.map(id=>lessonRecipe(id));
  assert.equal(new Set(recipes.map(item=>item.id)).size,ids.length);
  for(const recipe of recipes){
    assert.ok(recipe.idea&&recipe.term&&recipe.cierre);
    assert.ok(recipe.moments.length>=3&&recipe.moments.length<=5);
    assert.ok(recipe.figures.length>=3);
    const svg=recipeSceneMarkup(recipe,0);
    assert.match(svg,/<svg/);
    assert.match(svg,/recipe-guide/);
    assert.match(svg,/recipe-order/);
    assert.doesNotMatch(svg,/<script|foreignObject/i);
    if(recipe.choices){assert.match(svg,/Sí ✓/);assert.match(svg,/No ✗/);}
    if(recipe.loopPartByMoment)assert.match(recipeSceneMarkup(recipe,0,2),/class="is-active"/);
  }
});

test("el reproductor mapea los eventos del motor a momentos de receta en orden",()=>{
  const recipe=lessonRecipe("algorithm");
  assert.equal(recipeFrame(recipe,0,5),0);
  assert.equal(recipeFrame(recipe,4,5),recipe.figures.length-1);
  assert.equal(recipeMoment(recipe,0,5),recipe.moments[0]);
  assert.equal(recipeMoment(recipe,4,5),recipe.moments.at(-1));
});
