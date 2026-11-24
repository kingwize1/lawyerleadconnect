/**
 * @file `success` step — terminal confirmation screen with personalized
 * booking summary, 1-click Google Calendar & .ICS export, and live Telnyx AI
 * Voice & SMS close actions.
 */

import { el } from "../dom.js";
import { pipe } from "../piping.js";

function pad(n) {
  return String(n).padStart(2, "0");
}

function buildCalendarDates(lead) {
  if (!lead.bookingDateIso) return null;
  const [y, m, d] = String(lead.bookingDateIso).split("-").map(Number);
  const hour = Number(lead.bookingHour ?? 11);
  const minute = Number(lead.bookingMinute ?? 0);
  const start = `${y}${pad(m)}${pad(d)}T${pad(hour)}${pad(minute)}00`;
  const endDate = new Date(y, m - 1, d, hour, minute + 30);
  const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
  return { start, end };
}

function googleCalendarUrl(lead, phoneDisplay) {
  const dates = buildCalendarDates(lead);
  const title = encodeURIComponent(
    `LawyerLeadConnect — 90-Case Law Firm Growth Flywheel Demo (${lead.firm || "Partner Review"})`,
  );
  const details = encodeURIComponent(
    `1-on-1 Law Firm Growth Flywheel Demo Presentation.\n` +
      `Firm: ${lead.firm || "N/A"}\n` +
      `Metro Territory: ${lead.metro || "N/A"}\n` +
      `24/7 AI Concierge Voice & SMS Line: ${phoneDisplay}\n` +
      `Website: https://lawyerleadconnect.com`,
  );
  const location = encodeURIComponent(`Direct Hotline: ${phoneDisplay} | lawyerleadconnect.com`);
  const datePart = dates ? `&dates=${dates.start}/${dates.end}` : "";
  const ctz = lead.bookingTimezone ? `&ctz=${encodeURIComponent(lead.bookingTimezone)}` : "";
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}${datePart}${ctz}&details=${details}&location=${location}`;
}

function downloadIcs(lead, phoneDisplay) {
  const dates = buildCalendarDates(lead);
  if (!dates) return;
  const tz = lead.bookingTimezone || "America/New_York";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LawyerLeadConnect//Growth Flywheel Demo//EN",
    "BEGIN:VEVENT",
    `UID:llc-${Date.now()}@lawyerleadconnect.com`,
    `DTSTART;TZID=${tz}:${dates.start}`,
    `DTEND;TZID=${tz}:${dates.end}`,
    `SUMMARY:LawyerLeadConnect — 90-Case Law Firm Growth Flywheel Demo`,
    `DESCRIPTION:1-on-1 Custom Law Firm Growth Flywheel Demo Presentation for ${lead.firm || "your firm"}. Direct 24/7 AI Specialist Voice & SMS Line: ${phoneDisplay}`,
    `LOCATION:${phoneDisplay} / https://lawyerleadconnect.com`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "LawyerLeadConnect-Demo.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * @param {any} step
 * @param {import('../controller.js').Controller} ctrl
 * @returns {HTMLElement}
 */
export function renderSuccess(step, ctrl) {
  const lead = ctrl.state.lead || {};
  const answers = ctrl.state.answers || {};
  const phoneDisplay = lead.aiPhoneDisplay || step.aiPhoneDisplay || "(512) 690-0783";
  const phoneE164 = lead.aiPhoneE164 || step.aiPhoneE164 || "+15126900783";
  const hasCalendarSlot = lead.bookingMode === "calendar" && Boolean(lead.bookingDateIso);

  const summaryRows = [
    { label: "Law Firm", value: String(lead.firm || "Qualified Partner Firm") },
    { label: "Exclusive Metro Check", value: String(lead.metro || "Priority Territory Review") },
    { label: "Practice Focus", value: String(answers.practice_area || "Family & Personal Injury") },
    {
      label: "Demo Presentation Slot",
      value: String(lead.bookingDisplay || `Direct AI Hotline — ${phoneDisplay}`),
    },
    { label: "12-Week Target Guarantee", value: "90 New Cases · $675,000+ Min. Case Value" },
  ];

  const summaryCard = el(
    "div",
    { class: "llc-summary-card" },
    summaryRows.map((row) =>
      el("div", { class: "llc-summary-row" }, [
        el("span", { class: "llc-summary-label", text: row.label }),
        el("span", { class: "llc-summary-value", text: row.value }),
      ]),
    ),
  );

  const smsText = encodeURIComponent(
    `Hi Claire, I just booked my LawyerLeadConnect demo (${lead.bookingDisplay || "Priority"}) for ${lead.firm || "my firm"} in ${lead.metro || "my metro"}.`,
  );

  const calendarActions = hasCalendarSlot
    ? el("div", { class: "llc-success-cal-row" }, [
        el("a", {
          class: "llc-btn-gcal",
          href: googleCalendarUrl(lead, phoneDisplay),
          target: "_blank",
          rel: "noopener noreferrer",
          text: "📅 Add to Google Calendar",
        }),
        el("button", {
          type: "button",
          class: "llc-btn-ics",
          text: "⬇ Download .ICS Invite",
          onclick: () => downloadIcs(lead, phoneDisplay),
        }),
      ])
    : null;

  const hotlinePanel = el("div", { class: "llc-success-hotline" }, [
    el("div", { class: "llc-live-badge" }, [
      el("span", { class: "llc-live-dot", "aria-hidden": "true" }),
      el("span", { text: "DIRECT 24/7 AI VOICE & SMS LINE — CLAIRE" }),
    ]),
    el("p", {
      class: "llc-success-hotline-text",
      text: pipe(
        step.hotlineNote ||
          "Have a question before your presentation, want to test our AI Legal Intake live, or need to adjust your time? Call or text our dedicated AI Growth Specialist line anytime:",
        ctrl.data,
      ),
    }),
    el("div", { class: "llc-ai-actions" }, [
      el("a", {
        class: "llc-btn-call",
        href: `tel:${phoneE164}`,
        text: `📞 Call ${phoneDisplay}`,
      }),
      el("a", {
        class: "llc-btn-sms",
        href: `sms:${phoneE164}?&body=${smsText}`,
        text: `💬 Text ${phoneDisplay} (SMS)`,
      }),
    ]),
  ]);

  const restartBtn = el("button", {
    type: "button",
    class: "llc-restart-link",
    text: "↺ Start presentation over from Slide 1",
    onclick: () => {
      try {
        localStorage.removeItem(`openfunnel:v1:${ctrl.key}`);
      } catch {
        // ignore
      }
      ctrl.state.history = [];
      ctrl.state.index = 0;
      ctrl.refresh();
    },
  });

  const wrap = el("div", { class: "of-success llc-success-wrap" }, [
    el("div", { class: "of-success-check", "aria-hidden": "true", html: successMark() }),
    summaryCard,
    calendarActions,
    hotlinePanel,
    restartBtn,
  ]);

  return wrap;
}

function successMark() {
  return `<svg viewBox="0 0 52 52" width="64" height="64" role="img" aria-label="Confirmed">
    <circle class="of-check-circle" cx="26" cy="26" r="24" fill="none"/>
    <path class="of-check-path" fill="none" d="M14 27 l8 8 l16 -18"/>
  </svg>`;
}
