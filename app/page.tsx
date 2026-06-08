"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL!;

type TasarResponse = {
  valor_m2_usd: number;
  valor_total_usd: number;
  rango_min_usd: number;
  rango_max_usd: number;
  intervalo_pct: number;
  modelo_usado: string;
  mape_cv: number | null;
  n_entrenamiento: number | null;
  ciudad_display: string;
  advertencias: string[];
};

const ESCENARIOS = [
  { label: "Conservador", rate: -0.03, color: "#ef4444", bg: "#fef2f2", border: "#fecaca" },
  { label: "Moderado",    rate:  0.04, color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" },
  { label: "Optimista",   rate:  0.10, color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0" },
];
const AÑOS = [1, 2, 3];
const DORMITORIOS = [0, 1, 2, 3, 4, 5, 6];
const BANOS      = [0, 1, 2, 3, 4];
const AMBIENTES  = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const COCHERAS   = [0, 1, 2];

const fmtUSD = (n: number) =>
  new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(n));

const proyectar = (base: number, rate: number, years: number) =>
  base * Math.pow(1 + rate, years);

export default function Home() {
  const [barrios, setBarrios]   = useState<string[]>([]);
  const [loading, setLoading]   = useState(false);
  const [slowStart, setSlowStart] = useState(false);
  const [resultado, setResultado] = useState<TasarResponse | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [form, setForm] = useState({
    tipo_propiedad: "Departamento",
    barrio: "Centro",
    superficie_cubierta: "",
    superficie_terreno: "",
    dormitorios: 2,
    banos: 1,
    ambientes: 3,
    cocheras: 0,
    tiene_pileta: false,
  });

  useEffect(() => {
    fetch(`${API}/barrios?ciudad=sma`)
      .then(r => r.json())
      .then(d => setBarrios(d.barrios ?? []))
      .catch(() => {});
  }, []);

  function set(key: string, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResultado(null);
    setLoading(true);
    setSlowStart(false);
    const timer = setTimeout(() => setSlowStart(true), 5000);
    try {
      const res = await fetch(`${API}/tasar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciudad: "sma",
          tipo_propiedad: form.tipo_propiedad,
          barrio: form.barrio,
          superficie_cubierta: Number(form.superficie_cubierta),
          superficie_terreno: form.superficie_terreno ? Number(form.superficie_terreno) : undefined,
          dormitorios: form.dormitorios,
          banos: form.banos,
          ambientes: form.ambientes,
          cocheras: form.cocheras,
          tiene_pileta: form.tiene_pileta,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Error ${res.status}`);
      }
      setResultado(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setSlowStart(false);
    }
  }

  const esDepto = form.tipo_propiedad === "Departamento";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header style={{ background: "var(--navy)" }} className="px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                 style={{ background: "var(--emerald)" }}>T</div>
            <span className="text-white font-semibold text-sm tracking-tight">TasadorSMA</span>
          </div>
          <span className="text-slate-400 text-xs hidden sm:block">
            San Martín de los Andes · Patagonia
          </span>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <section style={{ background: "var(--navy)" }} className="px-6 pb-14 pt-10">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl">
            <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-3">
              Tasación inmobiliaria con IA
            </p>
            <h1 className="text-white text-3xl sm:text-4xl font-bold leading-tight mb-3">
              Conocé el valor real<br />de tu propiedad
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Modelo entrenado con propiedades reales del mercado de SMA.
              Tasación instantánea con proyección de valor a 3 años.
            </p>
            {/* KPIs */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Error promedio", value: "16.1%", sub: "MAPE CV" },
                { label: "Propiedades analizadas", value: "342", sub: "Deptos + Casas" },
                { label: "Barrios cubiertos", value: "38", sub: "San Martín de los Andes" },
              ].map(kpi => (
                <div key={kpi.label}
                     className="px-4 py-3 rounded-xl"
                     style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <p className="text-white font-bold text-lg leading-none">{kpi.value}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{kpi.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-6">

        {/* ── FORMULARIO ─────────────────────────────────────────── */}
        <form onSubmit={handleSubmit}
              className="rounded-2xl p-6 sm:p-8 space-y-6"
              style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

          <div className="flex items-center justify-between">
            <h2 className="font-bold text-lg" style={{ color: "var(--navy)" }}>Datos de la propiedad</h2>
            <span className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ background: "#ecfdf5", color: "var(--emerald-dark)" }}>
              Gratis
            </span>
          </div>

          {/* Tipo */}
          <div className="flex gap-2">
            {["Departamento", "Casa"].map(tipo => (
              <button key={tipo} type="button" onClick={() => set("tipo_propiedad", tipo)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={form.tipo_propiedad === tipo
                        ? { background: "var(--navy)", color: "white" }
                        : { background: "var(--bg)", color: "var(--slate)", border: "1px solid var(--border)" }}>
                {tipo}
              </button>
            ))}
          </div>

          {/* Barrio */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--slate)" }}>
              Barrio
            </label>
            <select value={form.barrio} onChange={e => set("barrio", e.target.value)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm"
                    style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--navy)" }}>
              {barrios.length > 0
                ? barrios.map(b => <option key={b}>{b}</option>)
                : <option>Centro</option>}
            </select>
          </div>

          {/* Superficies */}
          <div className={`grid gap-4 ${esDepto ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2"}`}>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--slate)" }}>
                Superficie cubierta (m²)
              </label>
              <input type="number" min="1" max="1000" placeholder="75" required
                     value={form.superficie_cubierta}
                     onChange={e => set("superficie_cubierta", e.target.value)}
                     className="w-full rounded-xl px-3 py-2.5 text-sm font-medium"
                     style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--navy)" }} />
            </div>
            {!esDepto && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--slate)" }}>
                  Superficie terreno (m²)
                </label>
                <input type="number" min="1" max="50000" placeholder="600"
                       value={form.superficie_terreno}
                       onChange={e => set("superficie_terreno", e.target.value)}
                       className="w-full rounded-xl px-3 py-2.5 text-sm font-medium"
                       style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--navy)" }} />
              </div>
            )}
          </div>

          {/* Selects */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Dormitorios", key: "dormitorios", opts: DORMITORIOS },
              { label: "Baños",       key: "banos",       opts: BANOS },
              { label: "Ambientes",   key: "ambientes",   opts: AMBIENTES },
              { label: "Cocheras",    key: "cocheras",    opts: COCHERAS },
            ].map(({ label, key, opts }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--slate)" }}>
                  {label}
                </label>
                <select value={form[key as keyof typeof form] as number}
                        onChange={e => set(key, Number(e.target.value))}
                        className="w-full rounded-xl px-3 py-2.5 text-sm font-medium"
                        style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--navy)" }}>
                  {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>

          {/* Pileta */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div className="relative">
              <input type="checkbox" checked={form.tiene_pileta}
                     onChange={e => set("tiene_pileta", e.target.checked)}
                     className="sr-only peer" />
              <div className="w-10 h-5 rounded-full transition-colors peer-checked:bg-emerald-500"
                   style={{ background: form.tiene_pileta ? "var(--emerald)" : "var(--border)" }} />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                   style={{ transform: form.tiene_pileta ? "translateX(20px)" : "translateX(0)" }} />
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--navy)" }}>Tiene pileta / piscina</span>
          </label>

          {/* Botón */}
          <button type="submit" disabled={loading || !form.superficie_cubierta}
                  className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: loading ? "#94a3b8" : "var(--navy)" }}>
            {loading ? "Calculando valuación..." : "Tasar propiedad →"}
          </button>

          {loading && slowStart && (
            <p className="text-center text-xs animate-pulse" style={{ color: "var(--slate)" }}>
              El servidor está iniciando, puede demorar hasta 30 segundos la primera vez...
            </p>
          )}
        </form>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c" }}>
            {error}
          </div>
        )}

        {/* ── RESULTADO ──────────────────────────────────────────── */}
        {resultado && (
          <div className="fade-up space-y-4">

            {/* Card principal */}
            <div className="rounded-2xl overflow-hidden"
                 style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div className="p-6 sm:p-8" style={{ background: "var(--navy)" }}>
                <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-2">
                  Valuación estimada
                </p>
                <p className="text-white font-bold" style={{ fontSize: "2.75rem", lineHeight: 1 }}>
                  USD {fmtUSD(resultado.valor_total_usd)}
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  USD {fmtUSD(resultado.valor_m2_usd)} / m²
                </p>
              </div>

              <div className="p-6 sm:p-8 space-y-5">
                {/* Rango */}
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1.5" style={{ color: "var(--slate)" }}>
                    <span>USD {fmtUSD(resultado.rango_min_usd)}</span>
                    <span>Rango de confianza ±{resultado.intervalo_pct.toFixed(0)}%</span>
                    <span>USD {fmtUSD(resultado.rango_max_usd)}</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "var(--bg)" }}>
                    <div className="h-full rounded-full" style={{ background: "var(--emerald)", width: "60%" }} />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                  {[
                    { label: "Error típico",     value: resultado.mape_cv ? `${resultado.mape_cv.toFixed(1)}%` : "—" },
                    { label: "Base de datos",     value: `${resultado.n_entrenamiento ?? "—"} propiedades` },
                    { label: "Modelo",            value: resultado.tipo_propiedad ?? resultado.modelo_usado.split("(")[0].trim() },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="font-bold text-sm" style={{ color: "var(--navy)" }}>{s.value}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--slate)" }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {resultado.advertencias.length > 0 && (
                  <div className="p-3 rounded-xl text-xs" style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" }}>
                    {resultado.advertencias.map((a, i) => <p key={i}>{a}</p>)}
                  </div>
                )}
              </div>
            </div>

            {/* ── PROYECCIÓN ─────────────────────────────────────── */}
            <div className="rounded-2xl p-6 sm:p-8"
                 style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div className="mb-5">
                <h3 className="font-bold text-base" style={{ color: "var(--navy)" }}>
                  Proyección del valor a 3 años
                </h3>
                <p className="text-xs mt-1" style={{ color: "var(--slate)" }}>
                  Basada en escenarios de variación anual del mercado patagónico
                </p>
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left pb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--slate)" }}>
                        Período
                      </th>
                      {ESCENARIOS.map(e => (
                        <th key={e.label} className="text-right pb-3">
                          <span className="inline-flex flex-col items-end gap-0.5">
                            <span className="text-xs font-bold" style={{ color: e.color }}>{e.label}</span>
                            <span className="text-xs font-medium" style={{ color: "var(--slate)" }}>
                              {e.rate > 0 ? "+" : ""}{(e.rate * 100).toFixed(0)}% / año
                            </span>
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[0, ...AÑOS].map(year => (
                      <tr key={year} style={{ borderTop: "1px solid var(--border)" }}>
                        <td className="py-3 font-semibold" style={{ color: "var(--navy)" }}>
                          {year === 0 ? "Hoy" : `Año ${year}`}
                        </td>
                        {ESCENARIOS.map(e => {
                          const val = proyectar(resultado.valor_total_usd, e.rate, year);
                          const diff = val - resultado.valor_total_usd;
                          return (
                            <td key={e.label} className="py-3 text-right">
                              <span className="font-bold" style={{ color: year === 0 ? "var(--navy)" : e.color }}>
                                USD {fmtUSD(val)}
                              </span>
                              {year > 0 && (
                                <span className="block text-xs mt-0.5" style={{ color: e.color }}>
                                  {diff > 0 ? "+" : ""}USD {fmtUSD(Math.abs(diff))}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs mt-4 pt-4" style={{ color: "var(--slate)", borderTop: "1px solid var(--border)" }}>
                Proyección orientativa. No constituye asesoramiento financiero.
                Los escenarios son referencias del mercado patagónico.
              </p>
            </div>
          </div>
        )}

        {/* ── CÓMO FUNCIONA ───────────────────────────────────────── */}
        {!resultado && (
          <div className="rounded-2xl p-6 sm:p-8"
               style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h3 className="font-bold text-base mb-6" style={{ color: "var(--navy)" }}>
              ¿Cómo funciona?
            </h3>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { n: "01", title: "Ingresá los datos", desc: "Tipo, barrio, superficie y características de tu propiedad." },
                { n: "02", title: "El modelo calcula", desc: "Nuestro algoritmo analiza 342 propiedades similares del mercado." },
                { n: "03", title: "Recibís la valuación", desc: "Valor estimado, rango de confianza y proyección a 3 años." },
              ].map(step => (
                <div key={step.n} className="flex gap-4">
                  <span className="text-2xl font-black shrink-0" style={{ color: "var(--border)" }}>
                    {step.n}
                  </span>
                  <div>
                    <p className="font-bold text-sm mb-1" style={{ color: "var(--navy)" }}>{step.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--slate)" }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="py-6 px-4 text-center" style={{ borderTop: "1px solid var(--border)" }}>
        <p className="text-xs" style={{ color: "var(--slate)" }}>
          Estimación orientativa basada en datos del mercado inmobiliario de{" "}
          <strong style={{ color: "var(--navy)" }}>San Martín de los Andes</strong>
        </p>
      </footer>
    </div>
  );
}
