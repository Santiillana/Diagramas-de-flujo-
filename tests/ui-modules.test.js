import test from "node:test";
import assert from "node:assert/strict";

test("todos los módulos de interfaz se pueden importar sin acceder al DOM al cargarse",async()=>{
  const modules=[
    ["navigation","../src/ui/navigation.js","initNavigation"],
    ["preferences","../src/ui/preferences.js","initPreferences"],
    ["content","../src/ui/content-view.js","initContentViews"],
    ["simulator","../src/ui/simulator.js","initSimulator"],
    ["lab","../src/ui/lab.js","initLab"],
    ["builder","../src/ui/builder.js","initBuilder"]
  ];
  for(const [name,path,exportName] of modules){
    const module=await import(path);
    assert.equal(typeof module[exportName],"function",name+" debe exportar su inicializador");
  }
});
