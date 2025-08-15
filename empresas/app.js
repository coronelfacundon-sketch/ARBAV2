import { keys, getRecords } from "../assets/utils.js";

const login = document.getElementById('login');
const dash = document.getElementById('dash');
const q = document.getElementById('q');
const tipo = document.getElementById('tipo');
const tbody = document.querySelector('#tabla tbody');

document.getElementById('btnLogin').addEventListener('click', ()=>{
  const u = document.getElementById('u').value.trim();
  const p = document.getElementById('p').value.trim();
  if(u==='ARBA' && p==='ARBAISAP123'){
    login.hidden = true; dash.hidden = false; render();
  }else{ alert('Credenciales inválidas.'); }
});

q.addEventListener('input', render); tipo.addEventListener('change', render);

document.getElementById('btnCSV').addEventListener('click', ()=> exportCombined('csv'));
document.getElementById('btnXLS').addEventListener('click', ()=> exportCombined('xls'));

function combine(){
  const local = getRecords(keys.LOCAL).map(r => ({_tipo:'LOCAL', ...r}));
  const cm = getRecords(keys.CM).map(r => ({_tipo:'CM', ...r}));
  const pad = getRecords(keys.PADRON).map(r => ({_tipo:'PADRON', creado_en: r.ultima_actualizacion, ...r}));
  return local.concat(cm).concat(pad);
}

function render(){
  const rows = combine().filter(r => {
    if(tipo.value && r._tipo !== tipo.value) return false;
    const s = (JSON.stringify(r)||'').toLowerCase();
    return s.includes(q.value.trim().toLowerCase());
  });
  tbody.innerHTML = rows.map(r => {
    const detalle = r._tipo==='LOCAL'
      ? (r.actividad || '—')
      : r._tipo==='CM'
      ? ((r.actividades_por_jurisdiccion||[]).length + ' act(s)')
      : ((r.actividades||[]).length + ' act(s) · Reg: ' + (r.regimen||'—'));
    const cuit = r.cuit || '—';
    const fecha = r.creado_en || '—';
    const rz = r.razon_social || '—';
    const id = r._id || (r.cuit ? 'PAD-'+r.cuit : '—');
    return `<tr>
      <td>${r._tipo}</td>
      <td>${fecha}</td>
      <td>${rz}</td>
      <td>${cuit}</td>
      <td>${detalle}</td>
      <td><button class="btn" data-view="${r._tipo}|${id}">Ver constancia</button></td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('button[data-view]').forEach(b => b.addEventListener('click', ()=>{
    const [tipo, id] = b.getAttribute('data-view').split('|');
    openConstancia(tipo, id);
  }));
}

function openConstancia(tipo, id){
  if(tipo === 'PADRON'){
    const arr = getRecords(keys.PADRON);
    const rec = arr.find(r => (r._id && String(r._id)===String(id)) || (!r._id && ('PAD-'+r.cuit)===id) || r.cuit===id.replace('PAD-',''));
    if(!rec){ alert('Padrón no encontrado.'); return; }
    const w = window.open('', '_blank', 'width=900,height=700');
    const actsHtml = (rec.actividades||[]).map(x=>`<tr><td>${x.actividad}</td><td>${x.alicuota ?? '—'}%</td></tr>`).join('');
    w.document.write(`
      <html><head><title>Padrón ARBA (Simulado)</title></head><body style="font-family:Inter,system-ui,sans-serif;padding:20px">
      <h1>Padrón ARBA (Simulado)</h1>
      <p>CUIT ${rec.cuit} · ${rec.razon_social || '—'} · Estado: ${rec.estado || '—'}</p>
      <p>Domicilio: ${rec.domicilio_fiscal || '—'} · Régimen: ${rec.regimen || '—'} · Exenciones: ${rec.exenciones || '—'}</p>
      <table border="1" cellspacing="0" cellpadding="6"><tr><th>Actividad</th><th>Alícuota</th></tr>${actsHtml}</table>
      <hr><button onclick="window.print()">Imprimir</button></body></html>
    `);
    w.document.close();
    return;
  }
  const key = (tipo==='LOCAL') ? keys.LOCAL : keys.CM;
  const arr = getRecords(key);
  const rec = arr.find(r => String(r._id) === String(id));
  if(!rec){ alert('Registro no encontrado.'); return; }
  const w = window.open('', '_blank', 'width=900,height=700');
  const rows = Object.entries(rec).filter(([k])=>!k.startsWith('_')).map(([k,v])=>`<tr><th>${k}</th><td>${typeof v==='object'? JSON.stringify(v): String(v)}</td></tr>`).join('');
  w.document.write(`
    <html><head><title>Constancia</title></head><body style="font-family:Inter,system-ui,sans-serif;padding:20px">
    <h1>Constancia — ${tipo}</h1>
    <p>ID ${rec._id || '—'} · Fecha ${rec.creado_en || '—'}</p>
    <table border="1" cellspacing="0" cellpadding="6">${rows}</table>
    <hr><button onclick="window.print()">Imprimir</button></body></html>
  `);
  w.document.close();
}

async function exportCombined(kind){
  const all = combine();
  if(!all.length){ alert('No hay registros.'); return; }
  const TMP = '__tmp_export__';
  localStorage.setItem(TMP, JSON.stringify(all));
  const mod = await import('../assets/utils.js');
  if(kind==='csv') mod.exportCSV(TMP, 'empresas_arba.csv');
  else mod.exportXLS(TMP, 'empresas_arba.xls');
  localStorage.removeItem(TMP);
}
