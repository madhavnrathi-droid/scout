// public/js/auth.js — timshel auth (Supabase: LinkedIn OIDC + Google + magic link)
// Loaded via <script type="module">. Exposes window.tAuth.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Filled after the Supabase project is provisioned:
const SUPABASE_URL = window.__SUPABASE_URL__ || "";       // e.g. https://xxxx.supabase.co
const SUPABASE_ANON = window.__SUPABASE_ANON__ || "";     // anon public key

export const supabase = (SUPABASE_URL && SUPABASE_ANON)
  ? createClient(SUPABASE_URL, SUPABASE_ANON, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

const REDIRECT = location.origin + "/";

const tAuth = {
  ready: !!supabase,

  // ── LinkedIn (OIDC) — pulls name, email, picture; we map headline/profile ──
  async linkedin() {
    if (!supabase) return this._demo("linkedin_oidc");
    return supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: { redirectTo: REDIRECT, scopes: "openid profile email" },
    });
  },

  // ── Google ──
  async google() {
    if (!supabase) return this._demo("google");
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: REDIRECT, scopes: "openid email profile" },
    });
  },

  // ── College / email magic-link (passwordless) ──
  async magicLink(email) {
    if (!supabase) return this._demo("email");
    return supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: REDIRECT },
    });
  },

  async session() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  // Profile is auto-created by the handle_new_user() trigger from OAuth metadata.
  // This fetches it so onboarding can prefill name/headline/avatar from LinkedIn.
  async profile() {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    return data;
  },

  async saveProfile(patch) {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("profiles").update(patch).eq("id", user.id).select().single();
    return data;
  },

  async signOut() { if (supabase) await supabase.auth.signOut(); },

  // ── apply-through-chat agent ──
  async agent(message, opp_id, thread_id) {
    if (!supabase) throw new Error("not configured");
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/agent`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ message, opp_id, thread_id }),
    });
    return res.json();
  },

  // ── razorpay checkout ──
  async subscribe(plan) {  // 'plus_monthly' | 'plus_yearly' | 'pro_monthly' | 'pro_yearly'
    if (!supabase) throw new Error("not configured");
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/razorpay`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ plan }),
    });
    const { subscription_id, key_id, error } = await res.json();
    if (error) throw new Error(error);
    return new Promise((resolve) => {
      const rzp = new window.Razorpay({
        key: key_id, subscription_id,
        name: "timshel", description: plan.replace("_", " "),
        theme: { color: "#0E0E0E" },
        handler: () => resolve({ ok: true }),
      });
      rzp.open();
    });
  },

  _demo(p) { console.warn("Supabase not configured — demo mode for", p); return { data: null, error: null, demo: true }; },
};

window.tAuth = tAuth;
export default tAuth;
