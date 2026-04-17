const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

function buildReminderHtml({ nombre, apellido, email, tipo_boleto, cantidad, mesa, total, confirmation, type }) {
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

  const is7days = type === "7days";
  const subjectLine = is7days
    ? "¡Faltan 7 días para SALTUS Vol. I!"
    : "¡Mañana es SALTUS Vol. I! Tu entrada te espera";
  const headingLine = is7days
    ? "Faltan 7 días"
    : "¡Es mañana!";
  const introText = is7days
    ? "El evento que estabas esperando está a la vuelta de la esquina. Aquí tienes tu código QR de acceso listo para el gran día."
    : "Mañana es la noche. Asegúrate de tener tu código QR a la mano para entrar sin filas.";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subjectLine}</title>
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
    .countdown-banner {
      background-color: #C9A84C;
      text-align: center;
      padding: 14px 24px;
    }
    .countdown-banner p {
      margin: 0;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #000000;
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
    .conf-block {
      background-color: #0a0a0a;
      border: 1px solid #C9A84C;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin-bottom: 32px;
    }
    .conf-label {
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #C9A84C;
      margin: 0 0 8px;
    }
    .conf-code {
      font-size: 30px;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: #FFFFFF;
      margin: 0;
      font-family: 'Courier New', monospace;
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
      <p class="header-eyebrow">Recordatorio de Evento</p>
      <h1 class="header-title">SALTUS</h1>
      <p class="header-subtitle">Vol. I</p>
    </div>

    <div class="countdown-banner">
      <p>${headingLine} &mdash; 20 de junio de 2026</p>
    </div>

    <div class="section">
      <p class="greeting">Hola, <strong>${nombreCompleto}</strong></p>
      <p class="intro">${introText}</p>

      <div class="conf-block">
        <p class="conf-label">Número de confirmación</p>
        <p class="conf-code">${confirmation}</p>
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
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify CRON_SECRET
  const authHeader = req.headers["authorization"];
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expectedToken) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { type } = req.query;
  if (type !== "7days" && type !== "24hrs") {
    return res.status(400).json({ error: "type debe ser '7days' o '24hrs'" });
  }

  console.log(`[send-reminder] Iniciando envío de recordatorios type=${type}`);

  try {
    const { data: orders, error: dbError } = await supabase
      .from("orders")
      .select("confirmation, Nombre, Apellido, Email, tipo_boleto, cantidad, mesa, total")
      .eq("status", "paid");

    if (dbError) {
      console.error("[send-reminder] Supabase error:", JSON.stringify(dbError));
      return res.status(500).json({ error: "Error al obtener órdenes" });
    }

    console.log(`[send-reminder] Órdenes encontradas: ${orders.length}`);

    const subjectMap = {
      "7days": "¡Faltan 7 días para SALTUS Vol. I!",
      "24hrs": "¡Mañana es SALTUS Vol. I! Tu entrada te espera",
    };

    let sent = 0;
    let errors = 0;

    for (const order of orders) {
      try {
        const html = buildReminderHtml({
          nombre: order.Nombre,
          apellido: order.Apellido,
          email: order.Email,
          tipo_boleto: order.tipo_boleto,
          cantidad: order.cantidad,
          mesa: order.mesa,
          total: order.total,
          confirmation: order.confirmation,
          type,
        });

        const { error: emailError } = await resend.emails.send({
          from: "boletos@mysaltus.com",
          to: [order.Email],
          subject: subjectMap[type],
          html,
        });

        if (emailError) {
          console.error(`[send-reminder] Error enviando a ${order.Email}:`, JSON.stringify(emailError));
          errors++;
        } else {
          console.log(`[send-reminder] Correo enviado a ${order.Email}`);
          sent++;
        }
      } catch (err) {
        console.error(`[send-reminder] Excepción para ${order.Email}:`, err.message);
        errors++;
      }
    }

    console.log(`[send-reminder] Completado. Enviados: ${sent}, Errores: ${errors}`);
    return res.status(200).json({ ok: true, type, sent, errors, total: orders.length });
  } catch (err) {
    console.error("[send-reminder] Error general:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
