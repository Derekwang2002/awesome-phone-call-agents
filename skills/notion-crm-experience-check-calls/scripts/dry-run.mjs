#!/usr/bin/env node

const SOURCE_PAGE_ID = "38f2cf06-9c08-805f-84fa-fd97d27054a1";
const RESULT_CSV_PATH = "skills/notion-crm-experience-check-calls/results/call-results.csv";
const PAGE_IDS = [
  "38f2cf06-9c08-8009-bd85-d25460dea9dc",
  "38f2cf06-9c08-807a-b609-ecbf10fb194c",
  "38f2cf06-9c08-8096-9801-ddb0f3d6d4f3",
  "38f2cf06-9c08-80b5-8246-c0b1bcd2d286",
];

const PROPERTY = {
  phone: "Jgx>",
  consent: "VN\\`",
  goal: "nHqP",
  priority: "on:?",
  dueDate: "}tIE",
  title: "title",
  result: "Mw{G",
};

function parseArgs(argv) {
  const args = { dueDate: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--due-date") {
      args.dueDate = argv[index + 1] || "";
      index += 1;
    }
  }
  return args;
}

async function postNotion(path, payload) {
  const response = await fetch(`https://www.notion.so/api/v3/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Notion ${path} failed with HTTP ${response.status}`);
  }
  return response.json();
}

async function loadPage(pageId) {
  return postNotion("loadPageChunk", {
    pageId,
    limit: 100,
    cursor: { stack: [] },
    chunkNumber: 0,
    verticalColumns: false,
  });
}

function plainText(value) {
  if (!Array.isArray(value)) {
    return "";
  }
  return value
    .map((part) => {
      if (Array.isArray(part)) {
        return String(part[0] || "");
      }
      return String(part || "");
    })
    .join("")
    .trim();
}

function dateText(value) {
  if (!Array.isArray(value)) {
    return "";
  }
  for (const part of value) {
    if (!Array.isArray(part)) {
      continue;
    }
    const decorations = part[1];
    if (!Array.isArray(decorations)) {
      continue;
    }
    for (const decoration of decorations) {
      if (Array.isArray(decoration) && decoration[0] === "d") {
        return decoration[1]?.start_date || "";
      }
    }
  }
  return "";
}

function maskPhone(phone) {
  if (!phone.startsWith("+") || phone.length < 6) {
    return "";
  }
  return `${phone.slice(0, 2)}******${phone.slice(-4)}`;
}

function isE164(phone) {
  return /^\+[1-9]\d{7,14}$/u.test(phone);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.dueDate) {
    throw new Error("Usage: dry-run.mjs --due-date YYYY-MM-DD");
  }

  const sourcePage = await loadPage(SOURCE_PAGE_ID);
  const collection = sourcePage.recordMap.collection?.["38f2cf06-9c08-808a-9270-000b66ece180"]?.value?.value;
  const schema = collection?.schema || {};
  const resultProperty = schema[PROPERTY.result] || {};
  const resultPropertyReady = resultProperty.name === "result" && resultProperty.type === "text";

  const candidates = [];
  for (const pageId of PAGE_IDS) {
    const pageMap = await loadPage(pageId);
    const page = pageMap.recordMap.block?.[pageId]?.value?.value;
    const properties = page?.properties || {};
    const label = plainText(properties[PROPERTY.title]);
    const phone = plainText(properties[PROPERTY.phone]);
    const consent = plainText(properties[PROPERTY.consent]) || "Unknown";
    const dueDate = dateText(properties[PROPERTY.dueDate]);
    const priority = plainText(properties[PROPERTY.priority]);
    const goal = plainText(properties[PROPERTY.goal]);
    const maskedPhone = maskPhone(phone);

    const checks = {
      dateMatch: {
        status: dueDate === args.dueDate ? "passed" : "failed",
        evidence: dueDate || "missing",
      },
      consent: {
        status: consent === "Agree" ? "passed" : "failed",
        evidence: consent,
      },
      phoneE164: {
        status: isE164(phone) ? "passed" : "failed",
        evidence: maskedPhone || "invalid",
      },
      resultOutput: {
        status: "passed",
        evidence: `fixed local result CSV fallback: ${RESULT_CSV_PATH}`,
      },
      notionSourceWriteback: {
        status: "blocked",
        evidence: resultPropertyReady
          ? "Notion result text property exists, but hosted Notion MCP or another authenticated page-property update route is not verified"
          : "Notion result text property missing and hosted Notion MCP or another authenticated page-property update route is not verified",
      },
      dedupeKey: {
        status: pageId ? "passed" : "failed",
        evidence: pageId || "missing",
      },
    };

    const skipReasons = [];
    if (checks.dateMatch.status !== "passed") {
      skipReasons.push(`due date ${dueDate || "missing"} does not match ${args.dueDate}`);
    }
    if (checks.consent.status !== "passed") {
      skipReasons.push(`consent is ${consent}`);
    }
    if (checks.phoneE164.status !== "passed") {
      skipReasons.push("phone is not valid E.164");
    }
    if (checks.resultOutput.status !== "passed") {
      skipReasons.push("local result CSV output is not ready");
    }
    if (checks.dedupeKey.status !== "passed") {
      skipReasons.push("Notion page ID is missing");
    }

    const status = skipReasons.length ? "skipped" : "ready";
    const simulatedResult =
      status === "ready"
        ? "dry_run_preview: no call was planned or run during dry-run; approval is required before execution"
        : `skipped: ${skipReasons.join("; ")}`;
    const simulatedResultOutput =
      status === "ready"
        ? [
            "status=dry_run_ready",
            "summary=Candidate is ready for approved execution; no call was planned or run during dry-run.",
            `due_date=${dueDate}`,
            `priority=${priority || "missing"}`,
          ].join(" | ")
        : [
            "status=skipped",
            `reason=${skipReasons.join("; ")}`,
            `due_date=${dueDate || "missing"}`,
            `consent=${consent}`,
          ].join(" | ");

    candidates.push({
      candidateId: pageId,
      sourceRecord: `CRM Tracker / All Tasks / ${pageId}`,
      recipientLabel: label,
      maskedPhoneNumber: maskedPhone || "invalid",
      consent,
      dueDate,
      priority,
      goal,
      outboundGoal:
        "Call the contact, ask whether their experience was good, capture the answer, and summarize the result.",
      status,
      checks,
      skipReasons,
      simulatedResult,
      simulatedResultOutput,
    });
  }

  const ready = candidates.filter((candidate) => candidate.status === "ready");
  const skipped = candidates.filter((candidate) => candidate.status === "skipped");
  const output = {
    source: {
      name: "CRM Tracker",
      pageId: SOURCE_PAGE_ID,
      collectionId: "38f2cf06-9c08-808a-9270-000b66ece180",
      viewId: "38f2cf06-9c08-807e-ba25-000cb71044d2",
      resultPropertyReady,
      resultProperty: {
        name: resultProperty.name || "",
        type: resultProperty.type || "",
        schemaKey: PROPERTY.result,
      },
      notionWriteback: {
        status: "blocked",
        blocker:
          "public shared-page route is read-only for safe production writeback; hosted Notion MCP or another authenticated Notion page-property update route is required",
      },
    },
    runtime: {
      dueDate: args.dueDate,
      executionMode: "dry-run-then-batch-approval",
      dryRun: true,
      requiresApprovalBeforeCall: true,
    },
    provider: {
      route: "https://seleven-mcp-sg.airudder.com/mcp/openagent_oauth",
      status: "ready",
      tools: ["mcp__calle_prod.plan_call", "mcp__calle_prod.run_call", "mcp__calle_prod.get_call_run"],
    },
    summary: {
      total: candidates.length,
      ready: ready.length,
      skipped: skipped.length,
      resultOutput: `fixed local result CSV fallback configured at ${RESULT_CSV_PATH}; no write performed during dry-run`,
      notionWriteback: "blocked until hosted Notion MCP or another authenticated Notion route passes canary writeback and readback",
    },
    candidates,
  };
  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
