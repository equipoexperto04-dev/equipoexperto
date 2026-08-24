/**
 * Configuration Pages Index
 *
 * This directory contains all employee configuration pages.
 * Each page follows the Config Page Design System v3.
 *
 * Quick Reference:
 * ─────────────────────────────────────────────────────────
 * File               | Employee        | Accent  | Purpose
 * ────────────────────┼─────────────────┼─────────┼──────────
 * LeadCapture.jsx    | Lead Scout      | Blue    | Capture & qualify leads
 * ReviewFunnel.jsx   | Review Funnel   | Orange  | Collect Google reviews
 * LeadFollowUp.jsx   | Follow-up Agent | Purple  | Re-engage cold leads
 * ─────────────────────────────────────────────────────────
 *
 * Design System:
 * - CSS: Config.css (v3 Precision Utility)
 * - Template: ConfigPageTemplate.jsx
 * - Docs: DESIGN_SYSTEM.md
 *
 * All pages share:
 * - Consistent two-column layout
 * - CSS variable theming (--cfg-accent)
 * - Tab-based navigation
 * - Sticky sidebar with quick actions
 * - Conditional save button (appears on change)
 * - Status badge (Working/Off Duty)
 */

export { default as LeadCapture } from './LeadCapture';
export { default as ReviewFunnel } from './ReviewFunnel';
export { default as LeadFollowUp } from './LeadFollowUp';

// Future config pages:
// export { default as NewEmployeeConfig } from './NewEmployeeConfig';
