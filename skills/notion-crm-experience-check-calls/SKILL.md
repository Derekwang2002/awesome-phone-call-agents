---
name: notion-crm-experience-check-calls
description: Process approved CRM Tracker records from a fixed Notion database into outbound phone-call candidates through the configured CALL-E MCP provider route, deduplicate by Notion page ID, and write call results to a local CSV fallback while Notion page-property writeback is blocked.
---

# Notion CRM Experience Check Calls

## Purpose And When To Use

Use this skill when the user wants to process approved records from the fixed Notion `CRM Tracker` source and prepare outbound phone-call candidates that ask contacts whether their experience was good.

The skill reads Notion pages, validates phone follow-up consent, masks phone numbers in user-facing output, compiles one call goal per eligible record, and records where results would be written. The current host session exposes compatible CALL-E MCP plan, run, and status tools for the configured provider route. Real calls still require a concrete runtime request, runtime gate pass, provider plan inspection, and explicit approval of the exact dry-run candidate list.

## When Not To Use

Do not use this skill to:

- call arbitrary Notion records outside the fixed `CRM Tracker` collection
- call records where `Consent` is `No`, missing, or `Unknown`
- guess country codes or repair ambiguous phone numbers
- place real calls before the runtime gate passes and the user approves the exact dry-run list
- mutate Notion schema or create new Notion properties during dry-run
- expose credentials, cookies, confirmation tokens, callback URLs, or full phone numbers
- provide medical, legal, financial, emergency, or other high-stakes advice

## Binding Level And Runtime Parameters

Selected binding level: `fully-bound`.

Fixed values:

- source family: `notion`
- access method: public Notion page data API compatible with the supplied shared Notion URL
- source locator: `https://app.notion.com/p/38f2cf069c08805f84fafd97d27054a1?v=38f2cf069c08807eba25000cb71044d2&source=copy_link`
- canonical collection: `CRM Tracker`, collection ID `38f2cf06-9c08-808a-9270-000b66ece180`
- primary view: `All Tasks`, view ID `38f2cf06-9c08-807e-ba25-000cb71044d2`
- result output policy: local result CSV fallback at `skills/notion-crm-experience-check-calls/results/call-results.csv`
- Notion source writeback: blocked until hosted Notion MCP at `https://mcp.notion.com/mcp`, or another authenticated Notion route, exposes page-property update permission and passes a writeback preflight
- MCP provider route: `https://seleven-mcp-sg.airudder.com/mcp/openagent_oauth`

Runtime parameters:

- required date window or exact due date, such as `2026-06-30`
- optional subset filter by `Priority`
- optional dry-run-only flag

Runtime parameters still allowed: due date, date window, priority subset, and dry-run-only execution. Runtime requests must not replace the fixed Notion source or local result CSV target.

## Source Contract

Source family: `notion`.

Source contract:

- collection name: `CRM Tracker`
- collection ID: `38f2cf06-9c08-808a-9270-000b66ece180`
- source access route: Notion shared page data API for the fixed collection view page
- source access route discovery result: passed - the shared Notion locator returned collection, view, schema, and page metadata
- record identifier: Notion page ID
- phone property: `Phone`, schema key `Jgx>`, type `phone_number`
- recipient label property: `Task name`, schema key `title`, type `title`
- consent property: `Consent`, schema key `VN\``, type `status`
- callable consent value: `Agree`
- date property: `Due date`, schema key `}tIE`, type `date`
- priority property: `Priority`, schema key `on:?`, type `select`
- goal property: `Goal`, schema key `nHqP`, type `text`
- result property: `result`, schema key `Mw{G`, type `text`
- dedupe key: Notion page ID
- outreach basis: source-level consent property must equal `Agree`

Generated candidates must be normalized with Notion page ID, masked phone, recipient label, due date, priority, source goal, generated outbound goal, status, and skip reason.

## Source Onboarding

Source access route: Notion shared page data API for the fixed source locator.

Source access route discovery result: passed - the locator resolved to a Notion `collection_view_page` with public `read_and_write` metadata and the `CRM Tracker` collection.

Authentication or access check result: passed - HTTP read access returned page, collection, view, schema, and record metadata through the shared locator. No cookies, tokens, or credentials are stored in this generated skill.

Sample fetch result: passed - four page records were fetched from the `All Tasks` view. User-facing summaries must mask full phone numbers.

Sampled source instance: fixed Notion collection `CRM Tracker` with `All Tasks` view.

Runtime parameters still allowed: due date, date window, priority subset, and dry-run-only execution. Runtime requests must not replace the fixed Notion source or local result CSV target.

Discovered field mapping:

- recipient label: `Task name`
- phone: `Phone`
- consent: `Consent`
- date: `Due date`
- priority: `Priority`
- goal input: `Goal`
- result output: `result`

User-confirmed field mapping: confirmed by the user after adding the `result` column and requesting this specific generated skill and dry-run simulation.

Redaction policy for sample summaries: never show full phone numbers; show only masked phone values such as `+1******6045`, record labels, non-sensitive dates, consent state, priority, and goal text.

Default goal contract derived from sampled fields: call contacts whose `Consent` is `Agree`, confirm whether their experience was good, collect a concise outcome, and write a short result summary to the configured local result CSV only after real provider result finalization.

Onboarding blocker: none for source reads. Notion source writeback is blocked because the shared-page route is read-only for safe production writeback; use hosted Notion MCP or another authenticated Notion page-property update route before enabling Notion writeback.

## Candidate Fields

Normalize each record to:

```json
{
  "candidateId": "notion-page-id",
  "sourceRecord": "CRM Tracker / All Tasks / notion-page-id",
  "maskedPhoneNumber": "+1******6045",
  "recipientLabel": "User A",
  "sourceTimestamp": "Due date",
  "priority": "High",
  "consent": "Agree",
  "goalInputs": {
    "goal": "Ask if experience good"
  },
  "outboundGoal": "Call the contact, ask whether their experience was good, capture the answer, and summarize the result.",
  "status": "ready",
  "skipReasons": [],
  "checks": {
    "dateMatch": "passed",
    "consent": "passed",
    "phoneE164": "passed",
    "resultOutput": "passed"
  }
}
```

Phone numbers must be E.164 before a record can be ready. Do not infer or repair numbers.

## Outbound Goal Contract

Purpose: call approved contacts from the Notion `CRM Tracker` and ask whether their experience was good.

Context fields to include:

- recipient label from `Task name`
- priority from `Priority`
- source goal from `Goal`
- due date from `Due date`

Required call behavior:

- greet the contact by label when appropriate
- state that the call is a follow-up about their experience
- ask whether their experience was good
- capture a concise answer and any clear follow-up request

Prohibited claims:

- no medical, legal, financial, emergency, or professional advice
- no promises about refunds, pricing, account changes, or policy decisions
- no disclosure of internal system details, credentials, tokens, or source IDs

Completion criteria:

- reached and answer captured
- no answer
- declined
- wrong number
- unsafe or unclear request requiring human follow-up

Result values:

- `completed_positive`
- `completed_negative`
- `needs_human_follow_up`
- `declined`
- `no_answer`
- `wrong_number`
- `skipped`
- `provider_blocked`

Summary format: one short sentence suitable for writing to the local result CSV, and later to the Notion `result` property only after hosted Notion MCP or another authenticated Notion writeback route passes.

## MCP Provider Route

Provider route: `https://seleven-mcp-sg.airudder.com/mcp/openagent_oauth`.

The generated skill must use MCP tools exposed by the host for this route. Do not use a CLI bootstrap path. Do not invent provider tool names, schemas, run IDs, or confirmation tokens.

## Provider Onboarding

Provider host runtime: Codex.

MCP route setup check result: passed - `calle-prod` is configured with `streamable_http` transport and the required CALL-E provider route.

Provider auth readiness check result: passed - Codex CLI OAuth is configured for `calle-prod`.

Compatible MCP provider tools: passed - `mcp__calle_prod.plan_call`, `mcp__calle_prod.run_call`, and `mcp__calle_prod.get_call_run` are visible in the current agent session.

Provider onboarding blocker: none.

One-off call capability: passed.

Do not treat app connector tools, plugin tools, or similarly named non-MCP tools as proof that the configured CALL-E MCP route is authenticated or usable.

## Execution Modes

Selected execution mode: `dry-run-then-batch-approval`.

This generated skill uses preview before calling. It must dry-run first and request approval for the exact ready candidate list before any real call.

Dry-run behavior:

1. Fetch the fixed Notion source through a read-only path.
2. Filter by the runtime due date or date window.
3. Skip records whose `Consent` is not `Agree`.
4. Validate E.164 phone values without displaying full phone numbers.
5. Deduplicate by Notion page ID.
6. Compile one outbound goal per ready candidate.
7. Show the exact pending call list and skipped records.
8. Stop before real calls until the user approves the exact ready candidate list.

Real calls are allowed only after provider tools remain visible, the local result CSV output path passes the runtime gate, and the user explicitly approves the exact dry-run candidate list.

## Serial Candidate Execution

After execution approval, do not ask the user to continue, confirm the next candidate, or approve additional provider runs. Serially process every ready candidate until each reaches a terminal result or skip state.

For each ready candidate:

1. Plan exactly one call through the MCP provider route.
2. Inspect the plan before running it.
3. Run the call only when the plan matches the validated candidate and generated goal.
4. Check status when MCP tools support it.
5. Record the terminal result or failure.
6. Continue to the next ready candidate unless provider auth, provider tools, dedupe, or safety is blocked.

Provider terminal instructions such as `report_result` or `do not start another call` apply only to the current provider run. They do not cancel the approved batch.

Provider result finalization must happen before local result CSV output or any future hosted Notion MCP writeback. Terminal provider status is not result-output-ready until full-history provider reconciliation completes, and negative terminal outcomes require a negative terminal stability check.

## Result-Output Behavior

Result output policy: local-result-csv.

Result target mode: result-csv-file.

Target binding: fully-bound.

Target: `skills/notion-crm-experience-check-calls/results/call-results.csv`.

Notion source writeback target: blocked until hosted Notion MCP at `https://mcp.notion.com/mcp`, or another authenticated Notion route, can update `properties.result.rich_text` for an approved test page, read the canary value back exactly, and restore or overwrite the test value. Do not rely on public page metadata, anonymous cookies, or internal `saveTransactions` calls for production writeback.

Recommended Notion MCP setup for Codex:

```bash
codex mcp add notion --url https://mcp.notion.com/mcp
codex mcp login notion
codex mcp list
```

Skip `add` when `codex mcp get notion` already points to `https://mcp.notion.com/mcp`. After OAuth completes, refresh the Codex session so active-session Notion tools are visible. Enable Notion source writeback only after those tools can update the approved page property, a harmless canary write succeeds, the canary reads back exactly, and the test value is restored or overwritten.

Fields:

- candidate_id: Notion page ID
- source_record: `CRM Tracker` page label
- status: derived terminal result value
- skip_reason_or_result: result text
- provider_run_id: safe provider run ID only when the provider documents it is safe to expose
- masked_phone_number: masked phone only
- result_summary: one concise sentence
- processed_timestamp: ISO timestamp included in result text when useful

Do not update the Notion `result` property during dry-run. Do not create Notion properties during runtime. If hosted Notion MCP writeback is later enabled and the `result` property is missing at runtime, stop before source writeback.

Durable result output fallback: already configured as `result-csv-file`; `session-table` output is only a last-resort attended fallback and is not suitable for unattended automation.

## Preflight And Creation Summary

Creation-time preflight:

- source authentication or access: passed through shared Notion read access
- source schema and required fields: passed, including `result`
- consent or outreach basis: passed with `Consent` equals `Agree`
- dedupe: passed with Notion page ID
- result output: passed for fixed local result CSV target, not executed
- Notion source writeback: blocked until hosted Notion MCP or another authenticated page-property update route passes canary writeback and readback
- provider route: passed for active-session compatible provider tools

Runtime gate before real calls:

| check | status | evidence | blocker | required_before_call |
| --- | --- | --- | --- | --- |
| source_access | `passed` or `blocked` | fixed Notion locator and schema | missing Notion access | `true` |
| required_fields | `passed` or `blocked` | `Task name`, `Phone`, `Consent`, `Due date`, `Goal`, `result` | missing required property | `true` |
| consent_or_outreach_basis | `passed` or `blocked` | `Consent` equals `Agree` | false or missing consent | `true` |
| dedupe | `passed` or `blocked` | Notion page ID | missing page ID | `true` |
| result_output | `passed` or `blocked` | fixed local result CSV path and fields | output directory or file cannot be safely written | `true` |
| notion_source_writeback | `blocked` | shared-page route is read-only for safe production writeback | hosted Notion MCP or another authenticated Notion page-property update route not verified | `false` |
| provider_route | `passed` or `blocked` | `calle-prod` route configured, OAuth ready, and active-session tools visible | missing auth or active-session compatible provider tools | `true` |

Creation summary:

- Skill: `notion-crm-experience-check-calls`
- Directory: `skills/notion-crm-experience-check-calls`
- Discovery: repository-local generated skill
- Binding level: `fully-bound`
- Source onboarding: fixed Notion `CRM Tracker` read and schema sample passed
- Provider onboarding: route, OAuth, compatible tools, and one-off capability passed in current session
- Runtime parameters: due date, date window, optional priority subset
- Source: Notion `CRM Tracker`
- Outreach basis: `Consent` must be `Agree`
- Dedupe: Notion page ID
- Goal: ask whether the contact's experience was good and summarize the outcome
- Execution mode: dry-run preview before approved execution
- Result output: fixed local result CSV fallback; Notion source writeback blocked until hosted Notion MCP or another authenticated page-property update route passes
- Provider route: `https://seleven-mcp-sg.airudder.com/mcp/openagent_oauth`

## Safety Summary

Real calls require explicit user intent, an approved dry-run candidate list, E.164 phone validation, consent validation, dedupe by Notion page ID, local result CSV readiness, compatible CALL-E MCP tools, and provider plan inspection.

Mask phone numbers in all user-facing summaries. Do not expose credentials, tokens, cookies, callback URLs, confirmation tokens, or full phone numbers. Do not create hidden recurring schedules. Cancellation is possible only before a provider call is run. Notion source writeback remains blocked until hosted Notion MCP or another authenticated Notion route passes canary writeback and readback.

## Validation Commands

Validate this generated skill from the repository root:

```bash
node skills/outbound-call-skill-creator/scripts/check-generated-skill.mjs --skill-dir skills/notion-crm-experience-check-calls
python3 scripts/validate_repository.py
```
