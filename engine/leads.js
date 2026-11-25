/**
 * @file Lead + event sinks — forwards captured leads & demo bookings to your
 * email inbox (via FormSubmit AJAX) or custom CRM webhook, with full quiz
 * answers and UTM attribution. Non-blocking and failure-tolerant.
 */

import { hasPreviewFlag } from "./dom.js";

function getUtmParams() {
  if (typeof location === "undefined" || !location.search) return {};
  try {
    const params = new URLSearchParams(location.search);
    /** @type {Record<string, string>} */
    const utm = {};
    const keys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gclid",
      "fbclid",
      "ttclid",
      "ref",
    ];
    for (const key of keys) {
      const val = params.get(key);
      if (val) utm[key] = val;
    }
    return utm;
  } catch {
    return {};
  }
}

function formatList(val) {
  if (Array.isArray(val)) return val.join(", ");
  if (val == null) return "";
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function buildFormSubmitPayload(lead, answers, ctx, utm) {
  const isBooked = Boolean(ctx.meta?.booked || lead.bookingMode);
  const firm = String(lead.firm || lead.name || "New Law Firm");
  const metro = String(lead.metro || "US Territory");
  const bookingDisplay = String(lead.bookingDisplay || "Selecting Demo Time Slot");

  const subject = isBooked
    ? `📅 Demo Booked — ${firm} (${metro}) | LawyerLeadConnect`
    : `🔥 New Qualified Lead — ${firm} (${metro}) | LawyerLeadConnect`;

  const utmSummary = Object.keys(utm).length
    ? Object.entries(utm)
        .map(([k, v]) => `${k}=${v}`)
        .join(" | ")
    : "Direct / Organic";

  /** @type {Record<string, string>} */
  const payload = {
    _subject: subject,
    _template: "table",
    _captcha: "false",
    Stage: isBooked
      ? lead.bookingMode === "direct_ai_call"
        ? "Direct AI Specialist Call/SMS Selected"
        : "Demo Presentation Slot Confirmed"
      : "Quiz Completed — Application Submitted",
    "Full Name": String(lead.name || ""),
    "Law Firm": String(lead.firm || ""),
    "Exclusive Metro Territory": String(lead.metro || ""),
    "Work Email": String(lead.email || ""),
    "Mobile Phone": String(lead.phone || ""),
    "Demo Slot": isBooked ? bookingDisplay : "Pending slot selection (Slide 12)",
    "Practice Area": formatList(answers.practice_area),
    "Current Monthly Cases": formatList(answers.current_volume),
    "Average Case Value": formatList(answers.avg_case_value),
    "Growth Bottlenecks": formatList(answers.bottlenecks),
    "Intake Capacity": formatList(answers.intake_capacity),
    "Monthly Ad Budget": formatList(answers.monthly_budget),
    "AI Hotline": String(lead.aiPhoneDisplay || "(512) 690-0783"),
    "UTM Attribution": utmSummary,
    "Funnel URL": typeof location !== "undefined" ? location.href : "https://lawyerleadconnect.com/",
    "Submitted At": new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  };

  if (lead.email) {
    payload._replyto = String(lead.email);
  }
  return payload;
}

/**
 * POST a captured lead to FormSubmit AJAX email forwarding or a custom webhook.
 *
 * @param {Record<string, unknown>} lead      Form field values.
 * @param {Record<string, unknown>} answers   Quiz answers keyed by step id.
 * @param {{ endpoint?: string, funnelId?: string, sessionId?: string, meta?: Record<string, unknown> }} ctx
 * @returns {Promise<boolean>} Resolves true on a 2xx, false otherwise (never throws).
 */
export async function submitLead(lead, answers, ctx = {}) {
  const isPreview = Boolean(
    ctx.meta?.preview ||
    ctx.meta?.isPreview ||
    (typeof window !== "undefined" && hasPreviewFlag(window.location.search))
  );
  const endpoint = ctx.endpoint || "";
  if (!endpoint) return false;

  const utm = getUtmParams();
  const isFormSubmit = /formsubmit\.co\/ajax\//i.test(endpoint);

  const body = isFormSubmit
    ? buildFormSubmitPayload(lead, answers, ctx, utm)
    : {
        funnelId: ctx.funnelId,
        sessionId: ctx.sessionId,
        lead,
        answers,
        preview: isPreview,
        meta: {
          url: typeof location !== "undefined" ? location.href : undefined,
          referrer: typeof document !== "undefined" ? document.referrer : undefined,
          utm,
          preview: isPreview,
          ...ctx.meta,
        },
        ts: Date.now(),
      };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      keepalive: true,
    });
    return res.ok;
  } catch (err) {
    console.warn("[openfunnel] submitLead failed (non-fatal):", err);
    return false;
  }
}

/**
 * Ship a single funnel analytics event to your ingest endpoint. Fire-and-forget.
 *
 * @param {import('./types.js').FunnelEvent} event
 * @param {{ endpoint?: string }} [ctx]
 */
export function trackEvent(event, ctx = {}) {
  const endpoint = ctx.endpoint || "";
  if (!endpoint) return;
  const payload = JSON.stringify(event);
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }
    void fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* analytics must never throw into the funnel */
  }
}
