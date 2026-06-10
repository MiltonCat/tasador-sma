// Informe PDF "lite" generado en el navegador (jspdf, importado bajo demanda).
// Versión resumida a propósito: el informe profesional completo (comparables,
// ajuste por estado, precio de cierre) lo entrega Milton en la tasación presencial.
import { BRAND, OWNER, SITE_PRINCIPAL, WA_NUMBER } from "./config";

export const ESCENARIOS = [
  { label: "Conservador", rate: -0.03, color: "#ef4444", bg: "#fef2f2", border: "#fecaca", icon: "↘" },
  { label: "Moderado",    rate:  0.04, color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", icon: "→" },
  { label: "Optimista",  rate:  0.10, color: "#10b981", bg: "#ecfdf5", border: "#a7f3d0", icon: "↗" },
];

export const fmtUSD = (n: number) =>
  new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(n));

export const proyectar = (base: number, rate: number, years: number) =>
  base * Math.pow(1 + rate, years);

type DatosInforme = {
  tipo: string;
  barrio: string;
  superficie_cubierta: string;
  superficie_terreno: string;
  dormitorios: number;
  banos: number;
  ambientes: number;
  cocheras: number;
  caracteristicas: string[];
  valor_total_usd: number;
  valor_m2_usd: number;
  rango_min_usd: number;
  rango_max_usd: number;
  intervalo_pct: number;
  mape_cv: number | null;
  n_entrenamiento: number | null;
};

const NAVY = "#0b1220";
const SLATE = "#64748b";
const CORAL = "#eb4d67";

async function cargarLogo(): Promise<string | null> {
  try {
    const res = await fetch("/logo-mc.png");
    const blob = await res.blob();
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function descargarInformePDF(d: DatosInforme) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 18;
  const hoy = new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  doc.setFillColor(NAVY);
  doc.rect(0, 0, W, 34, "F");
  const logo = await cargarLogo();
  if (logo) doc.addImage(logo, "PNG", M, 7, 20, 17.5);
  doc.setTextColor("#ffffff");
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Informe de valuación orientativa", M + 26, 16);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#94a3b8");
  doc.text(`TasadorSMA · San Martín de los Andes · ${hoy}`, M + 26, 23);

  let y = 48;
  doc.setTextColor(SLATE);
  doc.setFontSize(9);
  doc.text("PROPIEDAD CONSULTADA", M, y);
  y += 7;
  doc.setTextColor(NAVY);
  doc.setFontSize(11);
  const detalle = [
    `${d.tipo} en ${d.barrio}`,
    `Superficie cubierta: ${d.superficie_cubierta} m²` +
      (d.superficie_terreno ? ` · Terreno: ${d.superficie_terreno} m²` : ""),
    `${d.dormitorios} dorm. · ${d.banos} baño(s) · ${d.ambientes} amb. · ${d.cocheras} cochera(s)`,
    ...(d.caracteristicas.length ? [d.caracteristicas.join(" · ")] : []),
  ];
  for (const linea of detalle) {
    doc.text(linea, M, y);
    y += 6.5;
  }

  y += 6;
  doc.setFillColor("#f1f5f9");
  doc.roundedRect(M, y, W - 2 * M, 34, 3, 3, "F");
  doc.setTextColor(SLATE);
  doc.setFontSize(9);
  doc.text("VALUACIÓN ESTIMADA (PRECIO DE PUBLICACIÓN)", M + 8, y + 9);
  doc.setTextColor(NAVY);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(`USD ${fmtUSD(d.valor_total_usd)}`, M + 8, y + 21);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(SLATE);
  doc.text(
    `USD ${fmtUSD(d.valor_m2_usd)} / m² · Rango: USD ${fmtUSD(d.rango_min_usd)} – USD ${fmtUSD(d.rango_max_usd)} (±${d.intervalo_pct.toFixed(0)}%)`,
    M + 8, y + 29
  );
  y += 46;

  doc.setTextColor(SLATE);
  doc.setFontSize(9);
  doc.text("PROYECCIÓN A 3 AÑOS — ESCENARIOS DE MERCADO", M, y);
  y += 7;
  doc.setFontSize(10);
  for (const esc of ESCENARIOS) {
    doc.setTextColor(NAVY);
    doc.setFont("helvetica", "bold");
    doc.text(`${esc.label} (${esc.rate > 0 ? "+" : ""}${(esc.rate * 100).toFixed(0)}% anual)`, M, y);
    doc.setFont("helvetica", "normal");
    const valores = [1, 2, 3]
      .map(a => `Año ${a}: USD ${fmtUSD(proyectar(d.valor_total_usd, esc.rate, a))}`)
      .join("   ·   ");
    doc.setTextColor(SLATE);
    doc.text(valores, M + 52, y);
    y += 7;
  }

  y += 6;
  doc.setDrawColor("#e2e8f0");
  doc.line(M, y, W - M, y);
  y += 8;
  doc.setTextColor(NAVY);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("¿Querés saber a cuánto se cierra de verdad?", M, y);
  y += 6.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(SLATE);
  const pitch = doc.splitTextToSize(
    `Este informe estima el precio de publicación a partir de ${d.n_entrenamiento ?? "cientos de"} propiedades del mercado de SMA` +
      (d.mape_cv ? ` (error típico ${d.mape_cv.toFixed(1)}%)` : "") +
      `. Una tasación profesional ajusta por estado de la propiedad, compara con ventas reales de tu barrio y te dice el precio de cierre. Sin cargo y sin compromiso.`,
    W - 2 * M
  );
  doc.text(pitch, M, y);
  y += pitch.length * 5 + 6;
  doc.setTextColor(CORAL);
  doc.setFont("helvetica", "bold");
  doc.text(`${OWNER} · ${BRAND}`, M, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(NAVY);
  doc.text(`WhatsApp: +${WA_NUMBER} · ${SITE_PRINCIPAL.replace("https://", "")}`, M, y);

  doc.setFontSize(8);
  doc.setTextColor(SLATE);
  doc.text(
    "Estimación orientativa generada por modelo estadístico. No constituye tasación oficial ni asesoramiento financiero.",
    M, 285
  );

  doc.save(`tasacion-${d.barrio.toLowerCase().replace(/\s+/g, "-")}-sma.pdf`);
}
