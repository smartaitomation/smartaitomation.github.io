# RudRise learning mode — proposed design, October 3, 2026

## Audience
Primary: early-stage drummers who can hold sticks and play basic strokes, but need to know what to practice, how to structure it, and how rudiments apply to music. They may have taken a few classes or learned independently. Prior paid classes are not a prerequisite. This is a design hypothesis, not validated audience research.

Secondary: complete beginners. Offer optional equipment, grip/posture demonstration, R/L vocabulary and pulse explanation. The prototype contains written setup cues; real original instructional demonstrations are still required. A pad and sticks suffice for starting. No notation knowledge or drum kit is required for pad practice. Kit application requires a basic groove; provide a pad alternative.

Secondary: experienced/returning drummers. Let them skip teaching and jump to a selected exercise and the existing ladder.

## Flow and why it helps
1. Learning path: limits initial choices and identifies the next useful practice.
2. Before you start: optional basics prevent assumptions about terminology and equipment.
3. Understand pattern: hand labels, lead switching and synchronized highlighting explain the sequence.
4. Guided exercises: one target at a time — evenness, opposite-hand lead, accents.
5. Tempo ladder: reuse existing hands-free practice, repeat and slower controls.
6. Musical application: connect the pattern to a fill or accented pad phrase.
7. Reflection: self-reported comfortable BPM and difficulty choose the next session.

## First release and boundaries
Three original lessons: single strokes, double strokes, paradiddle. The clickable example explores the paradiddle lesson; other lesson content is proposed, not implemented. Keep the existing 40-rudiment library accessible. Proposed free: basics and single strokes. Proposed premium: further paths/custom practice; this boundary needs product selection and must preserve existing entitlement access. No new paywall or onboarding redesign is proposed in this artifact.

No microphone scoring, mastery claims or generative AI needed. No measurable improvement claims made. User benefit remains a product hypothesis until tested with drummers.

Use original explanations, notation and exercises. Original/licensed stroke demonstrations and backing audio are future assets. Prototype oscillator sound is a timing cue only. Do not copy Drumeo pages, arrangements, recordings or branding.

## Implementation checklist for a later authorized build
- Expert drummer reviews rhythms, hand lead, accents, subdivisions, grace-note representation and teaching language.
- Structured exercise event model, original notation, synchronized hand-matched audio; accessible static alternative/Reduce Motion.
- Native lesson views and integration into the existing ladder without changing existing saved sessions.
- Exercise-level reflection/progress persistence, edit/reset and resume behavior.
- Existing premium entitlement routing and agreed free boundary.
- In-app localization and voice/audio accessibility.
- Runtime tests on the canonical simulator; refresh only affected flow screenshots/PDF and storefront evidence.

## Verification of this artifact
Browser rendered successfully in the Codex narrow preview. Inspected pattern screen visually. Verified lesson navigation, left lead changes sticking, Play/Pause changes state, exercise to ladder, Too fast changes 60 to 55 BPM, musical application to reflection, Uneven doubles changes next-session advice, save feedback appears. Browser sound fidelity and actual drummer technique were not evaluated. JavaScript syntax checked before the final dynamic BPM label correction; that correction only changes template text. No native source changed.

Delivery start was refused because another Codex task owns the app delivery state. Its state and evidence were left intact. This artifact is browser-reviewed; not a gate-validated native implementation.

## Follow-up — all navigation tabs
Today, Learn, Rudiments and Progress now have real button navigation and active states. Today starts a single-stroke practice. Rudiments includes five original demo entries, searchable/filterable catalog, detail screens and selected-pattern practice. Progress uses browser-local demo storage, session reflections, practice-again and record deletion. Library is a five-entry prototype, not a replacement for the native 40-rudiment catalog.
Browser verification: Today rendered; search for double returned the double-stroke entry; detail-to-practice preserved its sticking; Today-to-practice-to-reflection-to-save produced a single-stroke record in Progress; Practice again retained its pattern and BPM; record persisted after reload; deletion restored the empty state; Learn navigation remained available. Test record removed. Native source was not modified. Existing delivery task ownership remains unresolved; no gate-completion claim is made for this HTML-only update.
