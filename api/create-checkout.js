import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const PRICES = {
  general: 209,
  vip: 365,
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { nombre, apellido, email, tipo_boleto, cantidad } = req.body;

  // Validate required fields
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
  const total = unit_price * qty;

  try {
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: unit_price * 100, // Stripe uses cents
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
      },
      success_url: `${req.headers.origin || "https://saltus.vercel.app"}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin || "https://saltus.vercel.app"}/`,
    });

    // Save pending order in Supabase
    const { error: dbError } = await supabase.from("orders").insert({
      stripe_session_id: session.id,
      nombre,
      apellido,
      email,
      tipo_boleto,
      cantidad: qty,
      total,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      // Don't block the user — return the payment URL anyway and log the error
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return res.status(500).json({ error: "Error al crear la sesión de pago" });
  }
}
