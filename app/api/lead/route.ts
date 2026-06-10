// Alta de leads del informe PDF. Reenvía el email al endpoint de suscripción
// del sitio principal (server-to-server, sin CORS), que lo guarda en Supabase.
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DESTINO =
  process.env.LEADS_ENDPOINT ?? "https://www.catalanpropiedades.com.ar/api/suscripcion/";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Honeypot: los bots completan el campo invisible; fingimos éxito.
    if (body.website) return NextResponse.json({ ok: true });

    const email = String(body.email || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: "email_invalido" }, { status: 400 });
    }

    const res = await fetch(DESTINO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source: "tasador" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      console.error("[/api/lead] fallo alta de suscriptor:", res.status, data);
      return NextResponse.json({ ok: false, error: "error_servidor" }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/lead] error:", err);
    return NextResponse.json({ ok: false, error: "error_servidor" }, { status: 500 });
  }
}
