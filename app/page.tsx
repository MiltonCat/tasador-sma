"use client";

import { useEffect, useState } from "react";
import { BRAND, MODEL_STATS, OWNER, SITE_PRINCIPAL, WA_LINK_GENERICO, buildWhatsAppLink } from "./config";

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
  { label: "Conservador", rate: -0.03, color: "#ef4444", bg: "#fef2f2", border: "#fecaca", icon: "↘" },
  { label: "Moderado",    rate:  0.04, color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", icon: "→" },
  { label: "Optimista",  rate:  0.10, color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", icon: "↗" },
];

const fmtUSD = (n: number) =>
  new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(n));

const proyectar = (base: number, rate: number, years: number) =>
  base * Math.pow(1 + rate, years);

function Stepper({ value, onChange, min = 0, max = 10 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  return (
    <div className="flex items-center gap-0" style={{ background: "var(--bg)", borderRadius: 14, border: "1px solid var(--border)", overflow: "hidden" }}>
      <button type="button"
              onClick={() => onChange(Math.max(min, value - 1))}
              disabled={value <= min}
              style={{ width: 44, height: 44, fontSize: 20, color: value <= min ? "var(--border)" : "var(--navy)", background: "transparent", border: "none", cursor: value <= min ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        −
      </button>
      <span style={{ minWidth: 28, textAlign: "center", fontWeight: 700, fontSize: 16, color: "var(--navy)" }}>
        {value}
      </span>
      <button type="button"
              onClick={() => onChange(Math.min(max, value + 1))}
              disabled={value >= max}
              style={{ width: 44, height: 44, fontSize: 20, color: value >= max ? "var(--border)" : "var(--navy)", background: "transparent", border: "none", cursor: value >= max ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
        +
      </button>
    </div>
  );
}

export default function Home() {
  const [barrios, setBarrios]     = useState<string[]>([]);
  const [loading, setLoading]     = useState(false);
  const [slowStart, setSlowStart] = useState(false);
  const [resultado, setResultado] = useState<TasarResponse | null>(null);
  const [error, setError]         = useState<string | null>(null);
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
    <div style={{ background: "var(--bg)", minHeight: "100dvh", paddingBottom: 88 }}>

      {/* ── HEADER ──────────────────────────────────────────── */}
      <header style={{ background: "var(--navy)", padding: "15px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mc-blanco.png" alt={`Logo ${OWNER}`}
                 style={{ width: 34, height: 30, objectFit: "contain", flexShrink: 0 }} />
            <div>
              <p style={{ color: "white", fontWeight: 700, fontSize: 15, lineHeight: 1.25, letterSpacing: "0.02em" }}>
                Tasador<span style={{ color: "var(--coral)" }}>SMA</span>
              </p>
              <p style={{ color: "#64748b", fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                San Martín de los Andes
              </p>
            </div>
          </div>
          <a href={SITE_PRINCIPAL} target="_blank" rel="noopener"
             style={{
               color: "#cbd5e1", fontSize: 11, fontWeight: 600, textDecoration: "none",
               border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999,
               padding: "6px 12px", whiteSpace: "nowrap", flexShrink: 0,
             }}>
            por <span style={{ color: "white" }}>{OWNER}</span>
          </a>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ background: "var(--navy)", padding: "20px 20px 28px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <p style={{ color: "#34d399", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          Tasación inmobiliaria con IA
        </p>
        <h1 style={{ color: "white", fontSize: 26, fontWeight: 800, lineHeight: 1.25, marginBottom: 6 }}>
          Conocé el valor real<br />de tu propiedad
        </h1>
        <p style={{ color: "rgba(148,163,184,0.85)", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
          Modelo entrenado con datos reales del mercado de SMA. Tasación instantánea con proyección a 3 años.
        </p>
        {/* KPIs — scroll horizontal */}
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 2, WebkitOverflowScrolling: "touch" as never }}>
          {[
            { value: MODEL_STATS.errorPromedio,        sub: "Error promedio" },
            { value: String(MODEL_STATS.propiedades),  sub: "Propiedades" },
            { value: String(MODEL_STATS.barrios),      sub: "Barrios" },
          ].map(k => (
            <div key={k.sub} style={{ flexShrink: 0, padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <p style={{ color: "white", fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{k.value}</p>
              <p style={{ color: "rgba(148,163,184,0.8)", fontSize: 11, marginTop: 3 }}>{k.sub}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      {/* ── CONTENIDO PRINCIPAL ─────────────────────────────── */}
      <main style={{ padding: "16px 16px 0", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>

        {/* ── FORMULARIO ──────────────────────────────────────── */}
        <form id="tasar-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Tipo de propiedad */}
          <div style={{ background: "var(--card)", borderRadius: 18, border: "1px solid var(--border)", padding: "18px 16px" }}>
            <p style={{ color: "var(--slate)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
              Tipo de propiedad
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {["Departamento", "Casa"].map(tipo => (
                <button key={tipo} type="button" onClick={() => set("tipo_propiedad", tipo)}
                        style={{
                          padding: "13px 0",
                          borderRadius: 12,
                          fontSize: 14,
                          fontWeight: 700,
                          border: "none",
                          cursor: "pointer",
                          transition: "all 0.15s",
                          background: form.tipo_propiedad === tipo ? "var(--navy)" : "var(--bg)",
                          color: form.tipo_propiedad === tipo ? "white" : "var(--slate)",
                          outline: form.tipo_propiedad === tipo ? "none" : "1px solid var(--border)",
                        }}>
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          {/* Ubicación + superficie */}
          <div style={{ background: "var(--card)", borderRadius: 18, border: "1px solid var(--border)", padding: "18px 16px", display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ color: "var(--slate)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Ubicación y superficie
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ color: "var(--navy)", fontSize: 13, fontWeight: 600 }}>Barrio</label>
              <select value={form.barrio} onChange={e => set("barrio", e.target.value)}
                      style={{ width: "100%", padding: "13px 14px", borderRadius: 12, fontSize: 15, fontWeight: 600, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--navy)" }}>
                {barrios.length > 0
                  ? barrios.map(b => <option key={b}>{b}</option>)
                  : <option>Centro</option>}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ color: "var(--navy)", fontSize: 13, fontWeight: 600 }}>
                Superficie cubierta (m²)
              </label>
              <input type="number" inputMode="numeric" min="1" max="1000" placeholder="75" required
                     value={form.superficie_cubierta}
                     onChange={e => set("superficie_cubierta", e.target.value)}
                     style={{ width: "100%", padding: "13px 14px", borderRadius: 12, fontSize: 20, fontWeight: 700, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--navy)", boxSizing: "border-box" }} />
            </div>

            {!esDepto && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ color: "var(--navy)", fontSize: 13, fontWeight: 600 }}>
                  Superficie terreno (m²)
                </label>
                <input type="number" inputMode="numeric" min="1" max="50000" placeholder="600"
                       value={form.superficie_terreno}
                       onChange={e => set("superficie_terreno", e.target.value)}
                       style={{ width: "100%", padding: "13px 14px", borderRadius: 12, fontSize: 20, fontWeight: 700, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--navy)", boxSizing: "border-box" }} />
              </div>
            )}
          </div>

          {/* Características — steppers */}
          <div style={{ background: "var(--card)", borderRadius: 18, border: "1px solid var(--border)", padding: "18px 16px" }}>
            <p style={{ color: "var(--slate)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>
              Características
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {[
                { label: "Dormitorios", key: "dormitorios", max: 6 },
                { label: "Baños",       key: "banos",       max: 4 },
                { label: "Ambientes",   key: "ambientes",   max: 8 },
                { label: "Cocheras",    key: "cocheras",    max: 2 },
              ].map(({ label, key, max }, i, arr) => (
                <div key={key} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  paddingTop: i === 0 ? 0 : 14, paddingBottom: i === arr.length - 1 ? 0 : 14,
                  borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                }}>
                  <span style={{ color: "var(--navy)", fontSize: 15, fontWeight: 600 }}>{label}</span>
                  <Stepper
                    value={form[key as keyof typeof form] as number}
                    onChange={v => set(key, v)}
                    max={max}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Pileta */}
          <div style={{ background: "var(--card)", borderRadius: 18, border: "1px solid var(--border)", padding: "16px" }}>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
              <span style={{ color: "var(--navy)", fontSize: 15, fontWeight: 600 }}>Tiene pileta / piscina</span>
              <div style={{ position: "relative", width: 50, height: 28, flexShrink: 0 }}>
                <input type="checkbox" checked={form.tiene_pileta}
                       onChange={e => set("tiene_pileta", e.target.checked)}
                       style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
                <div style={{
                  width: 50, height: 28, borderRadius: 14,
                  background: form.tiene_pileta ? "var(--emerald)" : "var(--border)",
                  transition: "background 0.2s",
                }} />
                <div style={{
                  position: "absolute", top: 3, left: form.tiene_pileta ? 25 : 3,
                  width: 22, height: 22, borderRadius: "50%", background: "white",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)", transition: "left 0.2s",
                }} />
              </div>
            </label>
          </div>

          {/* Aviso slow start */}
          {loading && slowStart && (
            <p style={{ textAlign: "center", fontSize: 12, color: "var(--slate)", animation: "pulse 1.5s infinite" }}>
              El servidor está iniciando, puede demorar hasta 30 segundos...
            </p>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: 14, borderRadius: 12, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 13 }}>
              <p style={{ color: "#b91c1c", marginBottom: 8 }}>
                No pudimos calcular la tasación en este momento. ({error})
              </p>
              <a href={WA_LINK_GENERICO} target="_blank" rel="noopener"
                 style={{ color: "#166534", fontWeight: 700, textDecoration: "none" }}>
                Escribime directo por WhatsApp y te paso la valuación →
              </a>
            </div>
          )}
        </form>

        {/* ── RESULTADO ───────────────────────────────────────── */}
        {resultado && (
          <div className="fade-up" style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Valor principal */}
            <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid var(--border)" }}>
              <div style={{ background: "var(--navy)", padding: "22px 20px" }}>
                <p style={{ color: "#34d399", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                  Valuación estimada
                </p>
                <p style={{ color: "white", fontWeight: 800, fontSize: 36, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  USD {fmtUSD(resultado.valor_total_usd)}
                </p>
                <p style={{ color: "rgba(148,163,184,0.85)", fontSize: 14, marginTop: 6 }}>
                  USD {fmtUSD(resultado.valor_m2_usd)} / m²
                </p>
              </div>

              <div style={{ background: "var(--card)", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Barra de rango */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <p style={{ color: "var(--slate)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Mínimo</p>
                      <p style={{ color: "var(--navy)", fontWeight: 700, fontSize: 14 }}>USD {fmtUSD(resultado.rango_min_usd)}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ color: "var(--slate)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Máximo</p>
                      <p style={{ color: "var(--navy)", fontWeight: 700, fontSize: 14 }}>USD {fmtUSD(resultado.rango_max_usd)}</p>
                    </div>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: "var(--bg)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: "60%", borderRadius: 99, background: "var(--emerald)" }} />
                  </div>
                  <p style={{ textAlign: "center", fontSize: 11, color: "var(--slate)", marginTop: 6 }}>
                    Rango de confianza ±{resultado.intervalo_pct.toFixed(0)}%
                  </p>
                </div>

                {/* Stats inline */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Error típico", value: resultado.mape_cv ? `${resultado.mape_cv.toFixed(1)}%` : "—" },
                    { label: "Base de datos", value: `${resultado.n_entrenamiento ?? "—"} props.` },
                  ].map(s => (
                    <div key={s.label} style={{ padding: "10px 12px", borderRadius: 10, background: "var(--bg)" }}>
                      <p style={{ color: "var(--navy)", fontWeight: 700, fontSize: 15 }}>{s.value}</p>
                      <p style={{ color: "var(--slate)", fontSize: 11, marginTop: 2 }}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {resultado.advertencias.length > 0 && (
                  <div style={{ padding: 12, borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", fontSize: 12 }}>
                    {resultado.advertencias.map((a, i) => <p key={i}>{a}</p>)}
                  </div>
                )}
              </div>
            </div>

            {/* ── PROYECCIÓN ────────────────────────────────────── */}
            <div style={{ background: "var(--card)", borderRadius: 18, border: "1px solid var(--border)", padding: "18px 16px" }}>
              <p style={{ color: "var(--navy)", fontWeight: 800, fontSize: 16, marginBottom: 4 }}>
                Proyección a 3 años
              </p>
              <p style={{ color: "var(--slate)", fontSize: 12, marginBottom: 18, lineHeight: 1.5 }}>
                Escenarios de variación anual del mercado patagónico
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {ESCENARIOS.map(esc => (
                  <div key={esc.label} style={{ borderRadius: 14, border: `1px solid ${esc.border}`, background: esc.bg, overflow: "hidden" }}>
                    {/* Encabezado escenario */}
                    <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${esc.border}` }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 18 }}>{esc.icon}</span>
                        <span style={{ color: esc.color, fontWeight: 800, fontSize: 14 }}>{esc.label}</span>
                      </div>
                      <span style={{ color: esc.color, fontWeight: 700, fontSize: 13, background: "white", padding: "2px 8px", borderRadius: 99, border: `1px solid ${esc.border}` }}>
                        {esc.rate > 0 ? "+" : ""}{(esc.rate * 100).toFixed(0)}% / año
                      </span>
                    </div>
                    {/* Años */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", padding: "12px 14px", gap: 8 }}>
                      {[1, 2, 3].map(year => {
                        const val = proyectar(resultado.valor_total_usd, esc.rate, year);
                        const diff = val - resultado.valor_total_usd;
                        return (
                          <div key={year} style={{ textAlign: "center" }}>
                            <p style={{ color: "var(--slate)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                              Año {year}
                            </p>
                            <p style={{ color: esc.color, fontWeight: 800, fontSize: 13, lineHeight: 1.2 }}>
                              USD {fmtUSD(val)}
                            </p>
                            <p style={{ color: esc.color, fontSize: 10, marginTop: 3, opacity: 0.75 }}>
                              {diff > 0 ? "+" : "−"}USD {fmtUSD(Math.abs(diff))}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ color: "var(--slate)", fontSize: 11, marginTop: 14, lineHeight: 1.5 }}>
                Proyección orientativa. No constituye asesoramiento financiero.
              </p>
            </div>

            {/* ── CTA TASACIÓN PROFESIONAL ──────────────────────── */}
            <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid var(--border)", background: "var(--navy)", padding: "22px 20px" }}>
              <p style={{ color: "#34d399", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                El siguiente paso
              </p>
              <p style={{ color: "white", fontWeight: 800, fontSize: 19, lineHeight: 1.3, marginBottom: 8 }}>
                Este es el precio de publicación.<br />¿Querés saber a cuánto se cierra de verdad?
              </p>
              <p style={{ color: "rgba(148,163,184,0.9)", fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>
                Una tasación profesional ajusta por estado de la propiedad, compara con ventas reales
                de tu barrio y te dice el precio de cierre. Sin cargo y sin compromiso, por {BRAND}.
              </p>
              <a href={buildWhatsAppLink({
                   tipo: form.tipo_propiedad,
                   barrio: form.barrio,
                   superficie: form.superficie_cubierta,
                   valorUsd: resultado.valor_total_usd,
                 })}
                 target="_blank" rel="noopener"
                 style={{
                   display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                   width: "100%", padding: "15px", borderRadius: 14, boxSizing: "border-box",
                   background: "#25D366", color: "white", fontWeight: 800, fontSize: 15,
                   textDecoration: "none",
                 }}>
                Pedir tasación profesional gratis
              </a>
              <p style={{ color: "rgba(148,163,184,0.7)", fontSize: 11, textAlign: "center", marginTop: 10 }}>
                Te contesta Milton Catalán por WhatsApp · Respuesta en menos de 48 hs
              </p>
            </div>

            {/* Nueva tasación */}
            <button type="button" onClick={() => setResultado(null)}
                    style={{ width: "100%", padding: "14px", borderRadius: 14, border: "1px solid var(--border)", background: "var(--card)", color: "var(--slate)", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 4 }}>
              ← Nueva tasación
            </button>
          </div>
        )}

        {/* ── CÓMO FUNCIONA (solo sin resultado) ──────────────── */}
        {!resultado && (
          <div style={{ marginTop: 20, background: "var(--card)", borderRadius: 18, border: "1px solid var(--border)", padding: "18px 16px" }}>
            <p style={{ color: "var(--navy)", fontWeight: 800, fontSize: 15, marginBottom: 16 }}>
              ¿Cómo funciona?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { n: "01", title: "Ingresá los datos",  desc: "Tipo, barrio, superficie y características." },
                { n: "02", title: "El modelo calcula",  desc: `Analiza ${MODEL_STATS.propiedades} propiedades del mercado de SMA.` },
                { n: "03", title: "Recibís la valuación", desc: "Valor estimado, rango y proyección a 3 años." },
              ].map(s => (
                <div key={s.n} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--border)", fontWeight: 900, fontSize: 22, lineHeight: 1, flexShrink: 0, width: 32 }}>{s.n}</span>
                  <div>
                    <p style={{ color: "var(--navy)", fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{s.title}</p>
                    <p style={{ color: "var(--slate)", fontSize: 13, lineHeight: 1.5 }}>{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ textAlign: "center", color: "var(--slate)", fontSize: 11, padding: "20px 0", lineHeight: 1.5 }}>
          Estimación orientativa · <strong style={{ color: "var(--navy)" }}>San Martín de los Andes</strong>
          <br />
          Desarrollado por{" "}
          <a href={SITE_PRINCIPAL} target="_blank" rel="noopener" style={{ color: "var(--navy)", fontWeight: 700, textDecoration: "none" }}>
            {OWNER} · {BRAND}
          </a>
        </p>
      </main>

      {/* ── WHATSAPP FLOTANTE (siempre visible) ─────────────── */}
      <a href={WA_LINK_GENERICO} target="_blank" rel="noopener"
         aria-label="Consultar por WhatsApp"
         style={{
           position: "fixed", right: 16, bottom: resultado ? 20 : 96, zIndex: 50,
           width: 52, height: 52, borderRadius: "50%", background: "#25D366",
           display: "flex", alignItems: "center", justifyContent: "center",
           boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
         }}>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="white" aria-hidden="true">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.03c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24s-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29z"/>
        </svg>
      </a>

      {/* ── BOTÓN FIJO EN LA PARTE INFERIOR ─────────────────── */}
      {!resultado && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          padding: "12px 16px 20px",
          background: "rgba(241,245,249,0.95)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--border)",
        }}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <button
            form="tasar-form"
            type="submit"
            disabled={loading || !form.superficie_cubierta}
            style={{
              width: "100%", padding: "16px", borderRadius: 14, border: "none",
              fontWeight: 800, fontSize: 15, color: "white", cursor: loading || !form.superficie_cubierta ? "not-allowed" : "pointer",
              background: loading || !form.superficie_cubierta ? "#94a3b8" : "var(--navy)",
              transition: "background 0.15s",
            }}>
            {loading ? "Calculando valuación..." : "Tasar propiedad →"}
          </button>
          </div>
        </div>
      )}
    </div>
  );
}
