"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, Loader2, Pencil, Plus, Search, UserCheck, UserX, Wand2 } from "lucide-react";
import Modal from "@/components/Modal";
import { ROL_LABEL, type Rol } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { PerfilUsuario } from "@/lib/usuarios-tipos";
import { ROLES_VALIDOS, generarClave, validarClave, validarCorreo, validarNombre, normalizarNombre } from "@/lib/usuarios-validacion";
import { actualizarUsuario, crearUsuario, restablecerClave } from "./actions";

type ModalEstado =
  | { tipo: "crear" }
  | { tipo: "editar"; usuario: PerfilUsuario }
  | { tipo: "clave"; usuario: PerfilUsuario }
  | null;

interface Entrega {
  correo: string;
  clave: string;
  motivo: "creada" | "restablecida";
}

const COLOR_ROL: Record<Rol, string> = {
  administrador: "bg-violet-50 text-violet-700 ring-violet-200",
  operador: "bg-blue-50 text-blue-700 ring-blue-200",
  consultor: "bg-slate-100 text-slate-700 ring-slate-300",
};

export default function UsuariosTabla({ usuarios, yoId }: { usuarios: PerfilUsuario[]; yoId: string }) {
  const [q, setQ] = useState("");
  const [fRol, setFRol] = useState("");
  const [fEstado, setFEstado] = useState("");
  const [modal, setModal] = useState<ModalEstado>(null);
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "aviso" | "error"; texto: string } | null>(null);
  const [trabajando, setTrabajando] = useState<string | null>(null);

  const texto = q.trim().toLowerCase();
  const filtrados = usuarios.filter((u) => {
    if (texto && !u.nombre_completo.toLowerCase().includes(texto) && !u.correo.toLowerCase().includes(texto)) return false;
    if (fRol && u.rol !== fRol) return false;
    if (fEstado === "activo" && !u.activo) return false;
    if (fEstado === "inactivo" && u.activo) return false;
    return true;
  });

  async function alternarActivo(u: PerfilUsuario) {
    const accion = u.activo ? "desactivar" : "activar";
    const aviso = u.activo
      ? `¿Desactivar a ${u.nombre_completo}? No podrá iniciar sesión, pero su historial se conserva.`
      : `¿Activar de nuevo a ${u.nombre_completo}?`;
    if (!window.confirm(aviso)) return;

    setTrabajando(u.id);
    setMensaje(null);
    const res = await actualizarUsuario({
      id: u.id,
      nombre_completo: u.nombre_completo,
      rol: u.rol,
      activo: !u.activo,
    });
    setTrabajando(null);
    if (!res.ok) setMensaje({ tipo: "error", texto: res.error });
    else if (res.aviso) setMensaje({ tipo: "aviso", texto: res.aviso });
    else setMensaje({ tipo: "ok", texto: `Usuario ${accion === "desactivar" ? "desactivado" : "activado"} correctamente.` });
  }

  return (
    <div>
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Buscar por nombre o correo"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Buscar usuarios"
            />
          </div>
          <select className="input w-auto" value={fRol} onChange={(e) => setFRol(e.target.value)} aria-label="Filtrar por rol">
            <option value="">Todos los roles</option>
            {ROLES_VALIDOS.map((r) => (
              <option key={r} value={r}>{ROL_LABEL[r]}</option>
            ))}
          </select>
          <select className="input w-auto" value={fEstado} onChange={(e) => setFEstado(e.target.value)} aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
          <button className="btn-primary" onClick={() => setModal({ tipo: "crear" })}>
            <Plus className="h-4 w-4" /> Nuevo usuario
          </button>
        </div>
      </div>

      {mensaje && (
        <div
          role={mensaje.tipo === "error" ? "alert" : "status"}
          className={`mt-4 rounded-lg border p-3 text-sm ${
            mensaje.tipo === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : mensaje.tipo === "aviso"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <div className="card mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Nombre</th>
              <th className="px-4 py-3 font-semibold">Correo</th>
              <th className="px-4 py-3 font-semibold">Rol</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Creado</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtrados.map((u) => {
              const esYo = u.id === yoId;
              return (
                <tr key={u.id} className={u.activo ? "hover:bg-slate-50" : "bg-slate-50/60 text-slate-400"}>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {u.nombre_completo}
                    {esYo && <span className="ml-2 text-xs font-normal text-slate-400">(tú)</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.correo}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${COLOR_ROL[u.rol]}`}>
                      {ROL_LABEL[u.rol]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${u.activo ? "text-emerald-600" : "text-slate-500"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${u.activo ? "bg-emerald-500" : "bg-slate-400"}`} />
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" title="Editar" aria-label={`Editar a ${u.nombre_completo}`} onClick={() => setModal({ tipo: "editar", usuario: u })}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800" title="Restablecer contraseña" aria-label={`Restablecer contraseña de ${u.nombre_completo}`} onClick={() => setModal({ tipo: "clave", usuario: u })}>
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                        title={esYo ? "No puedes desactivar tu propia cuenta" : u.activo ? "Desactivar" : "Activar"}
                        aria-label={u.activo ? `Desactivar a ${u.nombre_completo}` : `Activar a ${u.nombre_completo}`}
                        disabled={esYo || trabajando === u.id}
                        onClick={() => alternarActivo(u)}
                      >
                        {trabajando === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : u.activo ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                  No hay usuarios con esos criterios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        {filtrados.length} de {usuarios.length} usuario{usuarios.length === 1 ? "" : "s"}. Los usuarios no se borran: se
        desactivan para conservar el historial de movimientos.
      </p>

      {modal?.tipo === "crear" && (
        <UsuarioModal
          onClose={() => setModal(null)}
          onListo={(correo, clave) => {
            setModal(null);
            setEntrega({ correo, clave, motivo: "creada" });
          }}
        />
      )}
      {modal?.tipo === "editar" && (
        <UsuarioModal
          usuario={modal.usuario}
          esYo={modal.usuario.id === yoId}
          onClose={() => setModal(null)}
          onListo={(_c, _k, aviso) => {
            setModal(null);
            setMensaje(aviso ? { tipo: "aviso", texto: aviso } : { tipo: "ok", texto: "Usuario actualizado correctamente." });
          }}
        />
      )}
      {modal?.tipo === "clave" && (
        <ClaveModal
          usuario={modal.usuario}
          onClose={() => setModal(null)}
          onListo={(clave) => {
            setEntrega({ correo: modal.usuario.correo, clave, motivo: "restablecida" });
            setModal(null);
          }}
        />
      )}
      {entrega && <EntregaModal entrega={entrega} onClose={() => setEntrega(null)} />}
    </div>
  );
}

/* ----------------------------- Crear / editar ----------------------------- */

function UsuarioModal({
  usuario,
  esYo,
  onClose,
  onListo,
}: {
  usuario?: PerfilUsuario;
  esYo?: boolean;
  onClose: () => void;
  onListo: (correo: string, clave: string, aviso?: string) => void;
}) {
  const editando = Boolean(usuario);
  const [nombre, setNombre] = useState(usuario?.nombre_completo ?? "");
  const [correo, setCorreo] = useState(usuario?.correo ?? "");
  const [rol, setRol] = useState<Rol>(usuario?.rol ?? "operador");
  const [activo, setActivo] = useState(usuario?.activo ?? true);
  const [clave, setClave] = useState(() => (editando ? "" : generarClave()));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nombreLimpio = normalizarNombre(nombre);
    const err =
      validarNombre(nombreLimpio) ??
      (editando ? null : validarCorreo(correo.trim().toLowerCase())) ??
      (editando ? null : validarClave(clave));
    if (err) return setError(err);

    setGuardando(true);
    const res = editando
      ? await actualizarUsuario({ id: usuario!.id, nombre_completo: nombreLimpio, rol, activo })
      : await crearUsuario({ nombre_completo: nombreLimpio, correo: correo.trim().toLowerCase(), rol, password: clave });
    setGuardando(false);

    if (!res.ok) return setError(res.error);
    onListo(correo.trim().toLowerCase(), clave, res.aviso);
  }

  return (
    <Modal titulo={editando ? "Editar usuario" : "Nuevo usuario"} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="u-nombre" className="label">Nombre completo *</label>
          <input id="u-nombre" className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={100} autoFocus />
        </div>
        <div>
          <label htmlFor="u-correo" className="label">Correo *</label>
          <input id="u-correo" type="email" className="input" value={correo} onChange={(e) => setCorreo(e.target.value)} maxLength={120} disabled={editando} />
          {editando && <p className="mt-1 text-xs text-slate-400">El correo no se puede cambiar.</p>}
        </div>
        <div>
          <label htmlFor="u-rol" className="label">Rol *</label>
          <select id="u-rol" className="input" value={rol} onChange={(e) => setRol(e.target.value as Rol)} disabled={esYo}>
            {ROLES_VALIDOS.map((r) => (
              <option key={r} value={r}>{ROL_LABEL[r]}</option>
            ))}
          </select>
          {esYo && <p className="mt-1 text-xs text-slate-400">No puedes cambiar tu propio rol.</p>}
        </div>

        {editando ? (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-200" checked={activo} onChange={(e) => setActivo(e.target.checked)} disabled={esYo} />
            Usuario activo (puede iniciar sesión)
          </label>
        ) : (
          <div>
            <label htmlFor="u-clave" className="label">Contraseña temporal *</label>
            <div className="flex gap-2">
              <input id="u-clave" className="input font-mono" value={clave} onChange={(e) => setClave(e.target.value)} maxLength={72} autoComplete="off" />
              <button type="button" className="btn-secondary shrink-0" onClick={() => setClave(generarClave())} title="Generar otra">
                <Wand2 className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-400">Mínimo 8 caracteres con letras y números. El usuario podrá cambiarla en Mi cuenta.</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            {editando ? "Guardar cambios" : "Crear usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------- Restablecer contrasena ------------------------- */

function ClaveModal({
  usuario,
  onClose,
  onListo,
}: {
  usuario: PerfilUsuario;
  onClose: () => void;
  onListo: (clave: string) => void;
}) {
  const [clave, setClave] = useState(() => generarClave());
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const err = validarClave(clave);
    if (err) return setError(err);

    setGuardando(true);
    const res = await restablecerClave({ id: usuario.id, password: clave });
    setGuardando(false);
    if (!res.ok) return setError(res.error);
    onListo(clave);
  }

  return (
    <Modal titulo="Restablecer contraseña" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <p className="text-sm text-slate-600">
          Define una contraseña temporal para <strong>{usuario.nombre_completo}</strong> ({usuario.correo}).
        </p>
        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="c-clave" className="label">Nueva contraseña temporal</label>
          <div className="flex gap-2">
            <input id="c-clave" className="input font-mono" value={clave} onChange={(e) => setClave(e.target.value)} maxLength={72} autoComplete="off" autoFocus />
            <button type="button" className="btn-secondary shrink-0" onClick={() => setClave(generarClave())} title="Generar otra">
              <Wand2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={guardando}>
            {guardando && <Loader2 className="h-4 w-4 animate-spin" />}
            Restablecer
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------------------- Entrega de la clave temporal ---------------------- */

function EntregaModal({ entrega, onClose }: { entrega: Entrega; onClose: () => void }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(`Correo: ${entrega.correo}\nContraseña temporal: ${entrega.clave}`);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <Modal titulo={entrega.motivo === "creada" ? "Usuario creado" : "Contraseña restablecida"} onClose={onClose}>
      <p className="text-sm text-slate-600">
        Entrega estos datos al usuario. <strong>La contraseña no se volverá a mostrar</strong>; podrá cambiarla desde
        Mi cuenta.
      </p>
      <dl className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Correo</dt>
          <dd className="mt-0.5 font-medium text-slate-800">{entrega.correo}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Contraseña temporal</dt>
          <dd className="mt-0.5 font-mono text-base font-semibold text-slate-900">{entrega.clave}</dd>
        </div>
      </dl>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn-secondary" onClick={copiar}>
          {copiado ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {copiado ? "Copiado" : "Copiar datos"}
        </button>
        <button className="btn-primary" onClick={onClose}>Listo</button>
      </div>
    </Modal>
  );
}
