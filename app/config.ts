// Datos de contacto y marca — alineados con catalanpropiedades.com.ar
export const WA_NUMBER = process.env.NEXT_PUBLIC_WA_NUMBER ?? "542944301470";
export const SITE_PRINCIPAL = "https://catalanpropiedades.com.ar";
export const BRAND = "Catalán Propiedades";
export const OWNER = "Milton Catalán";

// URL pública de este tasador (para OpenGraph / canonical).
export const TASADOR_URL = process.env.NEXT_PUBLIC_TASADOR_URL ?? "https://tasador.catalanpropiedades.com.ar";

// Stats del modelo — actualizar al reentrenar (fuente: modelo-predictivo-m2).
export const MODEL_STATS = {
  errorPromedio: "16.1%",
  propiedades: 342,
  barrios: 38,
};

// Link genérico para consultas (botón flotante, errores) — sin datos de tasación.
export const WA_LINK_GENERICO = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
  "¡Hola! Vengo del tasador online de Catalán Propiedades y quiero hacer una consulta."
)}`;

export function buildWhatsAppLink(params: {
  tipo: string;
  barrio: string;
  superficie: string;
  valorUsd: number;
}) {
  const texto = [
    "¡Hola! Usé el tasador online de Catalán Propiedades.",
    `Mi propiedad: ${params.tipo} en ${params.barrio}, ${params.superficie} m² cubiertos.`,
    `Valuación estimada: USD ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(Math.round(params.valorUsd))}.`,
    "Quiero una tasación profesional sin cargo.",
  ].join("\n");
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(texto)}`;
}
