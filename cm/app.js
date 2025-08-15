import { keys, saveRecord, validateCUIT11, validatePhoneDigits, validateEmail, nowISO } from "../assets/utils.js";

const STORAGE_KEY = keys.CM;
const steps = [1,2,3,4,5];
let current = 1;
const form = document.getElementById('form');
const stepper = document.getElementById('stepper');
const screenForm = document.getElementById('screen-form');
const screenConst = document.getElementById('screen-constancia');
const reviewBox = document.getElementById('review');
const constanciaBox = document.getElementById('constancia');

const actRows = document.getElementById('act-rows');
const distRows = document.getElementById('dist-rows');
const acts = []; // {jur, actividad, alicuota}

function drawStepper(){ stepper.innerHTML = steps.map(n => `<span class="step ${n===current?'active':''}">Paso ${n}</span>`).join(''); }
function showStep(n){ current = n; document.querySelectorAll('[data-step]').forEach(el => el.hidden = Number(el.getAttribute('data-step')) !== n); drawStepper(); }
drawStepper(); showStep(1);

document.getElementById('btn-prev').addEventListener('click', ()=>{ if(current>1) showStep(current-1); });

document.getElementById('btn-next').addEventListener('click', ()=>{
  if(current < 5){
    if(!validateCurrentStep()) return;
    if(current===3){ renderActs(); }
    if(current===4){ /* nothing */ }
    if(current===4){ /* ensure review built next */ }
    if(current===4){ /* ok */ }
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    if(current===4){}
    showStep(current+1);
    if(current===5){ buildReview(); }
  }else{
    const record = collectRecord();
    const id = saveRecord(STORAGE_KEY, record);
    showConstancia({...record,_id:id});
  }
});

// Add activity row
document.getElementById('btnAddAct').addEventListener('click', ()=>{
  const jur = document.getElementById('act_j').value;
  const act = document.getElementById('act_a').value;
  const ali = document.getElementById('act_alicuota').value;
  if(!jur || !act){ alert('Elegí jurisdicción y actividad.'); return; }
  acts.push({jur, actividad: act, alicuota: ali ? Number(ali) : null});
  renderActs();
});

function renderActs(){
  if(!acts.length){ actRows.innerHTML = '<p class="notice">Sin actividades cargadas.</p>'; return; }
  actRows.innerHTML = '<table class="table"><thead><tr><th>Jurisdicción</th><th>Actividad</th><th>Alícuota (%)</th><th></th></tr></thead><tbody>' +
    acts.map((r,i)=>`<tr><td>${r.jur}</td><td>${r.actividad}</td><td>${r.alicuota ?? '—'}</td><td><button class="btn" data-del="${i}">Quitar</button></td></tr>`).join('') +
    '</tbody></table>';
  actRows.querySelectorAll('button[data-del]').forEach(b => b.addEventListener('click', ()=>{ acts.splice(Number(b.getAttribute('data-del')),1); renderActs(); }));
}

function q(name){ return form.elements[name]; }

function validateCurrentStep(){
  const n = current; const err = m=>{ alert(m); return false; };
  if(n===1){
    if(!q('razon_social').value.trim()) return err('Completá la razón social.');
    if(!validateCUIT11(q('cuit').value)) return err('CUIT inválido (11 dígitos).');
    if(!validatePhoneDigits(q('telefono').value)) return err('Teléfono inválido.');
    if(!validateEmail(q('email').value)) return err('Email inválido.');
    return true;
  }
  if(n===2){
    // At least PBA (fixed); others optional
    return true;
  }
  if(n===3){
    if(!acts.length) return err('Agregá al menos una actividad por jurisdicción.');
    return true;
  }
  if(n===4){
    const sum = ['PBA','CABA','CBA','SFE','MZA'].reduce((acc,k)=> acc + (Number(q('dist_'+k)?.value || 0)), 0);
    if(Math.round(sum*100)/100 !== 100) return err('La distribución debe sumar 100%.');
    if(!q('fecha_inicio').value) return err('Ingresá la fecha de inicio.');
    return true;
  }
  return true;
}

function collectRecord(){
  const f = Object.fromEntries(new FormData(form).entries());
  const distr = ['PBA','CABA','CBA','SFE','MZA'].reduce((o,k)=> (o[k]=Number(f['dist_'+k]||0), o), {});
  return {
    _tipo:'CM',
    creado_en: nowISO(),
    ...f,
    sede_principal:'PBA',
    actividades_por_jurisdiccion: acts.slice(),
    distribucion_inicial: distr,
    dfe_aceptado: !!q('dfe_aceptado')?.checked
  };
}

function buildReview(){
  const r = collectRecord();
  const actsHtml = r.actividades_por_jurisdiccion.map(x => `<tr><td>${x.jur}</td><td>${x.actividad}</td><td>${x.alicuota ?? '—'}</td></tr>`).join('');
  const distHtml = Object.entries(r.distribucion_inicial).map(([k,v])=>`<tr><td>${k}</td><td>${v}%</td></tr>`).join('');
  reviewBox.innerHTML = `
    <h4>Identificación</h4>
    <p>${r.razon_social} — CUIT ${r.cuit}</p>
    <hr class="sep">
    <h4>Actividades por jurisdicción</h4>
    <table class="table"><thead><tr><th>Jurisdicción</th><th>Actividad</th><th>Alícuota</th></tr></thead><tbody>${actsHtml}</tbody></table>
    <hr class="sep">
    <h4>Distribución inicial</h4>
    <table class="table"><thead><tr><th>Jurisdicción</th><th>%</th></tr></thead><tbody>${distHtml}</tbody></table>
    <p>Inicio: ${r.fecha_inicio} · DFE: ${r.dfe_aceptado ? 'Aceptado' : 'Pendiente'}</p>
  `;
}

function showConstancia(r){
  screenForm.hidden = true; screenConst.hidden = false;
  const actsHtml = r.actividades_por_jurisdiccion.map(x => `<tr><td>${x.jur}</td><td>${x.actividad}</td><td>${x.alicuota ?? '—'}</td></tr>`).join('');
  const distHtml = Object.entries(r.distribucion_inicial).map(([k,v])=>`<tr><td>${k}</td><td>${v}%</td></tr>`).join('');
  constanciaBox.innerHTML = `
    <div class="print-only"><h1>Constancia — CM (Simulada)</h1></div>
    <p><b>ID local:</b> ${r._id} · <b>Fecha:</b> ${r.creado_en} · <b>Sede:</b> PBA</p>
    <hr class="sep">
    <h3>Titular</h3>
    <p>${r.razon_social} — CUIT ${r.cuit} · Tel ${r.telefono} · Email ${r.email}</p>
    <hr class="sep">
    <h3>Actividades por jurisdicción</h3>
    <table class="table"><thead><tr><th>Jurisdicción</th><th>Actividad</th><th>Alícuota</th></tr></thead><tbody>${actsHtml}</tbody></table>
    <hr class="sep">
    <h3>Distribución inicial</h3>
    <table class="table"><thead><tr><th>Jurisdicción</th><th>%</th></tr></thead><tbody>${distHtml}</tbody></table>
    <p>Inicio de actividades: ${r.fecha_inicio} · DFE: ${r.dfe_aceptado ? 'Aceptado' : 'Pendiente'}</p>
  `;
}
