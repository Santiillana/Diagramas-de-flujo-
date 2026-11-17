export const sourceScenarios=Object.freeze([
  {
    id:"tienda-marta",title:"La tienda de doña Marta",description:"Una aplicación para recibir pedidos, atender varias personas y llevar un catálogo confiable.",
    areas:[
      {id:"pedidos",title:"Pedidos",requirementIds:["R1","R2"]},
      {id:"clientes",title:"Clientes",requirementIds:["R3","R6"]},
      {id:"comprobantes",title:"Comprobantes",requirementIds:["R5"]},
      {id:"catalogo",title:"Inventario y catálogo",requirementIds:["R4"]}
    ],
    sources:[
      {id:"marta-entrevista",title:"Entrevista con doña Marta",type:"P",hops:1,contribution:"Recibe pedidos por mensajería y los anota en un cuaderno.",limitation:"Solo muestra el punto de vista de la dueña.",requirementIds:["R1"]},
      {id:"mostrador-observacion",title:"Observación del mostrador",type:"P",hops:1,contribution:"Marta atiende a dos clientes a la vez.",limitation:"La observación corresponde a un solo día.",requirementIds:["R2"]},
      {id:"clientes-encuesta",title:"Encuesta a 40 clientes",type:"P",hops:1,contribution:"28 de 40 personas quieren un aviso cuando su pedido esté listo.",limitation:"Las preguntas son cerradas y la muestra es pequeña.",requirementIds:["R3"]},
      {id:"cuaderno-pedidos",title:"Cuaderno de pedidos",type:"S",hops:2,contribution:"Muestra los productos más pedidos durante mayo.",limitation:"Hay datos incompletos y algunas anotaciones son difíciles de leer.",requirementIds:["R4"]},
      {id:"normativa-comprobantes",title:"Normativa de comprobantes de venta",type:"S",hops:2,contribution:"Indica cuándo corresponde emitir un comprobante.",limitation:"Hay que confirmar que la versión consultada siga vigente.",requirementIds:["R5"]},
      {id:"resenas-tiendas",title:"Reseñas de apps de otras tiendas",type:"S",hops:2,contribution:"Sus clientes valoran consultar el estado de un pedido.",limitation:"Las reseñas describen otros comercios y otro contexto.",requirementIds:["R6"]},
      {id:"enciclopedia-inventario",title:"Enciclopedia en línea sobre inventario",type:"T",hops:3,contribution:"Define y organiza vocabulario sobre inventario.",limitation:"No describe la tienda ni produce un requisito directo.",requirementIds:[]}
    ],
    requirements:[
      {id:"R1",text:"Registrar los pedidos que llegan",sourceId:"marta-entrevista",areaId:"pedidos"},
      {id:"R2",text:"Manejar varios pedidos al mismo tiempo",sourceId:"mostrador-observacion",areaId:"pedidos"},
      {id:"R3",text:"Avisar al cliente cuando su pedido esté listo",sourceId:"clientes-encuesta",areaId:"clientes"},
      {id:"R4",text:"Mostrar primero los productos más pedidos",sourceId:"cuaderno-pedidos",areaId:"catalogo"},
      {id:"R5",text:"Emitir comprobante de venta cuando corresponda",sourceId:"normativa-comprobantes",areaId:"comprobantes"},
      {id:"R6",text:"Mostrar el estado del pedido",sourceId:"resenas-tiendas",areaId:"clientes"}
    ]
  },
  {
    id:"matricula-colegio",title:"Matrícula de un colegio",description:"Un sistema para registrar estudiantes, validar documentos y acompañar el proceso de matrícula.",
    areas:[
      {id:"estudiantes",title:"Estudiantes",requirementIds:["C1","C2"]},
      {id:"matricula",title:"Matrícula",requirementIds:["C3","C5"]},
      {id:"comunicaciones",title:"Comunicaciones",requirementIds:["C4"]},
      {id:"cumplimiento",title:"Cumplimiento",requirementIds:["C6"]},
      {id:"oferta",title:"Oferta académica",requirementIds:["C7"]}
    ],
    sources:[
      {id:"colegio-secretaria",title:"Entrevista con secretaría",type:"P",hops:1,contribution:"La secretaria registra datos de estudiantes y recibe los documentos.",limitation:"Expresa la experiencia de una persona del equipo.",requirementIds:["C1","C2"]},
      {id:"colegio-observacion",title:"Observación de la jornada de matrícula",type:"P",hops:1,contribution:"Las familias esperan mientras se revisan varios formularios.",limitation:"Corresponde a una jornada observada.",requirementIds:["C3"]},
      {id:"colegio-encuesta",title:"Encuesta a familias",type:"P",hops:1,contribution:"Las familias solicitan conocer el estado de su trámite.",limitation:"Las respuestas dependen de quiénes contestaron.",requirementIds:["C4"]},
      {id:"colegio-manual",title:"Manual de matrícula",type:"S",hops:2,contribution:"Describe los campos y documentos solicitados actualmente.",limitation:"Puede no incluir cambios recientes del proceso.",requirementIds:["C5"]},
      {id:"colegio-reglamento",title:"Reglamento de protección de datos",type:"S",hops:2,contribution:"Define condiciones para tratar datos personales de menores.",limitation:"Debe revisarse con la normativa vigente y el contexto institucional.",requirementIds:["C6"]},
      {id:"colegio-registro",title:"Registro de cursos del año anterior",type:"S",hops:2,contribution:"Muestra los cursos y jornadas que abrió el colegio.",limitation:"La oferta cambia cada año.",requirementIds:["C7"]},
      {id:"colegio-glosario",title:"Glosario educativo",type:"T",hops:3,contribution:"Aclara términos generales del proceso escolar.",limitation:"Orienta la búsqueda, pero no confirma las reglas de este colegio.",requirementIds:[]}
    ],
    requirements:[
      {id:"C1",text:"Registrar los datos de cada estudiante",sourceId:"colegio-secretaria",areaId:"estudiantes"},
      {id:"C2",text:"Adjuntar los documentos de matrícula",sourceId:"colegio-secretaria",areaId:"estudiantes"},
      {id:"C3",text:"Gestionar varias solicitudes en curso",sourceId:"colegio-observacion",areaId:"matricula"},
      {id:"C4",text:"Informar a la familia el estado del trámite",sourceId:"colegio-encuesta",areaId:"comunicaciones"},
      {id:"C5",text:"Validar los documentos requeridos",sourceId:"colegio-manual",areaId:"matricula"},
      {id:"C6",text:"Restringir el acceso a datos de menores",sourceId:"colegio-reglamento",areaId:"cumplimiento"},
      {id:"C7",text:"Consultar los cursos y jornadas disponibles",sourceId:"colegio-registro",areaId:"oferta"}
    ]
  },
  {
    id:"citas-consultorio",title:"Citas de un consultorio",description:"Una herramienta para solicitar citas, organizar la agenda y comunicar cambios a pacientes.",
    areas:[
      {id:"agenda",title:"Agenda",requirementIds:["S1","S2","S5"]},
      {id:"pacientes",title:"Pacientes",requirementIds:["S3"]},
      {id:"atencion",title:"Atención",requirementIds:["S4"]},
      {id:"privacidad",title:"Privacidad",requirementIds:["S6"]},
      {id:"servicios",title:"Servicios",requirementIds:["S7"]}
    ],
    sources:[
      {id:"clinica-recepcion",title:"Entrevista con recepción",type:"P",hops:1,contribution:"La recepcionista agenda, confirma y reprograma las citas.",limitation:"No representa por sí sola la experiencia clínica.",requirementIds:["S1","S2"]},
      {id:"clinica-observacion",title:"Observación de la agenda",type:"P",hops:1,contribution:"Se cruzan llamadas mientras el equipo busca espacios libres.",limitation:"Se observó un periodo específico de atención.",requirementIds:["S3"]},
      {id:"clinica-encuesta",title:"Encuesta a pacientes",type:"P",hops:1,contribution:"Los pacientes prefieren recibir recordatorios antes de la cita.",limitation:"Una encuesta no explica todas las razones de inasistencia.",requirementIds:["S4"]},
      {id:"clinica-horarios",title:"Agenda de horarios vigente",type:"S",hops:2,contribution:"Registra la disponibilidad publicada de profesionales.",limitation:"Puede no reflejar cambios que aún no se actualizaron.",requirementIds:["S5"]},
      {id:"clinica-protocolo",title:"Protocolo de manejo de datos",type:"S",hops:2,contribution:"Indica cómo conservar y consultar información de pacientes.",limitation:"Debe contrastarse con obligaciones vigentes.",requirementIds:["S6"]},
      {id:"clinica-sistema",title:"Reportes del sistema de citas",type:"S",hops:2,contribution:"Resume cancelaciones y cambios del periodo anterior.",limitation:"El registro puede tener datos faltantes.",requirementIds:["S7"]},
      {id:"clinica-directorio",title:"Directorio de especialidades",type:"T",hops:3,contribution:"Organiza nombres y definiciones generales de especialidades.",limitation:"No confirma qué servicios ofrece este consultorio.",requirementIds:[]}
    ],
    requirements:[
      {id:"S1",text:"Solicitar una cita con fecha y profesional",sourceId:"clinica-recepcion",areaId:"agenda"},
      {id:"S2",text:"Reprogramar una cita y conservar el cambio",sourceId:"clinica-recepcion",areaId:"agenda"},
      {id:"S3",text:"Consultar espacios disponibles antes de agendar",sourceId:"clinica-observacion",areaId:"pacientes"},
      {id:"S4",text:"Enviar un recordatorio antes de cada cita",sourceId:"clinica-encuesta",areaId:"atencion"},
      {id:"S5",text:"Mostrar horarios de atención vigentes",sourceId:"clinica-horarios",areaId:"agenda"},
      {id:"S6",text:"Limitar el acceso a información de pacientes",sourceId:"clinica-protocolo",areaId:"privacidad"},
      {id:"S7",text:"Consultar un resumen de cancelaciones del periodo",sourceId:"clinica-sistema",areaId:"servicios"}
    ]
  }
]);

export const sourceTypes=Object.freeze({P:{name:"Primaria",shape:"círculo",hops:1},S:{name:"Secundaria",shape:"cuadrado",hops:2},T:{name:"Terciaria",shape:"rombo",hops:3}});

export function sourceCoverage(scenario){
  const sourceById=new Map(scenario.sources.map(source=>[source.id,source]));
  const areas=scenario.areas.map(area=>{
    const requirements=area.requirementIds.map(id=>scenario.requirements.find(item=>item.id===id)).filter(Boolean);
    const primary=requirements.some(requirement=>sourceById.get(requirement.sourceId)?.type==="P");
    return {...area,covered:requirements.length>0,primaryVerified:primary,requirements};
  });
  return {areas,coveredAreas:areas.filter(area=>area.covered).length,totalAreas:areas.length,primaryVerified:areas.filter(area=>area.primaryVerified).length,needsPrimary:areas.filter(area=>area.covered&&!area.primaryVerified).length};
}

export function validateSourceScenarios(scenarios=sourceScenarios){
  const errors=[];
  for(const scenario of scenarios){
    const sources=new Map(scenario.sources.map(source=>[source.id,source])),requirements=new Map(scenario.requirements.map(requirement=>[requirement.id,requirement]));
    if(scenario.sources.length<6||scenario.sources.length>8)errors.push(scenario.id+": source count must be 6–8");
    if(scenario.requirements.length<6||scenario.requirements.length>10)errors.push(scenario.id+": requirement count must be 6–10");
    for(const type of ["P","S"])if(scenario.sources.filter(source=>source.type===type).length<2)errors.push(scenario.id+": at least two "+type+" sources are required");
    if(!scenario.sources.some(source=>source.type==="T"))errors.push(scenario.id+": at least one T source is required");
    if(!scenario.sources.some(source=>source.requirementIds.length===0))errors.push(scenario.id+": a source without a direct requirement is required");
    if(sources.size!==scenario.sources.length)errors.push(scenario.id+": source id duplicated");
    if(requirements.size!==scenario.requirements.length)errors.push(scenario.id+": requirement id duplicated");
    for(const source of scenario.sources){
      if(!sourceTypes[source.type]||source.hops!==sourceTypes[source.type]?.hops)errors.push(scenario.id+": invalid type/hops for "+source.id);
      if(!source.title||!source.contribution||!source.limitation)errors.push(scenario.id+": incomplete source "+source.id);
      if(source.requirementIds.length>3)errors.push(scenario.id+": more than three requirements from "+source.id);
      for(const id of source.requirementIds)if(requirements.get(id)?.sourceId!==source.id)errors.push(scenario.id+": invalid requirement reference "+id);
    }
    const areaRefs=new Set();
    for(const area of scenario.areas){
      if(!area.requirementIds.length)errors.push(scenario.id+": empty area "+area.id);
      for(const id of area.requirementIds){if(requirements.get(id)?.areaId!==area.id)errors.push(scenario.id+": invalid area requirement "+id);areaRefs.add(id);}
    }
    for(const requirement of scenario.requirements){
      if(!sources.has(requirement.sourceId))errors.push(scenario.id+": missing source for "+requirement.id);
      if(!scenario.areas.some(area=>area.id===requirement.areaId))errors.push(scenario.id+": missing area for "+requirement.id);
      if(!areaRefs.has(requirement.id))errors.push(scenario.id+": requirement not included in an area "+requirement.id);
    }
  }
  if(scenarios.length!==3)errors.push("exactly three scenarios are required");
  return errors;
}
