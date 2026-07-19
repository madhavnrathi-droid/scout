// supabase/functions/agent/index.ts
// timshel application agent — "apply through chat"
// Helps users draft SoPs, check eligibility, and prep applications.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are the timshel application agent — a sharp, warm assistant that helps Indian students and researchers actually APPLY to fellowships, grants, hackathons, scholarships and similar opportunities.

You can:
- Draft Statements of Purpose, motivation letters, and short-answer responses tailored to the user's profile and the specific opportunity.
- Check eligibility against the listing and flag gaps honestly.
- Break the application into a concrete checklist with deadlines.
- Suggest what documents to gather (transcripts, LORs, CV) and when to start.

Rules:
- Be concrete and specific to THIS opportunity and THIS user. Never generic.
- Indian context aware: mention CGPA vs GPA conversion, GATE/NET where relevant, visa/funding nuance for abroad.
- If drafting, produce real usable prose, not placeholders. Keep SoPs to the stated word limit.
- Be honest about fit. If the user is ineligible, say so kindly and suggest closer alternatives.
- Keep replies tight. Lead with the most useful thing.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);

    const body = await req.json();
    const { message, thread_id, opp_id } = body;
    if (!message) return json({ error: "message required" }, 400);

    // Load user profile + opportunity context (RLS-safe)
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    let opp = null;
    if (opp_id) {
      const { data } = await supabase.from("opportunities").select("*").eq("id", opp_id).single();
      opp = data;
    }

    // Ensure a thread
    let tid = thread_id;
    if (!tid) {
      const { data: t } = await supabase.from("agent_threads")
        .insert({ user_id: user.id, opp_id: opp_id ?? null, title: opp?.title ?? "Application help" })
        .select("id").single();
      tid = t?.id;
    }

    // History
    const { data: history } = await supabase.from("agent_messages")
      .select("role, content").eq("thread_id", tid).order("id", { ascending: true }).limit(20);

    await supabase.from("agent_messages").insert({ thread_id: tid, role: "user", content: message });

    const ctx = [
      profile && `USER PROFILE: ${profile.full_name ?? "Student"} · role=${profile.role} · institution=${profile.institution ?? "?"} · field=${profile.field_of_study ?? "?"} · domains=${(profile.domains||[]).join(", ")} · goal=${profile.goal ?? "?"} · geo=${profile.geo_pref ?? "?"}`,
      opp && `OPPORTUNITY: ${opp.title} by ${opp.org}. Type=${opp.type}. Deadline=${opp.deadline}. Eligibility=${opp.eligibility ?? "see listing"}. Prize/stipend=${opp.prize}. Location=${opp.location}. ${opp.description ?? ""}`,
    ].filter(Boolean).join("\n\n");

    const messages = [
      ...(history ?? []).map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
      { role: "user", content: ctx ? `${ctx}\n\n---\n\n${message}` : message },
    ];

    // Call Claude
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) return json({ error: "agent not configured (set ANTHROPIC_API_KEY secret)" }, 500);

    const ai = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        system: SYSTEM,
        messages,
      }),
    });
    const aiData = await ai.json();
    const reply = (aiData.content ?? []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("\n").trim()
      || "I couldn't generate a response. Try rephrasing.";

    await supabase.from("agent_messages").insert({ thread_id: tid, role: "assistant", content: reply });
    await supabase.from("agent_threads").update({ updated_at: new Date().toISOString() }).eq("id", tid);

    return json({ thread_id: tid, reply });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { ...cors, "content-type": "application/json" } });
}
