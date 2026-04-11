import { createClient } from "@supabase/supabase-js";

const ADMIN_PASSWORD = "SALTUS2025admin";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const adminPass = req.headers["x-admin-password"];
  if (!adminPass || adminPass !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[get-orders] Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ orders: data || [] });
  } catch (err) {
    console.error("[get-orders] Unexpected error:", err);
    return res.status(500).json({ error: "Error interno" });
  }
}
