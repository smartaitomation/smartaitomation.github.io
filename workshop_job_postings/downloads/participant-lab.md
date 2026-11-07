# Job Posting Evals — participant lab

**Input:** a hiring manager’s job requirements. **Output:** a public job posting.

The posting should preserve the facts, required/optional distinction, working arrangements and application details. Attractive wording is useful only when the facts remain correct.

## 1. Explore and build the viewer — 15 min

Download the CSV and JSON. Each row has an ID, title, company, requirements and posting. Version, hash, family and split fields support reproducibility. The examples are fictional, controlled practice cases; no labels are expert-validated yet.

Use the viewer-builder prompt in Codex or Claude. Ask for Flask + HTML, a searchable list, counted filters, sorting and three columns: requirements | posting | review. Check that multiline CSV stays in a single cell and source text is escaped.

**Result:** open any example without switching tools. Good/Bad + notes, Skip and Save & next work. Previous notes have just Nr and Text.

## 2. Review examples — 25 min

Choose a hiring manager or recruiter to own the criteria. Review a varied batch across departments and conditions. Record the specific mismatch and correction.

- Weak: “Wrong. Bad wording.”
- Useful: “Keep Docker optional. The input says nice to have; the posting makes it required.”
- Useful: “Restore two office days. Work from anywhere contradicts the hybrid condition.”
- Useful pass note: “The draft keeps the hours, hybrid condition and optional skill unchanged.”

Continue in small batches while new error types or nuances appear. Check random leftovers before pausing. A quiet batch does not prove complete coverage. Treat disagreements as a reason to clarify criteria, not automatically as reviewer mistakes.

**Result:** saved human reviews tied to exact posting hashes. Export them.

## 3. Create an error taxonomy — 15 min

Feed only your notes into the taxonomy prompt. Group by the correction needed. For every error, write a definition, inclusion/exclusion boundary, source IDs and examples. Human-review proposed groups.

Add the types in the workspace and label whether each particular error occurs. An overall Bad label is not evidence that all error types occur. Pass means the selected error is absent; it does not prove the whole posting is good.

**Result:** per-error human labels, not a vague helpfulness score.

## 4. Calibrate one judge — 25 min

Pick one error. Give the judge its rule, the requirements and posting. Use expert-reviewed train examples: clear failure, clear pass, near miss and different wording. Hide the current example’s human verdict and notes.

Return `{"status":"pass|fail","reason":"source and output evidence"}`. Do not use a generic 1–5 quality score. Use code checks for objective facts when reliable; semantic interpretation needs a judge or human.

Run in your own model environment with an explicit budget. This workspace does not make model calls. The eval-script prompt helps build a cached runner. Import actual results into the Judge tab, with sample ID, output hash, error ID and judge version.

Failure is positive:

- TP: both human and judge find the error.
- FP: judge flags an error the human says is absent.
- FN: judge misses a human-labelled error.
- TN: both say the selected error is absent.

Agreement = (TP + TN) / N. Precision = TP / (TP + FP). Recall = TP / (TP + FN). TNR = TN / (TN + FP). Undefined ratios are `n/a`, not zero or 100%. Missing or invalid results are reported separately.

Inspect dev disagreements and improve the rubric/examples. 90%+ agreement is a teaching target, not a reported result. Ten mostly passing examples can make it misleading: inspect error recall, false alarms and per-category counts.

**Result:** one judge whose limits you can explain. Freeze it before the final test.

## 5. Improve the writer — 20 min

In the prompt playground, keep the input fixed. Edit one instruction, run it in your own model environment, paste the new posting and save a new version. Review again; old labels are not transferred to the new hash.

Try a source-grounding instruction, a verified example, extracting facts before writing, a narrower scope, another model, a router for missing information, or a final checker. Each is a hypothesis, not an automatic improvement.

Compare the same cases with the same frozen judge. Count fixes and regressions by error, and record cost/latency. Do not tune against held-out test cases.

## 6. Extend coverage and recap — 10 min

Generate new **inputs** from feature × job type × scenario. The feature stays “write job postings.” Job types may be engineer, designer or support specialist; scenarios include optional skills, part-time, fixed-term, unknown salary and hybrid work. Produce postings separately and ask the domain expert to label them. Keep related variants in one split.

The supplied dataset uses 25 train, 15 dev and 10 test rows split by job family. These small sets teach workflow, not production reliability. The deliberate error distribution is not a real-world prevalence estimate.

## Deliverables

A viewer, exported human notes, an error taxonomy, per-error labels, a versioned judge, disagreement analysis, and one measured writer comparison. Never fabricate the last result if no model run was performed.

## Reading

- Hamel Husain: [A Field Guide to Rapidly Improving AI Products](https://hamel.dev/blog/posts/field-guide/)
- Hamel Husain: [Using LLM-as-a-Judge](https://hamel.dev/blog/posts/llm-judge/)

Original practice data and job-posting exercises: SmartAItomation. Ten-minute introduction plus the lab timings above = two hours.
