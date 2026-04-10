import { createClient } from "@supabase/supabase-js";

const VALIDATOR_PASSWORD = process.env.VALIDATOR_PASSWORD || "SALTUS2025";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, password } = req.body;

  if (!password || password !== VALIDATOR_PASSWORD) {
    return res.status(401).json({ error: "No autorizado" });
  }

  if (!code || typeof code !== "string") {
    return res.status(400).json({ error: "Código requerido" });
  }

  const normalized = code.trim().toUpperCase();

  try {
    // Look up by the stored confirmation column (last 8 chars of session ID)
    const { data: rows, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("confirmation", normalized)
      .limit(1);

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError);
      return res.status(500).json({ error: "Error al consultar la base de datos" });
    }

    if (!rows || rows.length === 0) {
      return res.status(200).json({ result: "invalid" });
    }

    const order = rows[0];

    if (order.status === "usado") {
      return res.status(200).json({
        result: "used",
        nombre: `${order.nombre} ${order.apellido}`.trim(),
        tipo_boleto: order.tipo_boleto,
        mesa: order.mesa || null,
      });
    }

    // Valid — mark as used
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "usado", used_at: new Date().toISOString() })
      .eq("id", order.id);

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return res.status(500).json({ error: "Error al actualizar el boleto" });
    }

    return res.status(200).json({
      result: "valid",
      nombre: `${order.nombre} ${order.apellido}`.trim(),
      tipo_boleto: order.tipo_boleto,
      mesa: order.mesa || null,
      cantidad: order.cantidad,
    });
  } catch (err) {
    console.error("validate-ticket error:", err);
    return res.status(500).json({ error: "Error interno" });
  }
}
