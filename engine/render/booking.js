/**
 * @file `booking` step — interactive Demo Presentation calendar & time-slot
 * picker paired with the live 24/7 Telnyx AI Voice & SMS Specialist hotline.
 */

import { el } from "../dom.js";
import { pipe } from "../piping.js";

const TIMEZONES = [
  { id: "America/New_York", label: "Eastern Time (ET)" },
  { id: "America/Chicago", label: "Central Time (CT)" },
  { id: "America/Denver", label: "Mountain Time (MT)" },
  { id: "America/Los_Angeles", label: "Pacific Time (PT)" },
];

const DEFAULT_SLOTS = [
  { label: "9:30 AM", hour: 9, minute: 30 },
  { label: "11:00 AM", hour: 11, minute: 0 },
  { label: "1:30 PM", hour: 13, minute: 30 },
  { label: "3:00 PM", hour: 15, minute: 0 },
  { label: "4:30 PM", hour: 16, minute: 30 },
  { label: "6:00 PM", hour: 18, minute: 0 },
];

/**
 * Generate the next N upcoming business days (Mon-Fri).
 * @param {number} count
 */
function upcomingBusinessDays(count = 7) {
  const days = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  // Start tomorrow if past 4 PM local
  if (new Date().getHours() >= 16) {
    cursor.setDate(cursor.getDate() + 1);
  }
  while (days.length < count) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) {
      const iso = cursor.toISOString().slice(0, 10);
      const weekday = cursor.toLocaleDateString("en-US", { weekday: "short" });
      const monthDay = cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const fullLabel = cursor.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      days.push({ iso, weekday, monthDay, fullLabel });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function detectTimezone() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIMEZONES.some((t) => t.id === tz)) return tz;
  } catch {
    // Fallback
  }
  return "America/New_York";
}

/**
 * @param {any} step
 * @param {import('../controller.js').Controller} ctrl
 * @returns {HTMLElement}
 */
export function renderBooking(step, ctrl) {
  const days = upcomingBusinessDays(6);
  const slots = step.slots || DEFAULT_SLOTS;
  let selectedDay = days[0];
  let selectedSlot = slots[1] || slots[0];
  let selectedTz = detectTimezone();

  const phoneDisplay = step.aiPhoneDisplay || "(512) 690-0783";
  const phoneE164 = step.aiPhoneE164 || "+15126900783";
  const aiName = step.aiAgentName || "Claire";

  const firm = String(ctrl.state.lead.firm || "our firm");
  const metro = String(ctrl.state.lead.metro || "our metro");
  const smsBody = encodeURIComponent(
    `Hi ${aiName}, I just finished the LawyerLeadConnect quiz for ${firm} (${metro}) regarding the 90-case 12-week guarantee. Can we check territory availability?`,
  );

  // ---- Left column: Calendar & Time Slot Picker ----
  const summaryPill = el("div", { class: "llc-slot-summary" });
  const updateSummary = () => {
    const tzLabel = TIMEZONES.find((t) => t.id === selectedTz)?.label || selectedTz;
    summaryPill.textContent = `Selected: ${selectedDay.weekday}, ${selectedDay.monthDay} at ${selectedSlot.label} (${tzLabel})`;
  };

  const dayGrid = el("div", { class: "llc-day-grid", role: "radiogroup", "aria-label": "Select demo date" });
  days.forEach((d, idx) => {
    const btn = el(
      "button",
      {
        type: "button",
        class: `llc-day-pill${idx === 0 ? " is-selected" : ""}`,
        "aria-checked": idx === 0 ? "true" : "false",
        onclick: () => {
          dayGrid.querySelectorAll(".llc-day-pill").forEach((b) => {
            b.classList.remove("is-selected");
            b.setAttribute("aria-checked", "false");
          });
          btn.classList.add("is-selected");
          btn.setAttribute("aria-checked", "true");
          selectedDay = d;
          updateSummary();
        },
      },
      [
        el("span", { class: "llc-day-wk", text: d.weekday }),
        el("span", { class: "llc-day-md", text: d.monthDay }),
      ],
    );
    dayGrid.appendChild(btn);
  });

  const tzSelect = el(
    "select",
    {
      class: "llc-tz-select",
      "aria-label": "Timezone",
      onchange: (/** @type {Event} */ e) => {
        selectedTz = /** @type {HTMLSelectElement} */ (e.target).value;
        updateSummary();
      },
    },
    TIMEZONES.map((t) =>
      el("option", { value: t.id, text: t.label, selected: t.id === selectedTz ? true : undefined }),
    ),
  );

  const slotGrid = el("div", { class: "llc-time-grid", role: "radiogroup", "aria-label": "Select demo time" });
  slots.forEach((s, idx) => {
    const isDefault = idx === 1;
    const btn = el(
      "button",
      {
        type: "button",
        class: `llc-time-pill${isDefault ? " is-selected" : ""}`,
        "aria-checked": isDefault ? "true" : "false",
        text: s.label,
        onclick: () => {
          slotGrid.querySelectorAll(".llc-time-pill").forEach((b) => {
            b.classList.remove("is-selected");
            b.setAttribute("aria-checked", "false");
          });
          btn.classList.add("is-selected");
          btn.setAttribute("aria-checked", "true");
          selectedSlot = s;
          updateSummary();
        },
      },
    );
    slotGrid.appendChild(btn);
  });

  updateSummary();

  const confirmBtn = el("button", {
    type: "button",
    class: "of-cta llc-confirm-slot-btn",
    text: step.confirmLabel || "Confirm My Demo Presentation Slot →",
    onclick: () => {
      const tzLabel = TIMEZONES.find((t) => t.id === selectedTz)?.label || selectedTz;
      ctrl.bookSlot({
        bookingMode: "calendar",
        bookingDateIso: selectedDay.iso,
        bookingDateLabel: selectedDay.fullLabel,
        bookingTimeLabel: selectedSlot.label,
        bookingHour: selectedSlot.hour,
        bookingMinute: selectedSlot.minute,
        bookingTimezone: selectedTz,
        bookingTimezoneLabel: tzLabel,
        bookingDisplay: `${selectedDay.fullLabel} at ${selectedSlot.label} (${tzLabel})`,
        aiPhoneDisplay: phoneDisplay,
        aiPhoneE164: phoneE164,
      });
    },
  });

  const calendarCard = el("div", { class: "llc-booking-card llc-calendar-card" }, [
    el("div", { class: "llc-card-kicker", text: "OPTION 1 · SCHEDULE LIVE 1-ON-1 DEMO" }),
    el("h2", { class: "llc-card-title", text: "Pick Your 30-Min Growth Flywheel Slot" }),
    el("div", { class: "llc-picker-label", text: "1. Choose a Day" }),
    dayGrid,
    el("div", { class: "llc-picker-row" }, [
      el("div", { class: "llc-picker-label", text: "2. Choose a Time" }),
      tzSelect,
    ]),
    slotGrid,
    summaryPill,
    confirmBtn,
  ]);

  // ---- Right column: Live 24/7 Telnyx AI Voice & SMS Hotline ----
  const copyBtn = el("button", {
    type: "button",
    class: "llc-copy-btn",
    text: "Copy Number",
    onclick: async () => {
      try {
        await navigator.clipboard.writeText(phoneDisplay);
        copyBtn.textContent = "Copied ✓";
        setTimeout(() => (copyBtn.textContent = "Copy Number"), 2000);
      } catch {
        copyBtn.textContent = phoneDisplay;
      }
    },
  });

  const aiCard = el("div", { class: "llc-booking-card llc-ai-hotline-card" }, [
    el("div", { class: "llc-live-badge" }, [
      el("span", { class: "llc-live-dot", "aria-hidden": "true" }),
      el("span", { text: "LIVE 24/7 · AI VOICE & SMS SPECIALIST" }),
    ]),
    el("h2", {
      class: "llc-card-title",
      text: pipe(step.aiHeadline || `Skip The Wait — Call or Text ${aiName} Now`, ctrl.data),
    }),
    el("p", {
      class: "llc-ai-desc",
      text: pipe(
        step.aiSubtext ||
          `Speak directly with ${aiName}, our AI Legal Growth Specialist, to check exclusive territory availability for {{metro}}, review the 90-case guarantee, or lock your demo instantly.`,
        ctrl.data,
      ),
    }),
    el("div", { class: "llc-phone-box" }, [
      el("a", {
        class: "llc-phone-number",
        href: `tel:${phoneE164}`,
        text: phoneDisplay,
      }),
      copyBtn,
    ]),
    el("div", { class: "llc-ai-actions" }, [
      el("a", {
        class: "llc-btn-call",
        href: `tel:${phoneE164}`,
        text: `📞 Call ${phoneDisplay} Now`,
      }),
      el("a", {
        class: "llc-btn-sms",
        href: `sms:${phoneE164}?&body=${smsBody}`,
        text: `💬 Text ${aiName} (SMS Ready)`,
      }),
    ]),
    el("div", {
      class: "llc-ai-note",
      text: "⚡ Calling or texting this line also demonstrates the exact <30-second AI Speed-to-Lead intake system we deploy for our partner firms.",
    }),
    el("button", {
      type: "button",
      class: "llc-skip-link",
      text: "I'm calling or texting Claire directly — continue to summary →",
      onclick: () => {
        ctrl.bookSlot({
          bookingMode: "direct_ai_call",
          bookingDisplay: `Direct AI Specialist Line — ${phoneDisplay} (Voice & SMS)`,
          aiPhoneDisplay: phoneDisplay,
          aiPhoneE164: phoneE164,
        });
      },
    }),
  ]);

  return el("div", { class: "llc-booking-grid" }, [calendarCard, aiCard]);
}
