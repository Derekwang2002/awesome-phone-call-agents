# Safety

Use this reference with `notion-crm-experience-check-calls`.

## Call Safety

- Require explicit user intent before processing records for calls.
- Require a dry-run preview and approval of the exact ready candidate list before real calls.
- Place no real calls during source reads, source preflight, dry-run, or report generation.
- Process only records from the fixed Notion `CRM Tracker` source.
- Require `Consent` to equal `Agree` before a candidate can be ready.
- Require E.164 phone numbers; do not infer country codes or repair ambiguous numbers.
- Deduplicate by Notion page ID.
- Mask phone numbers in all user-facing summaries.

## Result Output Safety

- During dry-run, do not write to Notion.
- Notion source writeback is blocked until hosted Notion MCP at `https://mcp.notion.com/mcp`, or another authenticated Notion route, can update the existing Notion `result` text property, read a canary value back exactly, and restore or overwrite the test value.
- Use the fixed local result CSV as durable output while Notion source writeback is blocked.
- Do not create or modify Notion schema during runtime.
- Do not write credentials, tokens, cookies, callback URLs, confirmation tokens, or full phone numbers to Notion results or user-facing reports.
- Do not rely on public shared-page metadata, anonymous cookies, or internal `saveTransactions` calls for production writeback.
- Use a session table only as an attended last-resort fallback.

## Sensitive Boundaries

The call goal is limited to checking whether the contact's experience was good and summarizing the answer. Do not provide medical, legal, financial, emergency, or professional advice.
