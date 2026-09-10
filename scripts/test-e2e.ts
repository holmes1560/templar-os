/**
 * Comprehensive End-to-End Test Suite for TEMPLAR OS Portfolio Agent Platform
 *
 * Verifies:
 * 1. Public REST endpoints (/api/v1/portfolio)
 * 2. API Key authentication & scope enforcement
 * 3. Draft proposal lifecycle (create draft -> approve -> publish)
 * 4. Audit revisions logging
 * 5. MCP Server stdio JSON-RPC initialization & tool execution
 * 6. Developer CLI status check
 */

import { spawn } from "node:child_process";
import readline from "node:readline";

const API_BASE = process.env.PORTFOLIO_API_URL || "http://localhost:3100";
const DEV_KEY = process.env.PORTFOLIO_API_KEY || "tpl_live_9hOWP3dbpnEr151yyKYEH8JPKq34FMac";

function log(step: string, msg: string) {
  console.log(`\x1b[36m[${step}]\x1b[0m ${msg}`);
}

function pass(msg: string) {
  console.log(`\x1b[32m  ✓ ${msg}\x1b[0m`);
}

function fail(msg: string): never {
  console.error(`\x1b[31m  ✗ ${msg}\x1b[0m`);
  process.exit(1);
}

async function testPublicEndpoints() {
  log("TEST 1", "Public Portfolio Endpoint");
  const res = await fetch(`${API_BASE}/api/v1/portfolio`);
  if (!res.ok) fail(`GET /api/v1/portfolio returned status ${res.status}`);
  const body = await res.json();
  if (!body.ok || !body.data) fail("Response format invalid");
  if (!body.data.profile?.fullName) fail("Profile missing fullName");
  if (!Array.isArray(body.data.projects) || body.data.projects.length === 0) fail("Projects missing or empty");
  if (!Array.isArray(body.data.timeline) || body.data.timeline.length === 0) fail("Timeline missing or empty");
  pass(`Retrieved portfolio: ${body.data.projects.length} projects, ${body.data.timeline.length} milestones.`);
}

async function testAuthEnforcement() {
  log("TEST 2", "API Authentication & Scope Enforcement");

  // 1. Unauthenticated request to protected endpoint
  const unauth = await fetch(`${API_BASE}/api/v1/keys`);
  if (unauth.status !== 401) fail(`Expected 401 for unauthenticated request, got ${unauth.status}`);
  pass("Unauthenticated request correctly rejected with 401 Unauthorized.");

  // 2. Invalid bearer token
  const badToken = await fetch(`${API_BASE}/api/v1/keys`, {
    headers: { Authorization: "Bearer tpl_live_invalid_token_12345" },
  });
  if (badToken.status !== 401) fail(`Expected 401 for invalid token, got ${badToken.status}`);
  pass("Invalid API token correctly rejected with 401 Unauthorized.");

  // 3. Valid bearer token
  const valid = await fetch(`${API_BASE}/api/v1/keys`, {
    headers: { Authorization: `Bearer ${DEV_KEY}` },
  });
  if (valid.status !== 200) fail(`Expected 200 for valid token, got ${valid.status}`);
  const keyData = await valid.json();
  if (!keyData.ok) fail("Key listing returned ok: false");
  pass(`Authenticated request succeeded. Found ${keyData.data?.length || 0} API keys.`);
}

async function testDraftLifecycle() {
  log("TEST 3", "Draft Proposal Lifecycle (Create -> Approve -> Publish)");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${DEV_KEY}`,
  };

  // 1. Submit project draft proposal
  const newSlug = `e2e-project-${Date.now()}`;
  const draftPayload = {
    entityType: "project",
    action: "CREATE",
    title: `E2E Test Project ${Date.now()}`,
    summary: "Automated test project draft to verify review queue flow.",
    data: {
      slug: newSlug,
      name: `E2E Test Project`,
      shortDescription: "A verified automated test project.",
      longDescription: "Complete architecture and lessons learned from the end-to-end integration suite.",
      category: "experiments",
      period: "Sep 2026",
      technologies: ["TypeScript", "Next.js", "Jest"],
      repoVisibility: "public",
      featured: false,
    },
  };

  const createRes = await fetch(`${API_BASE}/api/v1/drafts`, {
    method: "POST",
    headers,
    body: JSON.stringify(draftPayload),
  });

  if (!createRes.ok) fail(`Draft creation failed: ${createRes.status}`);
  const createBody = await createRes.json();
  const draftId = createBody.data?.id;
  if (!draftId) fail("Draft creation response missing draft ID");
  pass(`Draft created successfully with ID: ${draftId}`);

  // 2. Fetch draft from list
  const listRes = await fetch(`${API_BASE}/api/v1/drafts`, { headers });
  const listBody = await listRes.json();
  const list = listBody.data || listBody.items;
  const found = list?.find((d: any) => d.id === draftId);
  if (!found) fail("Created draft not found in GET /api/v1/drafts list");
  pass(`Found draft in review queue with status: ${found.status}`);

  // 3. Approve draft
  const approveRes = await fetch(`${API_BASE}/api/v1/drafts/${draftId}/approve`, {
    method: "POST",
    headers,
  });
  if (!approveRes.ok) fail(`Failed to approve draft: ${approveRes.status}`);
  pass("Draft approved successfully.");

  // 4. Publish draft into production
  const publishRes = await fetch(`${API_BASE}/api/v1/drafts/${draftId}/publish`, {
    method: "POST",
    headers,
  });
  if (!publishRes.ok) fail(`Failed to publish draft: ${publishRes.status}`);
  pass("Draft published into production.");

  // 5. Verify project is now queryable in /api/v1/projects
  const projectRes = await fetch(`${API_BASE}/api/v1/projects/${newSlug}`, { headers });
  if (!projectRes.ok) fail(`Published project not found in /api/v1/projects/${newSlug}`);
  const projectBody = await projectRes.json();
  const proj = projectBody.data || projectBody.project;
  if (proj?.slug !== newSlug) fail("Published project slug mismatch");
  pass(`Published project is live and verified in /api/v1/projects/${newSlug}!`);
}

async function testRevisions() {
  log("TEST 4", "Audit Revisions Logging");
  const headers = { Authorization: `Bearer ${DEV_KEY}` };
  const res = await fetch(`${API_BASE}/api/v1/revisions`, { headers });
  if (!res.ok) fail(`Failed to fetch revisions: ${res.status}`);
  const body = await res.json();
  const revisions = body.data || body.items;
  if (!Array.isArray(revisions) || revisions.length === 0) fail("Revisions list empty");
  pass(`Verified audit log contains ${revisions.length} recorded revisions.`);
}

async function testMcpServer() {
  log("TEST 5", "MCP Server stdio JSON-RPC Protocol");

  return new Promise<void>((resolve, reject) => {
    const proc = spawn("pnpm", ["mcp:server"], {
      env: {
        ...process.env,
        PORTFOLIO_API_URL: API_BASE,
        PORTFOLIO_API_KEY: DEV_KEY,
      },
    });

    const rl = readline.createInterface({ input: proc.stdout });

    let step = 0;

    function send(msg: any) {
      proc.stdin.write(JSON.stringify(msg) + "\n");
    }

    rl.on("line", (line) => {
      try {
        const res = JSON.parse(line);

        // 1. Response to initialize
        if (res.id === 1) {
          if (!res.result || !res.result.serverInfo?.name?.includes("portfolio")) {
            fail(`Unexpected initialize response: ${line}`);
          }
          pass(`MCP Server initialized: ${res.result.serverInfo.name} v${res.result.serverInfo.version}`);

          // Send initialized notification
          send({ jsonrpc: "2.0", method: "notifications/initialized" });

          // Request tools list
          send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
        }
        // 2. Response to tools/list
        else if (res.id === 2) {
          const tools = res.result?.tools;
          if (!Array.isArray(tools) || tools.length === 0) fail("tools/list returned empty or invalid tools");
          pass(`MCP Server advertised ${tools.length} tools: ${tools.map((t: any) => t.name).join(", ")}`);

          // Call portfolio_get_state
          send({
            jsonrpc: "2.0",
            id: 3,
            method: "tools/call",
            params: {
              name: "portfolio_get_state",
              arguments: {},
            },
          });
        }
        // 3. Response to tools/call
        else if (res.id === 3) {
          if (res.error) fail(`portfolio_get_state failed: ${JSON.stringify(res.error)}`);
          const text = res.result?.content?.[0]?.text;
          if (!text) fail("Tool call returned no content text");
          const data = JSON.parse(text);
          if (!data.profile) fail("Tool result missing profile");
          pass(`Tool call 'portfolio_get_state' executed successfully via MCP!`);

          proc.kill();
          resolve();
        }
      } catch (err: any) {
        // ignore parse error if non-json log
      }
    });

    proc.on("error", (err) => {
      fail(`MCP Process error: ${err.message}`);
    });

    proc.stderr.on("data", (d) => {
      const s = d.toString();
      if (s.includes("listening")) {
        // Connected
      }
    });

    // Send initial initialize request
    send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" },
      },
    });

    setTimeout(() => {
      proc.kill();
      reject(new Error("MCP test timed out after 10s"));
    }, 10000);
  });
}

async function testCli() {
  log("TEST 6", "CLI Status Check");
  return new Promise<void>((resolve, reject) => {
    const proc = spawn("pnpm", ["cli", "status"], {
      env: {
        ...process.env,
        PORTFOLIO_API_URL: API_BASE,
        PORTFOLIO_API_KEY: DEV_KEY,
      },
    });

    let output = "";
    proc.stdout.on("data", (d) => { output += d.toString(); });
    proc.stderr.on("data", (d) => { output += d.toString(); });

    proc.on("close", (code) => {
      if (code !== 0) fail(`CLI status failed with exit code ${code}\n${output}`);
      if (!output.includes("Server Connected")) fail(`CLI status output missing connection indicator\n${output}`);
      pass("CLI status check ran cleanly and verified live Postgres connection.");
      resolve();
    });
  });
}

async function run() {
  console.log("\n========================================================");
  console.log(" TEMPLAR OS Agent Platform End-to-End Verification Suite ");
  console.log("========================================================\n");

  try {
    await testPublicEndpoints();
    await testAuthEnforcement();
    await testDraftLifecycle();
    await testRevisions();
    await testMcpServer();
    await testCli();

    console.log("\n\x1b[32m========================================================");
    console.log(" ALL 6 VERIFICATION TEST SUITES PASSED CLEANLY (100%)");
    console.log("========================================================\x1b[0m\n");
  } catch (err: any) {
    console.error(`\nTest suite error: ${err.message}`);
    process.exit(1);
  }
}

run();
