/* LearnersSection.jsx
   Gestión de learners — crear individual, carga en lote vía Excel, listado

   FIX: useEffect ahora corre solo una vez al montar (array vacío)
   en vez de depender de `load`.

   NUEVO: botón para descargar la plantilla Excel desde el modal de carga masiva
*/
/* LearnersSection.jsx
   - Filtro por cohorte
   - Toggle activo/inactivo por learner
   - Crear individual y carga masiva desde Excel
*/

import { useState, useEffect, useRef, useCallback } from "react";
import { useAdminApi } from "../useAdminApi";

const css = `
  /* ── Toolbar ── */
  .toolbar { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; align-items:center; }

  .btn {
    font-family:var(--sans); font-size:13px; font-weight:600;
    border:none; border-radius:var(--r); padding:9px 16px;
    cursor:pointer; transition:background .15s,transform .1s;
    display:inline-flex; align-items:center; gap:6px; white-space:nowrap;
  }
  .btn:active { transform:scale(.97); }
  .btn-primary { background:var(--blue); color:#fff; }
  .btn-primary:hover { background:var(--blue-dk); }
  .btn-ghost { background:var(--surface); color:var(--text); border:1px solid var(--border); }
  .btn-ghost:hover { border-color:var(--xdim); }
  .btn:disabled { opacity:.5; cursor:not-allowed; }

  /* ── Filtros de cohorte ── */
  .cohort-filters { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px; }
  .cohort-chip {
    font-size:12px; font-weight:600; font-family:var(--mono);
    padding:5px 12px; border-radius:20px;
    border:1px solid var(--border); background:var(--surface);
    cursor:pointer; color:var(--dim); transition:all .15s;
  }
  .cohort-chip.active { background:var(--blue); color:#fff; border-color:var(--blue); }
  .cohort-chip:hover:not(.active) { border-color:var(--blue); color:var(--blue-dk); }

  /* ── Stats bar ── */
  .stats-bar {
    display:flex; gap:16px; margin-bottom:16px;
    font-size:12.5px; color:var(--dim);
  }
  .stat-item { display:flex; align-items:center; gap:5px; }
  .stat-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .stat-dot.active   { background:var(--green); }
  .stat-dot.inactive { background:var(--red); }
  .stat-num  { font-weight:700; color:var(--text); font-family:var(--mono); }

  /* ── Tabla ── */
  .card { background:var(--surface); border:1px solid var(--border); border-radius:var(--r-lg); overflow:hidden; }
  table { width:100%; border-collapse:collapse; font-size:13.5px; }
  thead th {
    text-align:left; font-weight:600; color:var(--dim);
    font-size:11.5px; text-transform:uppercase; letter-spacing:.03em;
    padding:11px 16px; background:var(--surface2); border-bottom:1px solid var(--border);
  }
  tbody td { padding:10px 16px; border-bottom:1px solid var(--border); vertical-align:middle; }
  tbody tr:last-child td { border-bottom:none; }
  tbody tr { transition:background .1s; }
  tbody tr:hover { background:var(--surface2); }
  tbody tr.inactive-row { opacity:.65; }

  .pill { display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:600; padding:2px 9px; border-radius:20px; font-family:var(--mono); }
  .pill-active   { background:var(--green-bg); color:var(--green); }
  .pill-inactive { background:var(--red-bg); color:var(--red); }
  .pill-cohort   { background:var(--blue-light); color:var(--blue-dk); }

  /* ── Toggle de activación ── */
  .toggle-wrap { display:flex; align-items:center; gap:8px; }
  .toggle {
    position:relative; width:38px; height:22px; flex-shrink:0;
    background:var(--border); border-radius:11px; cursor:pointer;
    border:none; transition:background .2s;
  }
  .toggle.on  { background:var(--green); }
  .toggle-knob {
    position:absolute; top:2px; left:2px;
    width:18px; height:18px; border-radius:50%;
    background:#fff; transition:transform .2s;
    box-shadow:0 1px 3px rgba(0,0,0,.2);
  }
  .toggle.on .toggle-knob { transform:translateX(16px); }
  .toggle:disabled { opacity:.5; cursor:not-allowed; }
  .toggle-label { font-size:12px; color:var(--dim); }

  .empty-state { padding:48px 24px; text-align:center; color:var(--dim); }
  .empty-icon  { font-size:32px; margin-bottom:10px; opacity:.6; }

  /* ── Modales ── */
  .overlay {
    position:fixed; inset:0; background:rgba(20,22,26,.45);
    display:flex; align-items:center; justify-content:center; z-index:50; padding:20px;
  }
  .modal { background:var(--surface); border-radius:var(--r-lg); width:100%; max-width:440px; box-shadow:0 12px 48px rgba(0,0,0,.18); }
  .modal-header { padding:18px 22px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .modal-title  { font-size:15px; font-weight:600; }
  .modal-close  { background:none; border:none; cursor:pointer; color:var(--xdim); font-size:18px; padding:2px 6px; }
  .modal-body   { padding:20px 22px; }
  .modal-footer { padding:14px 22px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:8px; }

  .field { margin-bottom:14px; }
  .field label { display:block; font-size:12.5px; font-weight:500; margin-bottom:6px; }
  .field input {
    width:100%; font-family:var(--sans); font-size:13.5px;
    background:var(--surface2); border:1px solid var(--border);
    border-radius:var(--r); padding:9px 12px; outline:none; transition:border-color .15s;
  }
  .field input:focus { border-color:var(--blue); background:#fff; }
  .field-hint { font-size:11.5px; color:var(--xdim); margin-top:4px; }

  .dropzone {
    border:1.5px dashed var(--border); border-radius:var(--r);
    padding:28px 20px; text-align:center; cursor:pointer; transition:all .15s;
  }
  .dropzone:hover,.dropzone.dragover { border-color:var(--blue); background:var(--blue-light); }
  .dropzone-icon { font-size:28px; margin-bottom:8px; }
  .dropzone-text { font-size:13px; color:var(--dim); }
  .dropzone-file { font-size:13px; font-weight:600; margin-top:4px; }

  .results-list { max-height:240px; overflow-y:auto; border:1px solid var(--border); border-radius:var(--r); margin-top:12px; }
  .result-row   { display:flex; justify-content:space-between; padding:9px 14px; border-bottom:1px solid var(--border); font-size:12.5px; }
  .result-row:last-child { border-bottom:none; }
  .result-email { font-family:var(--mono); }
  .result-pass  { font-family:var(--mono); color:var(--blue-dk); font-weight:600; }

  .alert { padding:10px 14px; border-radius:var(--r); font-size:13px; margin-bottom:14px; display:flex; gap:8px; }
  .alert-error   { background:var(--red-bg); color:var(--red); }
  .alert-success { background:var(--green-bg); color:var(--green); }
  .alert-info    { background:var(--blue-light); color:var(--blue-dk); align-items:center; }
  .btn-link { background:none; border:none; color:var(--blue); font-size:12.5px; font-weight:600; cursor:pointer; padding:0; }
  .btn-link:hover { text-decoration:underline; color:var(--blue-dk); }
`;

export default function LearnersSection() {
  const api = useAdminApi();
  const [learners,    setLearners]    = useState(null);
  const [error,       setError]       = useState(null);
  const [cohortFilter, setCohortFilter] = useState("all");
  const [toggling,    setToggling]    = useState({});  // { id: true } mientras carga
  const [showCreate,  setShowCreate]  = useState(false);
  const [showBulk,    setShowBulk]    = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.listLearners();
      setLearners(data);
    } catch (err) {
      setError(err.message);
    }
  }, [api]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  // Cohortes disponibles para los chips de filtro
  const cohorts = learners
    ? [...new Set(learners.map(l => l.cohort).filter(Boolean))].sort((a, b) => b - a)
    : [];

  // Learners filtrados por cohorte seleccionada
  const filtered = learners?.filter(l =>
    cohortFilter === "all" || String(l.cohort) === String(cohortFilter)
  ) ?? [];

  const activeCount   = filtered.filter(l => l.active).length;
  const inactiveCount = filtered.filter(l => !l.active).length;

  // Toggle activar/desactivar learner
  const handleToggle = async (learner) => {
    setToggling(prev => ({ ...prev, [learner.id]: true }));
    try {
      await api.updateLearner(learner.id, { active: !learner.active });
      setLearners(prev => prev.map(l =>
        l.id === learner.id ? { ...l, active: !l.active } : l
      ));
    } catch (err) {
      setError(`No se pudo ${learner.active ? "desactivar" : "activar"} al learner: ${err.message}`);
    } finally {
      setToggling(prev => ({ ...prev, [learner.id]: false }));
    }
  };

  return (
    <>
      <style>{css}</style>

      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Nuevo learner
        </button>
        <button className="btn btn-ghost" onClick={() => setShowBulk(true)}>
          📥 Importar Excel
        </button>
        <button className="btn btn-ghost" onClick={load}>↻ Actualizar</button>
      </div>

      {error && <div className="alert alert-error">⚠ {error}</div>}

      {/* Filtros por cohorte */}
      {cohorts.length > 0 && (
        <div className="cohort-filters">
          <button
            className={`cohort-chip ${cohortFilter === "all" ? "active" : ""}`}
            onClick={() => setCohortFilter("all")}
          >
            Todas las cohortes
          </button>
          {cohorts.map(c => (
            <button
              key={c}
              className={`cohort-chip ${String(cohortFilter) === String(c) ? "active" : ""}`}
              onClick={() => setCohortFilter(c)}
            >
              Cohorte {c}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      {filtered.length > 0 && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-dot active" />
            <span className="stat-num">{activeCount}</span>
            <span>activos</span>
          </div>
          <div className="stat-item">
            <span className="stat-dot inactive" />
            <span className="stat-num">{inactiveCount}</span>
            <span>inactivos</span>
          </div>
          <div className="stat-item">
            <span>Total: <strong>{filtered.length}</strong></span>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="card">
        {learners === null ? (
          <div className="empty-state">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <div>{cohortFilter === "all" ? "Aún no hay learners registrados." : `No hay learners en la cohorte ${cohortFilter}.`}</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Cohorte</th>
                <th>Acceso</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className={!l.active ? "inactive-row" : ""}>
                  <td style={{ fontWeight: 500 }}>{l.full_name}</td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: "12px" }}>{l.email}</td>
                  <td>
                    <span className="pill pill-cohort">C{l.cohort}</span>
                  </td>
                  <td>
                    <div className="toggle-wrap">
                      <button
                        className={`toggle ${l.active ? "on" : ""}`}
                        onClick={() => handleToggle(l)}
                        disabled={toggling[l.id]}
                        title={l.active ? "Desactivar acceso" : "Activar acceso"}
                      >
                        <span className="toggle-knob" />
                      </button>
                      <span className="toggle-label">
                        {toggling[l.id] ? "…" : l.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </td>
                  <td style={{ color: "var(--dim)", fontSize: "12px" }}>
                    {new Date(l.created_at).toLocaleDateString("es-CO")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateLearnerModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
      {showBulk && (
        <BulkUploadModal
          onClose={() => setShowBulk(false)}
          onDone={() => load()}
        />
      )}
    </>
  );
}

/* ── Modal: crear learner individual ── */
function CreateLearnerModal({ onClose, onCreated }) {
  const api = useAdminApi();
  const [form,    setForm]    = useState({ full_name: "", email: "", cohort: 9 });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [result,  setResult]  = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const res = await api.createLearner(form);
      if (res.status === "failed") throw new Error(res.error || "No se pudo crear el usuario");
      setResult(res);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">Nuevo learner</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {!result ? (
          <form onSubmit={submit}>
            <div className="modal-body">
              {error && <div className="alert alert-error">⚠ {error}</div>}
              <div className="field">
                <label>Nombre completo</label>
                <input value={form.full_name} onChange={e => setForm({...form,full_name:e.target.value})} placeholder="Juan Pérez" required disabled={loading}/>
              </div>
              <div className="field">
                <label>Correo electrónico</label>
                <input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="juan@empresa.com" required disabled={loading}/>
              </div>
              <div className="field">
                <label>Cohorte</label>
                <input type="number" value={form.cohort} onChange={e => setForm({...form,cohort:Number(e.target.value)})} required disabled={loading}/>
                <div className="field-hint">La contraseña se genera automáticamente.</div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading?"Creando…":"Crear learner"}</button>
            </div>
          </form>
        ) : (
          <>
            <div className="modal-body">
              <div className="alert alert-success">✓ Learner creado correctamente</div>
              <div className="results-list">
                <div className="result-row">
                  <span className="result-email">{result.email}</span>
                  <span className="result-pass">{result.password}</span>
                </div>
              </div>
              <div className="field-hint" style={{marginTop:10}}>Copia esta contraseña ahora — no se mostrará de nuevo.</div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={onCreated}>Listo</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Modal: carga masiva Excel ── */
function BulkUploadModal({ onClose, onDone }) {
  const api = useAdminApi();
  const [file,       setFile]       = useState(null);
  const [dragOver,   setDragOver]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [downloading,setDownloading]= useState(false);
  const [error,      setError]      = useState(null);
  const [result,     setResult]     = useState(null);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) { setError("Solo se aceptan .xlsx o .xls"); return; }
    setError(null); setFile(f);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try { await api.downloadLearnersTemplate(); }
    catch (err) { setError("No se pudo descargar la plantilla: " + err.message); }
    finally { setDownloading(false); }
  };

  const submit = async () => {
    if (!file) return;
    setLoading(true); setError(null);
    try { setResult(await api.bulkCreateLearners(file)); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const downloadResults = () => {
    const csv = "email,password,status,error\n" +
      result.results.map(r => `${r.email},${r.password||""},${r.status}${r.error?","+r.error:""}`).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = "learners_creados.csv"; a.click();
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{maxWidth:500}}>
        <div className="modal-header">
          <div className="modal-title">Importar learners desde Excel</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error">⚠ {error}</div>}
          {!result && (
            <>
              <div className="alert alert-info">
                <span>Columnas: <strong>full_name</strong>, <strong>email</strong>, <strong>cohort</strong>. La columna <strong>password</strong> es opcional.</span>
              </div>
              <button className="btn-link" onClick={handleDownload} disabled={downloading} style={{marginBottom:14}}>
                {downloading?"Descargando…":"⬇ Descargar plantilla Excel"}
              </button>
              <div
                className={`dropzone ${dragOver?"dragover":""}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0])}}
              >
                <div className="dropzone-icon">📄</div>
                {file
                  ? <div className="dropzone-file">{file.name}</div>
                  : <div className="dropzone-text">Arrastra el archivo o haz clic para seleccionar</div>}
                <input ref={inputRef} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
              </div>
            </>
          )}
          {result && (
            <>
              <div className="alert alert-success">✓ {result.created} de {result.total} learners creados{result.failed>0&&` · ${result.failed} fallaron`}</div>
              <div className="results-list">
                {result.results.map((r,i)=>(
                  <div className="result-row" key={i}>
                    <span className="result-email">{r.email}</span>
                    {r.status==="created"
                      ? <span className="result-pass">{r.password}</span>
                      : <span style={{color:"var(--red)"}}>{r.error}</span>}
                  </div>
                ))}
              </div>
              <div className="field-hint" style={{marginTop:10}}>Descarga el CSV con las contraseñas antes de cerrar.</div>
            </>
          )}
        </div>
        <div className="modal-footer">
          {!result ? (
            <>
              <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary" onClick={submit} disabled={!file||loading}>{loading?"Procesando…":"Importar"}</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={downloadResults}>⬇ Descargar CSV</button>
              <button className="btn btn-primary" onClick={()=>{onDone();onClose();}}>Listo</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}