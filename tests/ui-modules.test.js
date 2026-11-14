import test from "node:test";
import assert from "node:assert/strict";

const modules=[
  ["navigation","../src/ui/navigation.js","initNavigation"],
  ["preferences","../src/ui/preferences.js","initPreferences"],
  ["content","../src/ui/content-view.js","initContentViews"],
  ["simulator","../src/ui/simulator.js","initSimulator"],
  ["lab","../src/ui/lab.js","initLab"],
  ["builder","../src/ui/builder.js","initBuilder"]
];

for(const [name,path,exportName] of modules){
  test("el módulo de interfaz "+name+" se importa sin ejecutar el DOM",async()=>{
    let module;
    try{module=await import(path);}
    catch(error){throw new Error("Error al importar "+path+": "+error.message,{cause:error});}
    assert.equal(typeof module[exportName],"function",name+" debe exportar su inicializador");
  });
}
