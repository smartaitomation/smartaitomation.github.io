/* No telemetry. The form handoff is a navigation, never a submitted-lead event. */
(() => {
  "use strict";
  const offers = {
    workshop: {name: "Production AI Workshop", path: "workshop.html", why: "Teach your engineers to evaluate, diagnose and improve AI across projects."},
    core: {name: "AI Core Foundation", path: "ai-core.html", why: "Build shared infrastructure your team can reuse across products."},
    development: {name: "Embedded AI Development", path: "development.html", why: "Put hands-on AI engineering alongside your existing team."}
  };
  const questions = [
    {id:"intent", title:"What would help your team most?", help:"Choose the primary need. You can compare the other options after the result.", options:[
      ["workshop","Teach our engineers","Build skills around our own problem."],
      ["core","Create a reusable AI foundation","Share the core across future use cases."],
      ["development","Help us build and ship","Hands-on product implementation."],
      ["unsure","Help us choose","We need to diagnose the next step."]]},
    {id:"stage", title:"What exists today?", help:"Your starting point changes the first useful milestone.", options:[
      ["idea","A defined idea or business problem"],
      ["prototype","A prototype or proof of concept"],
      ["live","A live product with quality or reliability gaps"],
      ["multiple","Several separate AI features or applications"]]},
    {id:"blocker", title:"What needs to improve first?", help:"Choose the bottleneck that would make the biggest difference.", options:[
      ["capability","Our team's ability to build and evaluate AI"],
      ["quality","Answer quality, retrieval or extracted data"],
      ["agents","Agent task completion and tool reliability"],
      ["operations","Cost, latency, logging or operational reliability"],
      ["reuse","Reuse across products and use cases"]]},
    {id:"team", title:"Who will own the system internally?", help:"A named owner is essential for making the work useful after handover.", options:[
      ["engineers","An existing engineering team"],
      ["founder","A technical founder or individual engineer"],
      ["hiring","We are hiring a technical owner"],
      ["none","We do not have a technical owner yet"]]},
    {id:"data", title:"Can you provide approved task examples?", help:"We only need the readiness level here. Do not upload data or credentials.", options:[
      ["ready","Yes—representative data is available and approved"],
      ["sanitize","Yes—after we sanitize it or approve access"],
      ["restricted","Access needs security or procurement review"],
      ["missing","We still need to collect the examples"]]},
    {id:"timing", title:"When are you ready to start?", help:"This helps distinguish an active project from future planning.", options:[
      ["30days","Within 30 days"],
      ["90days","In 1–3 months"],
      ["later","More than 3 months away"],
      ["exploring","Exploring; no start date yet"]]},
    {id:"budget", title:"Is there a budget for this work?", help:"We discuss the scope before proposing a fee.", options:[
      ["approved","Yes, we have an approved budget"],
      ["scoping","We can invest once the scope is clear"],
      ["approval","We need internal approval"],
      ["research","We are researching for now"]]},
    {id:"decision", title:"How will the decision be made?", help:"We will use this to frame the next conversation.", options:[
      ["owner","I own or approve the budget"],
      ["shared","I recommend; another person approves"],
      ["research","I am gathering options for the team"]]}
  ];
  function chosenOffer(a) {
    if (offers[a.intent]) return a.intent;
    if (a.blocker === "capability") return "workshop";
    if (a.blocker === "reuse" || a.stage === "multiple") return "core";
    return "development";
  }
  function evaluate(a) {
    const key = chosenOffer(a);
    const notices = [];
    if (a.budget === "approval") notices.push("Use this brief to align the budget approver on the problem and scope.");
    else if (a.budget === "scoping") notices.push("We will define the scope and proposed fee together.");
    else if (a.budget === "research") notices.push("Keep the brief for planning and return when the team is ready to invest.");
    if (["none","hiring"].includes(a.team)) notices.push("Name a technical owner before starting. A workshop needs engineers to participate, and a core needs someone to maintain it after handover.");
    if (a.data !== "ready") notices.push(a.data === "restricted" ? "Security or procurement review is a prerequisite. Confirm permitted data access, tools and deployment requirements before setting a start date." : a.data === "missing" ? "Collect representative examples first. Data readiness and labeling effort need to be scoped before an implementation or tailored lab can begin." : "Prepare sanitized examples and approve the access process before the engagement.");
    if (["later","exploring"].includes(a.timing)) notices.push("This is a planning-stage fit. Keep the brief and revisit the scope when your start date becomes clearer.");
    if (a.decision !== "owner") notices.push("Include the budget approver in the scoping discussion so delivery requirements and investment are aligned.");
    const ready = ["approved","scoping"].includes(a.budget) && ["engineers","founder"].includes(a.team) && a.data === "ready" && ["30days","90days"].includes(a.timing) && a.decision === "owner";
    return {key, offer:offers[key], notices, status:ready ? "Ready for a scoping conversation" : "Potential fit · prerequisites to discuss"};
  }
  const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSecnK6s4_qz5O3iUyD67HQ13itEEOFldQw5bR7zOBPWcZv3RA/viewform";
  const label = (id, value) => questions.find(q => q.id === id)?.options.find(o => o[0] === value)?.[1] || "Not answered";
  function brief(a) {
    const r = evaluate(a);
    return ["Production AI project brief", "Suggested engagement: " + r.offer.name, "Readiness: " + r.status,
      ...questions.map(q => q.title + ": " + label(q.id,a[q.id])),
      ...(r.notices.length ? ["\nItems to discuss:", ...r.notices.map(n => "- " + n)] : []),
      "\nCompany / website: ", "Use case and desired business outcome: ", "Preferred way to contact me: ",
      "\nSource: https://smartaitomation.com/production-ai/fit.html",
      "This brief is an inquiry, not a booking, purchase or confirmed proposal."].join("\n");
  }
  function formUrl(a) {
    const url = new URL(FORM_URL);
    url.searchParams.set("usp","pp_url");
    url.searchParams.set("hl","en");
    url.searchParams.set("entry.551351004", "Production AI inquiry — " + evaluate(a).offer.name);
    url.searchParams.set("entry.34914861", brief(a));
    return url.href;
  }
  function sanitize(raw) {
    const clean = {};
    if (!raw || typeof raw !== "object") return clean;
    questions.forEach(q => {if (q.options.some(o => o[0] === raw[q.id])) clean[q.id] = raw[q.id];});
    return clean;
  }
  function updateAnswer(a, id, value) {
    return {...a, [id]:value};
  }
  if (typeof module !== "undefined" && module.exports) module.exports = {questions,evaluate,chosenOffer,brief,formUrl,sanitize,updateAnswer};
  if (typeof document === "undefined") return;
  const host = document.getElementById("quiz");
  if (!host) return;
  const STORAGE = "smartai_fit_v2";
  let answers = {}, step = 0;
  try { const saved = JSON.parse(sessionStorage.getItem(STORAGE)); answers = sanitize(saved?.answers); step = Number.isInteger(saved?.step) ? Math.max(0, Math.min(questions.length, saved.step)) : 0; } catch {}
  const requested = new URLSearchParams(location.search).get("offer");
  if (offers[requested] && requested !== answers.intent) {answers.intent = requested; delete answers.budget; step = 0;}
  const firstMissing = () => questions.findIndex(q => !answers[q.id]);
  if (firstMissing() >= 0 && step > firstMissing()) step = firstMissing();
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const save = () => {try {sessionStorage.setItem(STORAGE,JSON.stringify({answers,step}));} catch {}};
  function focusHeading() {
    const heading = host.querySelector("h2");
    heading?.setAttribute("tabindex","-1");
    heading?.focus({preventScroll:true});
    host.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",block:"start"});
  }
  function render(focus = false) {
    save();
    if (step >= questions.length) {renderResult(focus); return;}
    const q = questions[step];
    const title = q.title;
    host.innerHTML = `<div class="quiz-progress"><span>QUESTION ${step+1} OF ${questions.length}</span><span>${Math.round(step/questions.length*100)}% complete</span></div><div class="progress-track" aria-hidden="true"><span style="width:${step/questions.length*100}%"></span></div><form id="question-form" novalidate><fieldset><legend><h2>${esc(title)}</h2></legend><p class="quiz-help" id="question-help">${esc(q.help)}</p><div class="options">${q.options.map(o=>`<label class="option"><input type="radio" name="${q.id}" value="${o[0]}" ${answers[q.id]===o[0]?"checked":""} aria-describedby="question-help"><span>${esc(o[1])}${o[2]?`<small>${esc(o[2])}</small>`:""}</span></label>`).join("")}</div></fieldset><p class="error" id="quiz-error" role="alert"></p><div class="quiz-actions"><button class="link-button" type="button" id="back" ${step===0?"disabled":""}>← Back</button><button class="button" type="submit">${step===questions.length-1?"See my recommendation":"Continue"} →</button></div></form>`;
    host.querySelector("form").addEventListener("submit", event => {
      event.preventDefault();
      const selected = host.querySelector("input:checked");
      if (!selected) {host.querySelector("#quiz-error").textContent = "Choose an answer to continue."; host.querySelector("input")?.focus(); return;}
      answers = updateAnswer(answers, q.id, selected.value);
      step += 1;
      render(true);
    });
    host.querySelector("#back").addEventListener("click", () => {if(step>0){step-=1;render(true);}});
    if (focus) focusHeading();
  }
  function renderResult(focus) {
    const missing = firstMissing();
    if (missing >= 0) {step = missing; render(focus); return;}
    const r = evaluate(answers);
    host.innerHTML = `<p class="mono">YOUR FIT CHECK IS COMPLETE</p><span class="result-tag">${esc(r.status)}</span><h2>${esc(r.offer.name)}</h2><p class="quiz-help">${esc(r.offer.why)}</p>${r.notices.length?`<div class="result-notice"><strong>Before committing</strong><ul class="result-reasons">${r.notices.map(n=>`<li>${esc(n)}</li>`).join("")}</ul></div>`:`<p class="quiz-help">Your answers suggest an active project with an owner, approved examples and a route to budget. The next step is a scope discussion; this is not an automatic acceptance or booking.</p>`}<a class="text-link" href="${r.offer.path}">Review the engagement ↗</a><div class="brief"><h3>Your project brief</h3><dl>${questions.map(q=>`<dt>${esc(q.title)}</dt><dd>${esc(label(q.id,answers[q.id]))}</dd>`).join("")}</dl><div class="brief-actions"><button type="button" class="link-button" id="copy">Copy brief</button><button type="button" class="link-button" id="download">Download brief</button><button type="button" class="link-button" id="edit">Edit answers</button></div></div><section class="share-box"><h3>Build AI your team can own.</h3><p>Email our team your project brief to discuss the next step.</p><a class="button primary-email" id="email-draft" title="Opens a draft in your email app" href="mailto:imosnoi@smartaitomation.com">Email us about this AI project ↗</a><p><a class="text-link" href="https://www.linkedin.com/in/ionmosnoi/" target="_blank" rel="noopener noreferrer">Connect on LinkedIn</a></p><p class="fine">Prefer the contact form? It uses Romanian field labels: “Numele” = name, “Adresa de email” = email, “Subiect” = subject, “Mesaj” = message. Your brief is in English.</p><label class="consent"><input type="checkbox" id="share-consent"><span>I want to share these non-confidential answers with SmartAItomation through Google Forms. Google receives the brief when the form opens; I still need to submit it there.</span></label><a class="text-link form-link" href="https://docs.google.com/forms/d/e/1FAIpQLSecnK6s4_qz5O3iUyD67HQ13itEEOFldQw5bR7zOBPWcZv3RA/viewform?hl=en" target="_blank" rel="noopener noreferrer" id="share">Use the contact form ↗</a><p class="live-status" id="share-status" role="status" aria-live="polite"></p><p class="fine">You send the inquiry yourself. <a href="privacy.html">Privacy details</a>.</p></section><button type="button" class="link-button" id="reset">Start again · clear my answers</button>`;
    const status = text => host.querySelector("#share-status").textContent = text;
    host.querySelector("#copy").addEventListener("click", async () => {
      try {await navigator.clipboard.writeText(brief(answers)); status("Brief copied. It has not been sent.");} catch {status("Clipboard access is unavailable. Use Download brief, or select and copy the visible answers.");}
    });
    host.querySelector("#download").addEventListener("click", () => {
      const blob = new Blob([brief(answers)], {type:"text/plain;charset=utf-8"});
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = "production-ai-project-brief.txt"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000); status("Brief download prepared. It has not been sent.");
    });
    host.querySelector("#edit").addEventListener("click",()=>{step=0;render(true);});
    host.querySelector("#reset").addEventListener("click",()=>{answers={};step=0;try{sessionStorage.removeItem(STORAGE);}catch{}render(true);});
    host.querySelector("#share").addEventListener("click",event=>{
      event.preventDefault();
      if (!host.querySelector("#share-consent").checked) {status("Please acknowledge how your brief will be shared before continuing."); host.querySelector("#share-consent").focus(); return;}
      const link = document.createElement("a"); link.href = formUrl(answers); link.target = "_blank"; link.rel = "noopener noreferrer"; document.body.appendChild(link); link.click(); link.remove();
      status("Contact form opened in a new tab. Your inquiry is not sent until you submit that form.");
    });
    host.querySelector("#email-draft").href = "mailto:imosnoi@smartaitomation.com?subject=" + encodeURIComponent("Production AI inquiry — " + r.offer.name) + "&body=" + encodeURIComponent(brief(answers));
    if (focus) focusHeading();
  }
  render();
})();
