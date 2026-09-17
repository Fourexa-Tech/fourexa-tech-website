/**
 * Reference implementation of POST /api/contact
 *
 * This is a static site, so this file is NOT live on its own — it's a
 * ready-to-deploy serverless function. Two ways to wire it up:
 *
 *   1. Vercel: drop this file at /api/contact.js in a Vercel project
 *      (works as-is with zero config beyond the env vars below).
 *   2. Any other host: port the handler body into your framework's
 *      equivalent of an API route (Netlify Functions, Express, etc).
 *      The validation/sanitization/email logic stays the same.
 *
 * Required environment variables (set in your hosting provider, never
 * hard-coded, never exposed to the browser):
 *
 *   RESEND_API_KEY   - API key from https://resend.com (or swap the
 *                       sendEmail() call below for SendGrid/SMTP/your CRM)
 *   EMAIL_FROM       - verified sending address, e.g. no-reply@fourexatech.com
 *   EMAIL_TO         - where inquiries should land, e.g. fourexatechnologies@gmail.com
 *
 * Until these are set, this function intentionally returns a 500 with a
 * clear message rather than pretending an email was sent.
 */

const REQUIRED_FIELDS = ["name", "company", "email", "service", "problem"];

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function sanitize(value, maxLength = 2000) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

// Very small in-memory rate limiter (per function instance — for real
// protection at scale, use your platform's rate limiting or a service
// like Upstash/Cloudflare Turnstile in front of this route).
const submissions = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxPerWindow = 5;
  const timestamps = (submissions.get(ip) || []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  submissions.set(ip, timestamps);
  return timestamps.length > maxPerWindow;
}

async function sendEmail({ apiKey, from, to, subject, text }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, text }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Email provider error (${res.status}): ${detail}`);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: "Too many requests. Please try again in a minute." });
  }

  let body = req.body;
  if (!body || typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      return res.status(400).json({ ok: false, error: "Invalid request body." });
    }
  }

  const missing = REQUIRED_FIELDS.filter((f) => !body[f] || String(body[f]).trim() === "");
  if (missing.length) {
    return res.status(400).json({ ok: false, error: `Missing required field(s): ${missing.join(", ")}` });
  }
  if (!isValidEmail(body.email)) {
    return res.status(400).json({ ok: false, error: "Invalid email address." });
  }

  const clean = {
    name: sanitize(body.name, 120),
    company: sanitize(body.company, 160),
    email: sanitize(body.email, 160),
    phone: sanitize(body.phone, 40),
    industry: sanitize(body.industry, 120),
    service: sanitize(body.service, 120),
    problem: sanitize(body.problem, 3000),
    link: sanitize(body.link, 300),
    budget: sanitize(body.budget, 120),
    timeline: sanitize(body.timeline, 120),
    details: sanitize(body.details, 3000),
  };

  const { RESEND_API_KEY, EMAIL_FROM, EMAIL_TO } = process.env;
  if (!RESEND_API_KEY || !EMAIL_FROM || !EMAIL_TO) {
    console.error("Contact form is not configured: missing RESEND_API_KEY / EMAIL_FROM / EMAIL_TO env vars.");
    return res.status(500).json({
      ok: false,
      error: "The contact form isn't fully configured yet. Please email us directly instead.",
    });
  }

  try {
    await sendEmail({
      apiKey: RESEND_API_KEY,
      from: EMAIL_FROM,
      to: EMAIL_TO,
      subject: `New inquiry from ${clean.name} (${clean.company})`,
      text: Object.entries(clean)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n"),
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Failed to send contact email:", err);
    return res.status(502).json({ ok: false, error: "Could not deliver your message right now. Please try again shortly." });
  }
};
