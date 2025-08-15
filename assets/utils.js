export const keys = {
  LOCAL: 'arba_emp_local_v1',
  CM: 'arba_emp_cm_v1',
  PADRON: 'arba_emp_padron_v1'
};

export function getRecords(storageKey){
  try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); }
  catch(e){ console.error(e); return []; }
}

export function setRecords(storageKey, arr){
  localStorage.setItem(storageKey, JSON.stringify(arr || []));
}

export function saveRecord(storageKey, record){
  const arr = getRecords(storageKey);
  const nextId = (arr.length ? Math.max(...arr.map(r => Number(r._id) || 0)) + 1 : 1);
  record._id = nextId;
  arr.push(record);
  localStorage.setItem(storageKey, JSON.stringify(arr));
  return nextId;
}

export function findRecordById(storageKey, id){
  return getRecords(storageKey).find(r => String(r._id) === String(id));
}

export function updateRecordById(storageKey, id, updater){
  const arr = getRecords(storageKey);
  const idx = arr.findIndex(r => String(r._id) === String(id));
  if(idx === -1) return false;
  arr[idx] = typeof updater === 'function' ? updater(arr[idx]) : updater;
  setRecords(storageKey, arr);
  return true;
}

export function deleteRecordById(storageKey, id){
  const arr = getRecords(storageKey).filter(r => String(r._id) != String(id));
  setRecords(storageKey, arr);
}

export function exportCSV(storageKey, fileName='datos.csv'){
  const arr = getRecords(storageKey);
  if(!arr.length){ alert('No hay registros.'); return; }
  const headers = Array.from(new Set(arr.flatMap(r => Object.keys(r))));
  const rows = [headers.join(',')].concat(arr.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(',')));
  const blob = new Blob([rows.join('\n')], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function exportXLS(storageKey, fileName='datos.xls'){
  const arr = getRecords(storageKey);
  if(!arr.length){ alert('No hay registros.'); return; }
  const headers = Array.from(new Set(arr.flatMap(r => Object.keys(r))));
  const rows = [headers].concat(arr.map(r => headers.map(h => r[h] ?? '')));
  let html = '<table><thead><tr>' + headers.map(h => `<th>${escapeHtml(h)}</th>`).join('') + '</tr></thead><tbody>';
  for(const row of rows.slice(1)){
    html += '<tr>' + row.map(c => `<td>${escapeHtml(String(c))}</td>`).join('') + '</tr>';
  }
  html += '</tbody></table>';
  const blob = new Blob(['\ufeff'+html], {type:'application/vnd.ms-excel'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export function validatePhoneDigits(value){ return /^\d{6,15}$/.test(String(value || '').trim()); }
export function validateEmail(value){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim()); }
export function validateCUIT11(value){ return /^\d{11}$/.test(String(value || '').trim()); }

export function validateCP(value, jurisdiccion){
  const v = String(value || '').trim().toUpperCase();
  if(jurisdiccion === 'PBA' || jurisdiccion === 'BA'){ return /^\d{4}$/.test(v); }
  if(jurisdiccion === 'CABA'){ return /^\d{4}$/.test(v) || /^(C?\d{4}[A-Z]{3})$/.test(v); }
  return /^\d{4}$/.test(v);
}

export function formatDateISO(d){
  const dt = d instanceof Date ? d : new Date(d);
  const m = String(dt.getMonth() + 1).padStart(2,'0');
  const da = String(dt.getDate()).padStart(2,'0');
  return `${dt.getFullYear()}-${m}-${da}`;
}
export function nowISO(){ return formatDateISO(new Date()); }

export function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
