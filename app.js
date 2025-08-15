import { keys, getRecords, setRecords, nowISO } from "../assets/utils.js";
const STORAGE_KEY = keys.PADRON;

const cuitInput = document.getElementById('cuit');
const btnBuscar = document.getElementById('btnBuscar');
const btnNuevo = document.getElementById('btnNuevo');
const formCard = document.getElementById('formCard');
const form = document.getElementById('form');
const actRows = document.getElementById('actRows');

let current = null; // current record being edited

btnNuevo.addEventListener('click', ()=>{
  current = null;
  form.reset();
  actRows.innerHTML = '';
  formCard.hidden = false;
});

btnBuscar.addEventListener('click', ()=>{
  const cuit = cuitInput.value.trim();
  if(!/^\d{11}$/.test(cuit)){ alert('CUIT inválido (11 dígitos).'); return; }
  const arr = getRecords(STORAGE_KEY);
  const rec = arr.find(r => r.cuit === cuit);
  if(rec){
    load(rec);
  }else{
    // Nuevo pre-cargado
    current = { cuit, razon_social:'', estado:'Activo', domicilio_fiscal:'', actividades:[], regimen:'ninguno', exenciones:'', ultima_actualizacion: nowISO() };
    renderActs();
    formCard.hidden = false;
  }
});

document.getElementById('btnAdd').addEventListener('click', ()=>{
  const a = document.getElementById('naes').value;
  const ali = document.getElementById('ali').value;
  if(!current){ alert('Primero buscá o creá un padrón.'); return; }
  if(!a){ alert('Elegí una actividad.'); return; }
  current.actividades.push({actividad:a, alicuota: ali? Number(ali): null});
  renderActs();
});

document.getElementById('btnGuardar').addEventListener('click', ()=>{
  if(!current){ alert('Nada para guardar.'); return; }
  const f = Object.fromEntries(new FormData(form).entries());
  current = {
    ...current,
    razon_social: f.razon_social || '',
    estado: f.estado || 'Activo',
    domicilio_fiscal: f.domicilio_fiscal || '',
    regimen: f.regimen || 'ninguno',
    exenciones: f.exenciones || '',
    ultima_actualizacion: nowISO()
  };
  const arr = getRecords(STORAGE_KEY);
  const idx = arr.findIndex(r => r.cuit === current.cuit);
  if(idx === -1) arr.push(current); else arr[idx] = current;
  setRecords(STORAGE_KEY, arr);
  alert('Guardado en padrón simulado.');
});

document.getElementById('btnImprimir').addEventListener('click', ()=>{
  if(!current){ alert('Nada para imprimir.'); return; }
  const w = window.open('', '_blank', 'width=900,height=700');
  const css = `
    body{font-family:Inter,system-ui,sans-serif;padding:20px}
    h1,h2{margin:0 0 8px}
    hr{margin:12px 0}
    .muted{color:#555}
    table{width:100%;border-collapse:collapse}
    td,th{border-bottom:1px solid #ddd;padding:6px;text-align:left;vertical-align:top}
  `;
  const actsHtml = (current.actividades||[]).map(x=>`<tr><td>${x.actividad}</td><td>${x.alicuota ?? '—'}%</td></tr>`).join('');
  w.document.write(`
    <html><head><title>Padrón ARBA (Simulado)</title><style>${css}</style></head><body>
    <h1>Padrón ARBA (Simulado)</h1>
    <p class="muted">Última actualización: ${current.ultima_actualizacion}</p>
    <hr>
    <p><b>CUIT:</b> ${current.cuit} · <b>Razón social:</b> ${current.razon_social} · <b>Estado:</b> ${current.estado}</p>
    <p><b>Domicilio fiscal:</b> ${current.domicilio_fiscal || '—'}</p>
    <h3>Actividades y alícuotas</h3>
    <table><thead><tr><th>Actividad</th><th>Alícuota</th></tr></thead><tbody>${actsHtml}</tbody></table>
    <p><b>Régimen de recaudación:</b> ${current.regimen} · <b>Exenciones:</b> ${current.exenciones || '—'}</p>
    <hr>
    <button onclick="window.print()">Imprimir/Guardar PDF</button>
    </body></html>
  `);
  w.document.close();
});

function load(rec){
  current = JSON.parse(JSON.stringify(rec));
  form.reset();
  form.elements['razon_social'].value = current.razon_social || '';
  form.elements['estado'].value = current.estado || 'Activo';
  form.elements['domicilio_fiscal'].value = current.domicilio_fiscal || '';
  form.elements['regimen'].value = current.regimen || 'ninguno';
  form.elements['exenciones'].value = current.exenciones || '';
  renderActs();
  formCard.hidden = false;
}

function renderActs(){
  if(!current) return;
  if(!current.actividades || !current.actividades.length){
    actRows.innerHTML = '<p class="notice">Sin actividades cargadas.</p>';
    return;
  }
  actRows.innerHTML = '<table class="table"><thead><tr><th>Actividad</th><th>Alícuota</th><th></th></tr></thead><tbody>' +
    current.actividades.map((r,i)=>`<tr><td>${r.actividad}</td><td>${r.alicuota ?? '—'}%</td><td><button class="btn" data-del="${i}">Quitar</button></td></tr>`).join('') +
    '</tbody></table>';
  actRows.querySelectorAll('button[data-del]').forEach(b => {
    b.addEventListener('click', ()=>{
      current.actividades.splice(Number(b.getAttribute('data-del')),1);
      renderActs();
    });
  });
}
