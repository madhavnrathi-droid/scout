// supabase/functions/razorpay/index.ts
// timshel payments — Razorpay subscriptions (Plus / Pro) + webhook verification
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Plan IDs created in Razorpay dashboard, stored as secrets
const PLANS: Record<string, { env: string; tier: string }> = {
  plus_monthly: { env: "RZP_PLAN_PLUS_M", tier: "plus" },
  plus_yearly:  { env: "RZP_PLAN_PLUS_Y", tier: "plus" },
  pro_monthly:  { env: "RZP_PLAN_PRO_M",  tier: "pro" },
  pro_yearly:   { env: "RZP_PLAN_PRO_Y",  tier: "pro" },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const url = new URL(req.url);

  // ── Webhook: Razorpay → us (no JWT; verify HMAC instead) ──
  if (url.pathname.endsWith("/webhook")) {
    const raw = await req.text();
    const sig = req.headers.get("x-razorpay-signature") ?? "";
    const secret = Deno.env.get("RZP_WEBHOOK_SECRET")!;
    const ok = await verifyHmac(raw, sig, secret);
    if (!ok) return json({ error: "bad signature" }, 400);

    const event = JSON.parse(raw);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const sub = event.payload?.subscription?.entity;
    if (sub) {
      const statusMap: Record<string, string> = {
        active: "active", authenticated: "trialing", pending: "past_due",
        halted: "past_due", cancelled: "canceled", completed: "expired", expired: "expired",
      };
      const status = statusMap[sub.status] ?? "active";
      await admin.from("subscriptions").update({
        status,
        current_start: sub.current_start ? new Date(sub.current_start * 1000).toISOString() : null,
        current_end:   sub.current_end   ? new Date(sub.current_end   * 1000).toISOString() : null,
      }).eq("rzp_sub_id", sub.id);
      // reflect tier on profile
      const { data: row } = await admin.from("subscriptions").select("user_id, tier").eq("rzp_sub_id", sub.id).single();
      if (row) await admin.from("profiles").update({ plan: status === "active" || status === "trialing" ? row.tier : "free" }).eq("id", row.user_id);
    }
    return json({ ok: true });
  }

  // ── Create subscription: user → us (needs JWT) ──
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);

    const { plan } = await req.json();
    const p = PLANS[plan];
    if (!p) return json({ error: "unknown plan" }, 400);
    const planId = Deno.env.get(p.env);
    if (!planId) return json({ error: `plan not configured: ${p.env}` }, 500);

    const keyId = Deno.env.get("RZP_KEY_ID")!;
    const keySecret = Deno.env.get("RZP_KEY_SECRET")!;
    const auth = "Basic " + btoa(`${keyId}:${keySecret}`);

    const rzp = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: auth },
      body: JSON.stringify({
        plan_id: planId,
        total_count: plan.endsWith("yearly") ? 5 : 60,  // billing cycles
        customer_notify: 1,
        notes: { user_id: user.id, tier: p.tier },
      }),
    });
    const sub = await rzp.json();
    if (sub.error) return json({ error: sub.error.description }, 400);

    await supabase.from("subscriptions").insert({
      user_id: user.id, tier: p.tier, status: "trialing",
      rzp_sub_id: sub.id, rzp_plan_id: planId,
    });

    return json({ subscription_id: sub.id, key_id: keyId, short_url: sub.short_url });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

async function verifyHmac(payload: string, signature: string, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const hex = [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, "0")).join("");
  return hex === signature;
}
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "content-type": "application/json" } });
}
