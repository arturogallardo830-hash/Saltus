import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("orders")
      .update({ status: "expired" })
      .eq("status", "pending")
      .lt("created_at", cutoff)
      .select("id, confirmation, mesa");

    if (error) {
      console.error("[cleanup-pending] Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    const expired = data?.length ?? 0;
    if (expired > 0) {
      console.log(`[cleanup-pending] Expired ${expired} pending order(s):`,
        data.map(r => r.confirmation).join(", "));
    }

    return res.status(200).json({ expired });
  } catch (err) {
    console.error("[cleanup-pending] Unexpected error:", err);
    return res.status(500).json({ error: "Error interno" });
  }
}
