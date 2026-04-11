import { createClient } from "@supabase/supabase-js";

const PASSWORD = "SALTUS2025";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, password } = req.body;

  if (!password || password !== PASSWORD) {
    return res.status(401).json({ valid: false, reason: "No autorizado" });
  }

  if (!code || typeof code !== "string") {
    return res.status(400).json({ valid: false, reason: "Código requerido" });
  }

  const normalized = code.trim().toUpperCase();
  const normalizedLower = normalized.toLowerCase();

  console.log("CODE RECEIVED:", code);
  console.log("SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("QUERY:", { confirmation: normalized });

  try {
    // Try uppercase first, then lowercase (case sensitivity check)
    let rows, error;

    ({ data: rows, error } = await supabase
      .from("orders")
      .select("*")
      .eq("confirmation", normalized)
      .limit(1));

    console.log("RESULT (uppercase):", JSON.stringify(rows));
    console.log("ERROR (uppercase):", JSON.stringify(error));

    if ((!rows || rows.length === 0) && !error) {
      // Retry with lowercase
      const { data: rowsLower, error: errorLower } = await supabase
        .from("orders")
        .select("*")
        .eq("confirmation", normalizedLower)
        .limit(1);

      console.log("RESULT (lowercase):", JSON.stringify(rowsLower));
      console.log("ERROR (lowercase):", JSON.stringify(errorLower));

      if (rowsLower && rowsLower.length > 0) {
        rows = rowsLower;
        error = errorLower;
      }
    }

    if (error) {
      console.error("ERROR COMPLETO:", JSON.stringify(error));
      return res.status(500).json({
        valid: false,
        reason: "Error al consultar la base de datos",
        detail: error.message,
        code: error.code,
      });
    }

    if (!rows || rows.length === 0) {
      console.log("NO ENCONTRADO — confirmation =", normalized);
      return res.status(200).json({ valid: false, reason: "Código no encontrado" });
    }

    const order = rows[0];

    if (order.status === "usado") {
      return res.status(200).json({
        valid: false,
        reason: "Este boleto ya fue usado",
        nombre: `${order.Nombre || ''} ${order.Apellido || ''}`.trim(),
        tipo_boleto: order.tipo_boleto,
        mesa: order.mesa || null,
      });
    }

    // Mark as used
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "usado", used_at: new Date().toISOString() })
      .eq("id", order.id);

    if (updateError) {
      console.error("[validate-ticket] Update error:", updateError);
      return res.status(500).json({ valid: false, reason: "Error al actualizar el boleto" });
    }

    return res.status(200).json({
      valid: true,
      nombre: `${order.Nombre || ''} ${order.Apellido || ''}`.trim(),
      tipo_boleto: order.tipo_boleto,
      mesa: order.mesa || null,
      cantidad: order.cantidad,
    });
  } catch (err) {
    console.error("[validate-ticket] Unexpected error:", err);
    return res.status(500).json({ valid: false, reason: "Error interno" });
  }
}
