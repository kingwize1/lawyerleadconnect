/**
 * @file Step renderer dispatch. Builds the shared header (eyebrow, headline,
 * subtext, content blocks) then delegates the interactive body to the per-type
 * renderer. Extended cleanly for full-screen `slidecover` and `booking` steps.
 */

import { el } from "../dom.js";
import { pipe } from "../piping.js";
import { renderBlocks } from "./blocks.js";
import { renderChoice } from "./choice.js";
import { renderMultiSelect } from "./multiselect.js";
import { renderForm } from "./form.js";
import { renderContent } from "./content.js";
import { renderLanding } from "./landing.js";
import { renderLoader } from "./loader.js";
import { renderSuccess } from "./success.js";
import { renderSlideCover } from "./slidecover.js";
import { renderBooking } from "./booking.js";

/**
 * @param {any} step
 * @param {import('../controller.js').Controller} ctrl
 * @returns {HTMLElement}
 */
export function renderStep(step, ctrl) {
  const data = ctrl.data;
  const screen = el("div", { class: `of-step of-step-${step.type}`, "data-step-id": step.id });

  if (step.type === "landing") {
    screen.appendChild(renderLanding(step, ctrl));
    return screen;
  }

  if (step.type === "slidecover") {
    screen.appendChild(renderSlideCover(step, ctrl));
    return screen;
  }

  const heroImageSrc = step.image || step.heroImage;
  const headerClass = `of-step-header${step.align ? ` of-align-${step.align}` : ""}`;
  const header = el("header", { class: headerClass }, [
    heroImageSrc ? el("img", { class: "of-hero-image", src: heroImageSrc, alt: step.headline || "", loading: "lazy" }) : null,
    step.eyebrow ? el("div", { class: "llc-step-eyebrow", text: pipe(step.eyebrow, data) }) : null,
    step.headline ? el("h1", { class: "of-headline", text: pipe(step.headline, data) }) : null,
    step.subtext ? el("p", { class: "of-subtext", text: pipe(step.subtext, data) }) : null,
  ]);
  if (header.childElementCount) screen.appendChild(header);

  if (step.blocks?.length) screen.appendChild(renderBlocks(step.blocks, data, step, ctrl));

  screen.appendChild(renderBody(step, ctrl));
  return screen;
}

/**
 * @param {any} step
 * @param {import('../controller.js').Controller} ctrl
 * @returns {HTMLElement}
 */
function renderBody(step, ctrl) {
  switch (step.type) {
    case "choice":
      return renderChoice(step, ctrl);
    case "multiselect":
      return renderMultiSelect(step, ctrl);
    case "form":
      return renderForm(step, ctrl);
    case "content":
      return renderContent(step, ctrl);
    case "landing":
      return renderLanding(step, ctrl);
    case "slidecover":
      return renderSlideCover(step, ctrl);
    case "booking":
      return renderBooking(step, ctrl);
    case "loader":
      return renderLoader(step, ctrl);
    case "success":
      return renderSuccess(step, ctrl);
    default:
      return el("div", { class: "of-unknown", text: `Unknown step type: ${step.type}` });
  }
}
