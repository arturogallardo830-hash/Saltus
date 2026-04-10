import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: "session_id requerido" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Only expose safe fields to the client
    return res.status(200).json({
      nombre: session.metadata?.nombre || "",
      apellido: session.metadata?.apellido || "",
      email: session.customer_email || session.metadata?.email || "",
      tipo_boleto: session.metadata?.tipo_boleto || "",
      cantidad: session.metadata?.cantidad || "",
      mesa: session.metadata?.mesa || "",
      total: session.amount_total ? session.amount_total / 100 : 0, // pesos MXN
      confirmation: session.id.slice(-8).toUpperCase(),
      status: session.payment_status,
    });
  } catch (err) {
    console.error("get-session error:", err);
    return res.status(500).json({ error: "No se pudo recuperar la sesión" });
  }
}
