import { keys, saveRecord, validateCUIT11, validatePhoneDigits, validateEmail, validateCP, nowISO } from "../assets/utils.js";

const STORAGE_KEY = keys.LOCAL;
const steps = [1,2,3,4];
let current = 1;
const form = document.getElementById('form');
const stepper = document.getElementById('stepper');
const screenForm = document.getElementById('screen-form');
const screenConst = document.getElementById('screen-constancia');
const reviewBox = document.getElementById('review');
const constanciaBox = document.getElementById('constancia');

function drawStepper(){ stepper.innerHTML = steps.map(n => `<span class="step ${n===current?'active':''}">Paso ${n}</span>`).join(''); }
function showStep(n){
  current = n; document.querySelectorAll('[data-step]').forEach(el => el.hidden = Number(el.getAttribute('data-step')) !== n ); drawStepper();
}
drawStepper(); showStep(1);

document.getElementById('btn-prev').addEventListener('click', ()=>{ if(current>1) showStep(current-1); });
document.getElementById('btn-next').addEventListener('click', ()=>{
  if(current < 4){
    if(!validateCurrentStep()) return;
    if(current===3) buildReview();
    showStep(current+1);
  }else{
    const record = collectRecord();
    const id = saveRecord(STORAGE_KEY, record);
    showConstancia({...record,_id:id});
  }
});

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
    if(!q('df_calle').value.trim() || !q('df_numero').value.trim() || !q('df_localidad').value.trim()) return err('Completá el domicilio fiscal.');
    if(!q('da_calle').value.trim() || !q('da_numero').value.trim() || !q('da_localidad').value.trim()) return err('Completá el domicilio de actividad.');
    if(!validateCP(q('cp').value,'PBA')) return err('CP debe ser #### (PBA).');
    return true;
  }
  if(n===3){
    if(!q('actividad').value) return err('Seleccioná una actividad.');
    if(!q('fecha_inicio').value) return err('Ingresá la fecha de inicio.');
    return true;
  }
  return true;
}

function collectRecord(){
  const f = Object.fromEntries(new FormData(form).entries());
  return {
    _tipo:'LOCAL',
    creado_en: nowISO(),
    ...f,
    retencion: !!q('retencion')?.checked,
    percepcion: !!q('percepcion')?.checked,
    exento: !!q('exento')?.checked,
    dfe_aceptado: !!q('dfe_aceptado')?.checked
  };
}

function buildReview(){
  const r = collectRecord();
  const entries = Object.entries(r).filter(([k])=>!k.startsWith('_'));
  reviewBox.innerHTML = '<table class="table"><thead><tr><th>Campo</th><th>Valor</th></tr></thead><tbody>' +
    entries.map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('') + '</tbody></table>';
}

function showConstancia(r){
  screenForm.hidden = true; screenConst.hidden = false;
  constanciaBox.innerHTML = `
    <div class="print-only"><h1>Constancia — IIBB Local (Simulada)</h1></div>
    <p><b>ID local:</b> ${r._id} · <b>Fecha:</b> ${r.creado_en}</p>
    <hr class="sep">
    <h3>Titular</h3>
    <p>${r.razon_social} — CUIT ${r.cuit}</p>
    <p>Tel: ${r.telefono} — Email: ${r.email}</p>
    <hr class="sep">
    <h3>Domicilio Fiscal</h3>
    <p>${r.df_calle} ${r.df_numero}, ${r.df_localidad} (CP ${r.cp})</p>
    <h3>Domicilio de Actividad</h3>
    <p>${r.da_calle} ${r.da_numero}, ${r.da_localidad}, PBA</p>
    <hr class="sep">
    <h3>Actividad y Regímenes</h3>
    <p>Actividad: ${r.actividad} · Inicio: ${r.fecha_inicio}</p>
    <p>Retención: ${r.retencion?'Sí':'No'} · Percepción: ${r.percepcion?'Sí':'No'} · Exento: ${r.exento?'Sí':'No'} · DFE: ${r.dfe_aceptado?'Aceptado':'Pendiente'}</p>
  `;
}
