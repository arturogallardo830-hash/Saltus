import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Block mesas that are paid/usado, OR pending within the last 15 minutes
    const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    const { data: rows, error } = await supabase
      .from("orders")
      .select("mesa")
      .not("mesa", "is", null)
      .or(`status.in.(paid,usado),and(status.eq.pending,created_at.gt.${cutoff})`);

    if (error) {
      console.error("[get-occupied-seats] Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    const occupied = [
      ...new Set(
        rows.map((r) => Number(r.mesa)).filter((n) => n > 0)
      ),
    ];

    return res.status(200).json({ occupied });
  } catch (err) {
    console.error("[get-occupied-seats] Unexpected error:", err);
    return res.status(500).json({ error: "Error interno" });
  }
}
