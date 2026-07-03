/* LearnersSection.jsx
   Gestión de learners — crear individual, carga en lote vía Excel, listado

   FIX: useEffect ahora corre solo una vez al montar (array vacío)
   en vez de depender de `load`.

   NUEVO: botón para descargar la plantilla Excel desde el modal de carga masiva
*/

import { useState, useEffect, useRef, useCallback } from "react";
import { useAdminApi } from "../useAdminApi";

const css = `
  .toolbar {
    display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;
  }
  .btn {
    font-family: var(--sans); font-size: 13px; font-weight: 600;
    border: none; border-radius: var(--r); padding: 9px 16px;
    cursor: pointer; transition: background .15s, transform .1s;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .btn:active { transform: scale(.97); }
  .btn-primary { background: var(--blue); color: #fff; }
  .btn-primary:hover { background: var(--blue-dk); }
  .btn-ghost {
    background: var(--surface); color: var(--text);
    border: 1px solid var(--border);
  }
  .btn-ghost:hover { border-color: var(--xdim); }
  .btn-link {
    background: none; border: none; color: var(--blue);
    font-size: 12.5px; font-weight: 600; cursor: pointer;
    padding: 0; text-decoration: none;
  }
  .btn-link:hover { color: var(--blue-dk); text-decoration: underline; }
  .btn:disabled { opacity: .5; cursor: not-allowed; }

  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r-lg); overflow: hidden;
  }

  table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  thead th {
    text-align: left; font-weight: 600; color: var(--dim);
    font-size: 11.5px; text-transform: uppercase; letter-spacing: .03em;
    padding: 11px 16px; background: var(--surface2);
    border-bottom: 1px solid var(--border);
  }
  tbody td { padding: 11px 16px; border-bottom: 1px solid var(--border); }
  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover { background: var(--surface2); }

  .pill {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11.5px; font-weight: 600; padding: 2px 9px;
    border-radius: 20px; font-family: var(--mono);
  }
  .pill-active   { background: var(--green-bg); color: var(--green); }
  .pill-inactive { background: var(--red-bg); color: var(--red); }
  .pill-cohort   { background: var(--blue-light); color: var(--blue-dk); }

  .empty-state {
    padding: 48px 24px; text-align: center; color: var(--dim);
  }
  .empty-icon { font-size: 32px; margin-bottom: 10px; opacity: .6; }

  .overlay {
    position: fixed; inset: 0; background: rgba(20,22,26,.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 50; padding: 20px;
  }
  .modal {
    background: var(--surface); border-radius: var(--r-lg);
    width: 100%; max-width: 440px;
    box-shadow: 0 12px 48px rgba(0,0,0,.18);
  }
  .modal-header {
    padding: 18px 22px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .modal-title { font-size: 15px; font-weight: 600; }
  .modal-close {
    background: none; border: none; cursor: pointer;
    color: var(--xdim); font-size: 18px; padding: 2px 6px;
  }
  .modal-body { padding: 20px 22px; }
  .modal-footer {
    padding: 14px 22px; border-top: 1px solid var(--border);
    display: flex; justify-content: flex-end; gap: 8px;
  }

  .field { margin-bottom: 14px; }
  .field label { display: block; font-size: 12.5px; font-weight: 500; margin-bottom: 6px; color: var(--text); }
  .field input, .field select {
    width: 100%; font-family: var(--sans); font-size: 13.5px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: var(--r); padding: 9px 12px; outline: none;
    transition: border-color .15s;
  }
  .field input:focus, .field select:focus { border-color: var(--blue); background: #fff; }
  .field-hint { font-size: 11.5px; color: var(--xdim); margin-top: 4px; }

  .dropzone {
    border: 1.5px dashed var(--border); border-radius: var(--r);
    padding: 28px 20px; text-align: center; cursor: pointer;
    transition: border-color .15s, background .15s;
  }
  .dropzone:hover, .dropzone.dragover { border-color: var(--blue); background: var(--blue-light); }
  .dropzone-icon { font-size: 28px; margin-bottom: 8px; }
  .dropzone-text { font-size: 13px; color: var(--dim); }
  .dropzone-file { font-size: 13px; font-weight: 600; color: var(--text); margin-top: 4px; }

  .results-list {
    max-height: 260px; overflow-y: auto;
    border: 1px solid var(--border); border-radius: var(--r);
    margin-top: 14px;
  }
  .result-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 9px 14px; border-bottom: 1px solid var(--border);
    font-size: 12.5px;
  }
  .result-row:last-child { border-bottom: none; }
  .result-email { font-family: var(--mono); }
  .result-pass  { font-family: var(--mono); color: var(--blue-dk); font-weight: 600; }

  .alert {
    padding: 10px 14px; border-radius: var(--r);
    font-size: 13px; margin-bottom: 14px;
    display: flex; gap: 8px; align-items: flex-start;
    justify-content: space-between;
  }
  .alert-error   { background: var(--red-bg); color: var(--red); }
  .alert-success { background: var(--green-bg); color: var(--green); }
  .alert-info    { background: var(--blue-light); color: var(--blue-dk); align-items: center; }
`;

export default function LearnersSection() {
  const api = useAdminApi();
  const [learners, setLearners] = useState(null);
  const [error,     setError]   = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showBulk,   setShowBulk]   = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.listLearners();
      setLearners(data);
    } catch (err) {
      setError(err.message);
    }
  }, [api]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <div className="card">
        {learners === null ? (
          <div className="empty-state">Cargando…</div>
        ) : learners.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <div>Aún no hay learners registrados.</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Cohorte</th>
                <th>Estado</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {learners.map(l => (
                <tr key={l.id}>
                  <td>{l.full_name}</td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: "12.5px" }}>{l.email}</td>
                  <td><span className="pill pill-cohort">Cohorte {l.cohort}</span></td>
                  <td>
                    <span className={`pill ${l.active ? "pill-active" : "pill-inactive"}`}>
                      {l.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={{ color: "var(--dim)", fontSize: "12.5px" }}>
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

function CreateLearnerModal({ onClose, onCreated }) {
  const api = useAdminApi();
  const [form, setForm] = useState({ full_name: "", email: "", cohort: 9 });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [result, setResult]   = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      const res = await api.createLearner(form);
      if (res.status === "failed") throw new Error(res.error || "No se pudo crear el usuario");
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
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
                <input
                  value={form.full_name}
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Juan Pérez" required disabled={loading}
                />
              </div>
              <div className="field">
                <label>Correo electrónico</label>
                <input
                  type="email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="juan.perez@generacion.org" required disabled={loading}
                />
              </div>
              <div className="field">
                <label>Cohorte</label>
                <input
                  type="number" value={form.cohort}
                  onChange={e => setForm({ ...form, cohort: Number(e.target.value) })}
                  required disabled={loading}
                />
                <div className="field-hint">La contraseña se genera automáticamente.</div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Creando…" : "Crear learner"}
              </button>
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
              <div className="field-hint" style={{ marginTop: 10 }}>
                Copia esta contraseña ahora — no se mostrará de nuevo.
              </div>
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

function BulkUploadModal({ onClose, onDone }) {
  const api = useAdminApi();
  const [file, setFile]       = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError]     = useState(null);
  const [result, setResult]   = useState(null);
  const inputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setError("Solo se aceptan archivos .xlsx o .xls");
      return;
    }
    setError(null);
    setFile(f);
  };

  const handleDownloadTemplate = async () => {
    setDownloading(true);
    setError(null);
    try {
      await api.downloadLearnersTemplate();
    } catch (err) {
      setError("No se pudo descargar la plantilla: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const submit = async () => {
    if (!file) return;
    setLoading(true); setError(null);
    try {
      const res = await api.bulkCreateLearners(file);
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    const rows = result.results.map(r =>
      `${r.email},${r.password || ""},${r.status}${r.error ? "," + r.error : ""}`
    );
    const csv = "email,password,status,error\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "learners_creados.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div className="modal-title">Importar learners desde Excel</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">⚠ {error}</div>}

          {!result && (
            <>
              <div className="alert alert-info">
                <span>
                  Columnas requeridas: <strong>full_name</strong>, <strong>email</strong>, <strong>cohort</strong>.
                  La columna <strong>password</strong> es opcional.
                </span>
              </div>

              <button
                className="btn-link"
                onClick={handleDownloadTemplate}
                disabled={downloading}
                style={{ marginBottom: 16 }}
              >
                {downloading ? "Descargando…" : "⬇ Descargar plantilla Excel"}
              </button>

              <div
                className={`dropzone ${dragOver ? "dragover" : ""}`}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault(); setDragOver(false);
                  handleFile(e.dataTransfer.files[0]);
                }}
              >
                <div className="dropzone-icon">📄</div>
                {file ? (
                  <div className="dropzone-file">{file.name}</div>
                ) : (
                  <div className="dropzone-text">
                    Arrastra el archivo aquí o haz clic para seleccionar
                  </div>
                )}
                <input
                  ref={inputRef} type="file" accept=".xlsx,.xls"
                  style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>
            </>
          )}

          {result && (
            <>
              <div className="alert alert-success">
                ✓ {result.created} de {result.total} learners creados
                {result.failed > 0 && ` · ${result.failed} fallaron`}
              </div>
              <div className="results-list">
                {result.results.map((r, i) => (
                  <div className="result-row" key={i}>
                    <span className="result-email">{r.email}</span>
                    {r.status === "created" ? (
                      <span className="result-pass">{r.password}</span>
                    ) : (
                      <span style={{ color: "var(--red)" }}>{r.error}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="field-hint" style={{ marginTop: 10 }}>
                Descarga el CSV con las contraseñas antes de cerrar — no se vuelven a mostrar.
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          {!result ? (
            <>
              <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary" onClick={submit} disabled={!file || loading}>
                {loading ? "Procesando…" : "Importar"}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={downloadResults}>⬇ Descargar CSV</button>
              <button className="btn btn-primary" onClick={() => { onDone(); onClose(); }}>Listo</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}