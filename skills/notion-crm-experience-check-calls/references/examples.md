# Examples

Use fictional reserved phone numbers in examples.

## Concrete Dry-Run Request

User request:

```text
Use notion-crm-experience-check-calls to dry-run records due on 2026-06-30.
```

Expected behavior:

- read the fixed Notion `CRM Tracker` source
- filter records whose `Due date` is `2026-06-30`
- mark records with `Consent` equal to `Agree` as ready when the phone value is valid E.164
- skip records with `Consent` equal to `No`, missing, or `Unknown`
- show masked phone numbers only
- stop before real calls until the user approves the exact ready candidate list
- do not write to the Notion `result` property during dry-run
- report that Notion source writeback is blocked until hosted Notion MCP or another authenticated page-property update route passes
- use the fixed local result CSV as the durable result-output target after approved execution

Example dry-run summary:

```text
Ready candidates: 2
Skipped records: 2
Provider status: ready; compatible CALL-E MCP tools are visible in the active session.
Result output: fixed local CSV fallback; Notion source writeback is blocked until hosted Notion MCP or another authenticated Notion route passes canary writeback and readback.
```

## Insufficient Request

User request:

```text
Run the campaign.
```

Expected behavior:

Ask for the missing runtime due date or date window. Do not infer a broad processing scope.

## Future Approved Execution

Real calls require a dry-run first, approval of the exact pending call list, provider plan inspection, provider result finalization, and local result CSV readiness before execution. Notion source writeback stays blocked until hosted Notion MCP at `https://mcp.notion.com/mcp`, or another authenticated Notion route, passes canary writeback and readback.
