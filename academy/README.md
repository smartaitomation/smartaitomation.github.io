# SmartAItomation Academy landing pages

Static GitHub Pages section for the four five-day education offers.

## Routes

- `/academy/`
- `/academy/linkedin-guide-to-client/`
- `/academy/ai-micro-saas/`
- `/academy/first-ios-app/`
- `/academy/applied-ai-engineer/`

## Calls to action

The public CTAs currently open the site's existing Google contact form. They are deliberately labeled as founding-launch interest rather than instant checkout. Replace the shared form URL in the HTML files when dedicated checkout or enrollment URLs are ready.

## Analytics

`assets/academy.js` uses the site's existing GA4 measurement ID and emits:

- `page_view`
- `course_select`
- `cta_click`
- `curriculum_view`
- `faq_open`
- `scroll_depth`

It preserves UTM parameters for the browser session. Add `?variant=direct` to an offer URL to activate the alternate direct CTA label; `experiment_variant` is attached to every event.
