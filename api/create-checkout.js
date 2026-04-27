const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

const PRICES = {
  general: 20900, // centavos MXN = $209 MXN
  vip: 36500,     // centavos MXN = $365 MXN
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { nombre, apellido, email, tipo_boleto, cantidad, mesa } = req.body;

  if (!nombre || !apellido || !email || !tipo_boleto || !cantidad) {
    return res.status(400).json({ error: "Todos los campos son requeridos" });
  }

  if (!PRICES[tipo_boleto]) {
    return res.status(400).json({ error: "Tipo de boleto inválido. Use 'general' o 'vip'" });
  }

  const qty = parseInt(cantidad, 10);
  if (isNaN(qty) || qty < 1) {
    return res.status(400).json({ error: "Cantidad inválida" });
  }

  const unit_price = PRICES[tipo_boleto];
  const total = (unit_price / 100) * qty; // pesos MXN

  // General tickets have no assigned table (llegada libre)
  const mesaValue = tipo_boleto === "general"
    ? null
    : (mesa && String(mesa).trim() ? String(mesa).trim() : null);

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "mxn",
            unit_amount: unit_price,
            product_data: {
              name: `Boleto ${tipo_boleto.charAt(0).toUpperCase() + tipo_boleto.slice(1)} — Saltus`,
              description: `Entrada ${tipo_boleto} para el evento Saltus`,
            },
          },
          quantity: qty,
        },
      ],
      metadata: {
        nombre,
        apellido,
        email,
        tipo_boleto,
        cantidad: qty,
        mesa: mesaValue == null ? "" : String(mesaValue),
      },
      success_url: `${req.headers.origin || "https://saltus.vercel.app"}/confirmacion.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || "https://saltus.vercel.app"}/`,
    });

    const confirmationCode = session.id.slice(-8).toUpperCase();
    console.log("[create-checkout] session.id:", session.id);
    console.log("[create-checkout] confirmationCode:", confirmationCode);
    console.log("[create-checkout] SUPABASE URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    const insertPayload = {
      stripe_session_id: session.id,
      confirmation: confirmationCode,
      Nombre: nombre,
      Apellido: apellido,
      Email: email,
      tipo_boleto,
      cantidad: qty,
      mesa: mesaValue,
      total,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    console.log("[create-checkout] INSERT payload:", JSON.stringify(insertPayload));

    const { data: insertData, error: dbError } = await supabase
      .from("orders")
      .insert(insertPayload)
      .select();

    if (dbError) {
      console.error("[create-checkout] Supabase insert ERROR completo:", JSON.stringify(dbError));
      console.error("[create-checkout] dbError.message:", dbError.message);
      console.error("[create-checkout] dbError.code:", dbError.code);
      console.error("[create-checkout] dbError.details:", dbError.details);
      console.error("[create-checkout] dbError.hint:", dbError.hint);
    } else {
      console.log("[create-checkout] Insert OK, row:", JSON.stringify(insertData));
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("[create-checkout] Checkout error:", err);
    return res.status(500).json({ error: "Error al crear la sesión de pago" });
  }
};
