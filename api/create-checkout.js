const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

const PRICES = {
  general: 20900, // centavos MXN = $209 MXN
  vip: 36500,     // centavos MXN = $365 MXN
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

function buildTicketHtml({ nombre, apellido, email, tipo_boleto, cantidad, mesa, total, confirmation }) {
  const nombreCompleto = `${nombre} ${apellido}`;
  const tipoLabel = tipo_boleto === "vip" ? "VIP" : "General";
  const mesaLine = mesa
    ? `<tr><td class="label">Mesa</td><td class="value">${mesa}</td></tr>`
    : "";

  const qrData = encodeURIComponent(
    `SALTUS-VOL1|${confirmation}|${nombreCompleto}|${tipo_boleto}|${mesa || ""}|${cantidad}`
  );
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${qrData}`;

  const totalFormatted = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(total);

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu boleto SALTUS Vol. I</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0a0a0a;
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #e5e5e5;
    }
    .wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #111111;
    }
    .header {
      background-color: #0a0a0a;
      text-align: center;
      padding: 40px 24px 32px;
      border-bottom: 2px solid #C9A84C;
    }
    .header-eyebrow {
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #C9A84C;
      margin: 0 0 12px;
    }
    .header-title {
      font-size: 42px;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #FFFFFF;
      margin: 0;
      line-height: 1;
    }
    .header-subtitle {
      font-size: 13px;
      letter-spacing: 0.25em;
      text-transform: uppercase;
      color: #C9A84C;
      margin: 10px 0 0;
    }
    .section {
      padding: 32px 40px;
    }
    .greeting {
      font-size: 16px;
      color: #cccccc;
      margin: 0 0 8px;
    }
    .greeting strong {
      color: #FFFFFF;
    }
    .intro {
      font-size: 14px;
      color: #999999;
      margin: 0 0 32px;
      line-height: 1.6;
    }
    .confirmation-block {
      background-color: #0a0a0a;
      border: 1px solid #C9A84C;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      margin-bottom: 32px;
    }
    .confirmation-label {
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #C9A84C;
      margin: 0 0 8px;
    }
    .confirmation-code {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: #FFFFFF;
      margin: 0;
      font-family: 'Courier New', monospace;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 32px;
    }
    .details-table td {
      padding: 12px 0;
      border-bottom: 1px solid #222222;
      font-size: 14px;
      vertical-align: top;
    }
    .details-table td.label {
      color: #888888;
      width: 40%;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.1em;
      padding-top: 14px;
    }
    .details-table td.value {
      color: #FFFFFF;
      font-weight: 500;
    }
    .details-table td.value .badge {
      display: inline-block;
      background-color: #C9A84C;
      color: #000000;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      padding: 3px 10px;
      border-radius: 4px;
    }
    .qr-block {
      background-color: #0a0a0a;
      border-radius: 8px;
      padding: 28px;
      text-align: center;
      margin-bottom: 32px;
    }
    .qr-block img {
      display: block;
      margin: 0 auto 16px;
      border: 4px solid #FFFFFF;
      border-radius: 4px;
    }
    .qr-label {
      font-size: 12px;
      color: #C9A84C;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin: 0;
    }
    .event-info {
      background-color: #161616;
      border-left: 3px solid #C9A84C;
      border-radius: 4px;
      padding: 16px 20px;
      margin-bottom: 32px;
    }
    .event-info p {
      margin: 0 0 6px;
      font-size: 13px;
      color: #cccccc;
    }
    .event-info p:last-child { margin: 0; }
    .event-info strong {
      color: #C9A84C;
    }
    .notices {
      margin-bottom: 32px;
    }
    .notice {
      display: flex;
      align-items: flex-start;
      margin-bottom: 10px;
      font-size: 13px;
      color: #888888;
      line-height: 1.5;
    }
    .notice::before {
      content: "•";
      color: #C9A84C;
      margin-right: 8px;
      flex-shrink: 0;
    }
    .footer {
      background-color: #0a0a0a;
      border-top: 1px solid #222222;
      padding: 24px 40px;
      text-align: center;
    }
    .footer p {
      margin: 0;
      font-size: 12px;
      color: #555555;
      line-height: 1.6;
    }
    .footer a {
      color: #C9A84C;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <p class="header-eyebrow">Boleto Electrónico</p>
      <h1 class="header-title">SALTUS</h1>
      <p class="header-subtitle">Vol. I</p>
    </div>

    <div class="section">
      <p class="greeting">Hola, <strong>${nombreCompleto}</strong></p>
      <p class="intro">Tu compra fue exitosa. A continuación encontrarás tu boleto oficial. Preséntalo en la entrada del evento.</p>

      <div class="confirmation-block">
        <p class="confirmation-label">Número de confirmación</p>
        <p class="confirmation-code">${confirmation}</p>
      </div>

      <table class="details-table">
        <tr>
          <td class="label">Nombre</td>
          <td class="value">${nombreCompleto}</td>
        </tr>
        <tr>
          <td class="label">Tipo de boleto</td>
          <td class="value"><span class="badge">${tipoLabel}</span></td>
        </tr>
        ${mesaLine}
        <tr>
          <td class="label">Cantidad</td>
          <td class="value">${cantidad} ${parseInt(cantidad) === 1 ? "boleto" : "boletos"}</td>
        </tr>
        <tr>
          <td class="label">Total pagado</td>
          <td class="value">${totalFormatted} MXN</td>
        </tr>
      </table>

      <div class="qr-block">
        <img src="${qrUrl}" width="220" height="220" alt="Código QR de acceso" />
        <p class="qr-label">Presenta este código QR en la entrada</p>
      </div>

      <div class="event-info">
        <p><strong>Fecha:</strong> 20 de junio de 2026</p>
        <p><strong>Lugar:</strong> Alboa Fashion Drive, San Pedro Garza García</p>
      </div>

      <div class="notices">
        <p class="notice">Presenta este código QR en la entrada del evento.</p>
        <p class="notice">No se permiten cambios ni devoluciones.</p>
        <p class="notice">Conserva este correo como comprobante de tu compra.</p>
      </div>
    </div>

    <div class="footer">
      <p>SALTUS Vol. I &mdash; mysaltus.com</p>
      <p style="margin-top:6px;">Este correo fue enviado a ${email}</p>
    </div>
  </div>
</body>
</html>`;
}

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
        mesa: mesa || "",
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
      mesa: mesa || null,
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
      console.error("[create-checkout] Supabase insert ERROR:", JSON.stringify(dbError));
    } else {
      console.log("[create-checkout] Insert OK, row:", JSON.stringify(insertData));

      // Enviar correo inmediatamente después del insert exitoso
      console.log("[create-checkout] Enviando correo a:", email);
      try {
        const html = buildTicketHtml({
          nombre,
          apellido,
          email,
          tipo_boleto,
          cantidad: qty,
          mesa: mesa || "",
          total,
          confirmation: confirmationCode,
        });

        const { data: emailData, error: emailError } = await resend.emails.send({
          from: "boletos@mysaltus.com",
          to: [email],
          subject: "Tu boleto para SALTUS Vol. I",
          html,
        });

        if (emailError) {
          console.error("[create-checkout] Resend ERROR:", JSON.stringify(emailError));
        } else {
          console.log("[create-checkout] Correo enviado OK, id:", emailData?.id);
        }
      } catch (emailErr) {
        console.error("[create-checkout] Resend excepción:", emailErr.message);
      }
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("[create-checkout] Checkout error:", err);
    return res.status(500).json({ error: "Error al crear la sesión de pago" });
  }
};
