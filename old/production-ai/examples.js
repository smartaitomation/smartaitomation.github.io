(() => {
  const examples = {
    knowledge: ["Can the answer be traced back to the right source?", "Real questions, expected sources, unanswerable questions and access boundaries.", "Missing context, outdated documents, wrong chunks and unsupported answers.", "Compare parsing, chunking, retrieval and reranking before changing the model.", "Retrieval recall · Citation support · Answer quality · Cost · Latency"],
    agent: ["Can the workflow finish the task within its boundaries?", "Representative tasks, expected tool calls, denied actions, timeouts and partial failures.", "Wrong tools, repeated actions, lost state, excessive steps and missing human approval.", "Compare tool definitions, state handling, retry policies and stopping conditions.", "Task completion · Tool correctness · Approval compliance · Cost · Latency"],
    extraction: ["Can the output be trusted enough for the next step?", "Representative documents, reviewed fields, unusual formats and intentionally missing information.", "Wrong values, invented fields, broken schemas and errors concentrated in one document type.", "Compare parsing, examples, validation and models; route uncertain outputs for human review.", "Field precision / recall · Schema validity · Review rate · Cost · Latency"]
  };
  document.querySelectorAll("[data-example]").forEach(button => {
    button.addEventListener("click", () => {
      const data = examples[button.dataset.example];
      if (!data) return;
      document.querySelectorAll("[data-example]").forEach(item => {
        const selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      const panel = document.getElementById("example-body");
      panel.querySelector("h3").textContent = data[0];
      panel.querySelectorAll(".example-columns p").forEach((item, i) => item.textContent = data[i + 1]);
      panel.querySelector(".metric-strip").textContent = data[4];
    });
  });
})();
