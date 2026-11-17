import { escapeHTML } from "../scenes/common.js";

const recipes = {
  algorithm: {
    id:"R02-algorithm", idea:"Un algoritmo es una ruta: cada instrucción marca el siguiente paso.", term:"Algoritmo",
    cierre:"El orden de las instrucciones lleva de Inicio a Fin.",
    moments:["Aparece Inicio","Se conectan los pasos","La ruta llega a Fin"],
    figures:[["terminal","Inicio"],["input","Leer n"],["process","doble = n × 2"],["output","Mostrar doble"],["terminal","Fin"]]
  },
  reading: {
    id:"R02-sequence", idea:"Las flechas son calles de un solo sentido. Síguelas para encontrar el paso que continúa.", term:"Flujo y secuencia",
    cierre:"La dirección de cada flecha define el orden.",
    moments:["Se conectan tres pasos","La bolita sigue las flechas","El recorrido conserva su orden"],
    figures:[["process","Paso 1"],["process","Paso 2"],["process","Paso 3"]]
  },
  terminals: {
    id:"R01-figures", idea:"Como en un mapa, cada símbolo anuncia qué ocurre en ese punto.", term:"Símbolo de diagrama",
    cierre:"La forma indica el papel de cada instrucción.",
    moments:["Inicio y Fin usan óvalos","Las instrucciones toman su forma","Las flechas conectan el recorrido"],
    figures:[["terminal","Inicio"],["input","Leer"],["process","Proceso"],["decision","Decisión"],["document","Imprimir"],["terminal","Fin"]]
  },
  input: {
    id:"R05-input", idea:"Leer funciona como un mostrador: recibes un dato y lo guardas para usarlo.", term:"Entrada de datos",
    cierre:"El dato entra por Leer y queda guardado en la variable indicada.",
    moments:["Aparece Leer", "El dato 2 llega por la entrada", "El valor queda en B"],
    figures:[["input","Leer B"],["process","2"],["process","B = 2"],["process","Continuar"]]
  },
  process: {
    id:"R08-process", idea:"Un proceso transforma los datos y conserva el resultado para el siguiente paso.", term:"Proceso",
    cierre:"El proceso calcula el resultado antes de enviarlo a la salida.",
    moments:["Aparecen los valores", "La operación combina los datos", "El resultado queda guardado"],
    figures:[["process","A = 2"],["process","A × B"],["process","A = 4"]]
  },
  output: {
    id:"R06-output", idea:"Imprimir copia un valor en la pantalla. La variable conserva su contenido.", term:"Salida de datos",
    cierre:"Imprimir muestra el valor y deja intacta la variable.",
    moments:["El valor está en la variable", "Una copia llega a Imprimir", "El valor aparece en pantalla"],
    figures:[["process","resultado = 4"],["document","Imprimir resultado"],["output","4 en pantalla"]]
  },
  variables: {
    id:"R03-variables", idea:"Una variable es un casillero con nombre. Guarda un valor y puede recibir otro después.", term:"Variable y asignación",
    cierre:"La asignación guarda el nuevo valor en A; B conserva el suyo.",
    moments:["A y B aparecen vacías", "B entrega una copia de su valor", "El valor nuevo queda guardado en A"],
    figures:[["process","A = ∅"],["process","B = 17"],["process","A = B"],["process","A = 17"]]
  },
  arithmetic: {
    id:"R08-arithmetic", idea:"Una operación mezcla valores como ingredientes y produce un resultado.", term:"Operación aritmética",
    cierre:"La operación calcula A × B y guarda el resultado en A.",
    moments:["A y B llegan a la operación", "La expresión muestra 2 × 2", "El resultado 4 se guarda en A"],
    figures:[["process","A = 2"],["process","A × B"],["process","2 × 2"],["process","A = 4"]]
  },
  comparisons: {
    id:"R09-comparisons", idea:"Una comparación responde una pregunta para que el algoritmo pueda elegir qué hacer.", term:"Operador relacional",
    cierre:"La comparación produce verdadero o falso para dirigir la decisión.",
    moments:["Aparece la pregunta edad ≥ 18", "Se comparan 20 y 18", "El resultado verdadero permite continuar"],
    figures:[["process","edad ≥ 18"],["process","20 ≥ 18"],["decision","¿Verdadero?"],["process","Sí · continuar"]]
  }
};

function shape(type,x,y,label,active,index){
  const common='class="recipe-node'+(active?" is-active":"")+'"';
  let figure="";
  if(type==="terminal")figure='<ellipse '+common+' cx="'+x+'" cy="'+y+'" rx="57" ry="31"/>';
  else if(type==="input"||type==="output")figure='<polygon '+common+' points="'+(x-48)+','+(y-28)+' '+(x+58)+','+(y-28)+' '+(x+48)+','+(y+28)+' '+(x-58)+','+(y+28)+'"/>';
  else if(type==="decision")figure='<polygon '+common+' points="'+x+','+(y-38)+' '+(x+64)+','+y+' '+x+','+(y+38)+' '+(x-64)+','+y+'"/>';
  else if(type==="document")figure='<path '+common+' d="M'+(x-49)+' '+(y-30)+'h88l12 12v48h-100z M'+(x+39)+' '+(y-30)+'v13h13"/>';
  else if(type==="loop")figure='<polygon '+common+' points="'+(x-53)+','+(y-31)+' '+(x+38)+','+(y-31)+' '+(x+54)+','+y+' '+(x+38)+','+(y+31)+' '+(x-53)+','+(y+31)+' '+(x-40)+','+y+'"/>';
  else figure='<rect '+common+' x="'+(x-54)+'" y="'+(y-30)+'" width="108" height="60" rx="7"/>';
  return figure+'<text class="recipe-node-label" x="'+x+'" y="'+(y+5)+'" text-anchor="middle">'+escapeHTML(label)+'</text><text class="recipe-order" x="'+x+'" y="'+(y+57)+'" text-anchor="middle">'+(index+1)+'</text>';
}

export function lessonRecipe(id){return recipes[id]??null;}

export function recipeSceneMarkup(recipe,frame=0){
  if(!recipe)return "";
  const nodes=recipe.figures,margin=76,width=760,y=106;
  const gap=nodes.length>1?(width-margin*2)/(nodes.length-1):0;
  const xs=nodes.map((_,index)=>margin+gap*index);
  const current=Math.max(0,Math.min(nodes.length-1,frame));
  const arrows=nodes.slice(1).map((_,index)=>'<path class="recipe-arrow" d="M'+(xs[index]+52)+' '+y+'H'+(xs[index+1]-52)+'" marker-end="url(#recipe-arrowhead)"/>').join("");
  const shapes=nodes.map(([kind,label],index)=>shape(kind,xs[index],y,label,index===current,index)).join("");
  return '<svg class="lesson-recipe-svg" viewBox="0 0 '+width+' 220" role="img" aria-label="'+escapeHTML(recipe.cierre)+'"><defs><marker id="recipe-arrowhead" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z"/></marker></defs>'+arrows+shapes+'<circle class="recipe-guide" cx="'+xs[0]+'" cy="55" r="8" transform="translate('+(xs[current]-xs[0])+' 0)" aria-hidden="true"/></svg>';
}

export function recipeFrame(recipe,step,eventCount=1){
  if(!recipe)return 0;
  const count=Math.max(1,eventCount),progress=count===1?0:Math.max(0,Math.min(1,step/(count-1)));
  const moment=Math.round(progress*(recipe.moments.length-1));
  return Math.round((recipe.moments.length<=1?0:moment/(recipe.moments.length-1))*(recipe.figures.length-1));
}

export function recipeMomentIndex(recipe,step,eventCount=1){
  if(!recipe)return 0;
  const count=Math.max(1,eventCount),progress=count===1?0:Math.max(0,Math.min(1,step/(count-1)));
  return Math.round(progress*(recipe.moments.length-1));
}

export function recipeMoment(recipe,step,eventCount=1){
  if(!recipe)return "";
  return recipe.moments[recipeMomentIndex(recipe,step,eventCount)];
}
