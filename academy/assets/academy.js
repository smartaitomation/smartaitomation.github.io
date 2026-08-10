(function () {
  "use strict";

  const page = document.body.dataset.page || "academy";
  const params = new URLSearchParams(window.location.search);
  const allowedVariant = params.get("variant") === "direct" ? "direct" : "control";
  const measurementId = "G-TV98TNCDYE";

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });

  const analyticsScript = document.createElement("script");
  analyticsScript.async = true;
  analyticsScript.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
  document.head.appendChild(analyticsScript);

  function emit(eventName, detail) {
    const payload = Object.assign(
      {
        event: "academy_event",
        academy_event: eventName,
        academy_page: page,
        experiment_variant: allowedVariant,
      },
      detail || {}
    );

    window.dataLayer.push(payload);
    const eventParameters = {};
    Object.keys(payload).forEach(function (key) {
      if (key !== "event" && ["string", "number", "boolean"].includes(typeof payload[key])) {
        eventParameters[key] = payload[key];
      }
    });
    window.gtag("event", eventName, eventParameters);
    window.dispatchEvent(new CustomEvent("smartaitomation:analytics", { detail: payload }));
  }

  function preserveCampaign() {
    const campaign = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (key) {
      if (params.get(key)) campaign[key] = params.get(key);
    });

    if (Object.keys(campaign).length) {
      try {
        sessionStorage.setItem("smartaitomation_academy_campaign", JSON.stringify(campaign));
      } catch (_) {
        // Analytics should never block the page.
      }
    }
    return campaign;
  }

  if (allowedVariant === "direct") {
    document.querySelectorAll("[data-direct-label]").forEach(function (element) {
      element.textContent = element.dataset.directLabel;
    });
  }

  const campaign = preserveCampaign();
  emit("page_view", { campaign: campaign });

  document.querySelectorAll("[data-track-event]").forEach(function (element) {
    element.addEventListener("click", function () {
      emit(element.dataset.trackEvent, {
        label: element.dataset.trackLabel || element.textContent.trim(),
        location: element.dataset.trackLocation || "unknown",
        destination: element.getAttribute("href") || "",
      });
    });
  });

  document.querySelectorAll("details").forEach(function (detail) {
    detail.addEventListener("toggle", function () {
      if (detail.open) {
        const summary = detail.querySelector("summary");
        emit("faq_open", { label: summary ? summary.textContent.trim() : "faq" });
      }
    });
  });

  const reached = new Set();
  function checkDepth() {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    if (available <= 0) return;
    const depth = Math.round((window.scrollY / available) * 100);
    [50, 90].forEach(function (threshold) {
      if (depth >= threshold && !reached.has(threshold)) {
        reached.add(threshold);
        emit("scroll_depth", { percent: threshold });
      }
    });
  }

  window.addEventListener("scroll", checkDepth, { passive: true });
})();
