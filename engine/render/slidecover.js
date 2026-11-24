/**
 * @file `slidecover` step — full-bleed dark presentation cover slide matching
 * the exact high-converting slide deck landing aesthetic.
 */

import { el } from "../dom.js";

/**
 * @param {any} step
 * @param {import('../controller.js').Controller} ctrl
 * @returns {HTMLElement}
 */
export function renderSlideCover(step, ctrl) {
  const goNext = () => ctrl.advance({ next: step.next });

  const eyebrow = step.eyebrow
    ? el("p", { class: "llc-cover-eyebrow", text: step.eyebrow })
    : null;

  // Build exact centerpiece headline with underlined guarantee segment
  const headlineEl = el("h1", { class: "llc-cover-headline" });
  if (step.headlineBefore || step.headlineUnderline || step.headlineAfter) {
    if (step.headlineBefore) {
      headlineEl.appendChild(document.createTextNode(step.headlineBefore));
    }
    if (step.headlineUnderline) {
      headlineEl.appendChild(
        el("span", { class: "llc-cover-underline", text: step.headlineUnderline }),
      );
    }
    if (step.headlineAfter) {
      headlineEl.appendChild(document.createTextNode(step.headlineAfter));
    }
  } else if (step.headline) {
    headlineEl.textContent = step.headline;
  }

  const punchline = step.punchline
    ? el("p", { class: "llc-cover-punchline", text: step.punchline })
    : null;

  const instruction = step.subtext
    ? el("p", { class: "llc-cover-subtext", text: step.subtext })
    : null;

  const centerBlock = el("div", { class: "llc-cover-center" }, [
    eyebrow,
    headlineEl,
    punchline,
    instruction,
  ]);

  // Bottom-left "Press The Right Arrow To Continue" visual cue (exact layout match)
  const cueBtn = el(
    "button",
    {
      type: "button",
      class: "llc-cover-cue",
      onclick: goNext,
      "aria-label": "Press the right arrow to continue to the next slide",
    },
    [
      el("span", { class: "llc-cover-cue-text" }, [
        el("span", { text: step.cueLine1 || "Press The Right" }),
        el("span", { text: step.cueLine2 || "Arrow To Continue" }),
      ]),
      el("span", { class: "llc-cover-cue-guide", "aria-hidden": "true", html: pointingGuideSvg() }),
    ],
  );

  // Prominent right-edge / mobile-friendly slide advance button
  const nextArrowBtn = el(
    "button",
    {
      type: "button",
      class: "llc-cover-next-btn",
      onclick: goNext,
      "aria-label": "Continue to next slide",
    },
    [
      el("span", { class: "llc-cover-next-label", text: step.ctaLabel || "Start Slides" }),
      el("span", { class: "llc-cover-next-icon", "aria-hidden": "true", html: "&#8594;" }),
    ],
  );

  const footerRow = el("div", { class: "llc-cover-footer" }, [cueBtn, nextArrowBtn]);

  return el("div", { class: "llc-slide-cover" }, [centerBlock, footerRow]);
}

function pointingGuideSvg() {
  return `<svg width="64" height="54" viewBox="0 0 64 54" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="17" r="9.5" fill="#F4C7A8"/>
    <path d="M14.8 15.5C15.5 9.8 19.6 6.5 24.4 6.5C29.4 6.5 33.1 10 33.4 15.3C31 12.6 27.6 11.4 23.6 11.6C19.8 11.8 16.9 13.3 14.8 15.5Z" fill="#4A2E20"/>
    <circle cx="21.2" cy="17.2" r="1.15" fill="#1F2430"/>
    <circle cx="26.8" cy="17.2" r="1.15" fill="#1F2430"/>
    <path d="M21.2 21.2C22.7 22.7 25.3 22.7 26.8 21.2" stroke="#9B5546" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M10 49C10 37.5 15.8 31 24 31C30.8 31 35.6 35.3 37.2 42.2L49.5 39.2C51.6 38.7 53.5 40.2 53.5 42.3C53.5 44 52.3 45.4 50.6 45.8L37 49.5V54H10V49Z" fill="#E6E8EE"/>
    <path d="M21 31L24 37.5L27 31H21Z" fill="#1B1B1D"/>
    <path d="M47 42.3H59M59 42.3L54.2 37.8M59 42.3L54.2 46.8" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
