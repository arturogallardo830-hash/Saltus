const Stripe = require("stripe");

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
    <!-- Header -->
    <div class="header">
      <p class="header-eyebrow">Boleto Electrónico</p>
      <h1 class="header-title">SALTUS</h1>
      <p class="header-subtitle">Vol. I</p>
    </div>

    <!-- Body -->
    <div class="section">
      <p class="greeting">Hola, <strong>${nombreCompleto}</strong></p>
      <p class="intro">Tu compra fue exitosa. A continuación encontrarás tu boleto oficial. Preséntalo en la entrada del evento.</p>

      <!-- Confirmation -->
      <div class="confirmation-block">
        <p class="confirmation-label">Número de confirmación</p>
        <p class="confirmation-code">${confirmation}</p>
      </div>

      <!-- Details -->
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

      <!-- QR -->
      <div class="qr-block">
        <img src="${qrUrl}" width="220" height="220" alt="Código QR de acceso" />
        <p class="qr-label">Presenta este código QR en la entrada</p>
      </div>

      <!-- Event info -->
      <div class="event-info">
        <p><strong>Fecha:</strong> 20 de junio de 2026</p>
        <p><strong>Lugar:</strong> Alboa Fashion Drive, San Pedro Garza García</p>
      </div>

      <!-- Notices -->
      <div class="notices">
        <p class="notice">Presenta este código QR en la entrada del evento.</p>
        <p class="notice">No se permiten cambios ni devoluciones.</p>
        <p class="notice">Conserva este correo como comprobante de tu compra.</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>SALTUS Vol. I &mdash; mysaltus.com</p>
      <p style="margin-top:6px;">Este correo fue enviado a ${email}</p>
    </div>
  </div>
</body>
</html>`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { session_id } = req.query;
  if (!session_id) {
    return res.status(400).json({ error: "session_id requerido" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const confirmationCode = session.id.slice(-8).toUpperCase();
    console.log("[get-session] session.id:", session.id);
    console.log("[get-session] payment_status:", session.payment_status);
    console.log("[get-session] confirmation:", confirmationCode);

    const nombre = session.metadata?.nombre || "";
    const apellido = session.metadata?.apellido || "";
    const email = session.customer_email || session.metadata?.email || "";
    const tipo_boleto = session.metadata?.tipo_boleto || "";
    const cantidad = session.metadata?.cantidad || "";
    const mesa = session.metadata?.mesa || "";
    const total = session.amount_total ? session.amount_total / 100 : 0;

    return res.status(200).json({
      nombre,
      apellido,
      email,
      tipo_boleto,
      cantidad,
      mesa,
      total,
      confirmation: confirmationCode,
      status: session.payment_status,
    });
  } catch (err) {
    console.error("[get-session] error:", err);
    return res.status(500).json({ error: "No se pudo recuperar la sesión" });
  }
};
