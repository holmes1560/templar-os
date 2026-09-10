#!/usr/bin/env node

/**
 * TEMPLAR OS Portfolio Agent CLI
 *
 * Agent-agnostic developer and human CLI for inspecting, managing,
 * and installing the Portfolio Platform, MCP Server, and Agent Skills.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const CONFIG_FILE_NAME = ".portfolio-agent.json";

interface AgentConfig {
  apiUrl: string;
  apiKey: string;
}

function findConfigFile(): string {
  // Check cwd, parent directories, or home
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    const candidate = path.join(dir, CONFIG_FILE_NAME);
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  const homeCandidate = path.join(process.env.HOME || "", CONFIG_FILE_NAME);
  if (fs.existsSync(homeCandidate)) return homeCandidate;
  return path.join(process.cwd(), CONFIG_FILE_NAME);
}

function loadConfig(): AgentConfig {
  const configFile = findConfigFile();
  let fileConfig: Partial<AgentConfig> = {};
  if (fs.existsSync(configFile)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(configFile, "utf-8"));
    } catch {
      // ignore
    }
  }

  // Also check local .env for DEV_API_KEY if in templar-os directory
  let envKey = process.env.PORTFOLIO_API_KEY;
  if (!envKey) {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const match = fs.readFileSync(envPath, "utf-8").match(/DEV_API_KEY=["']?([^"'\r\n]+)/);
      if (match) envKey = match[1];
    }
  }

  return {
    apiUrl: process.env.PORTFOLIO_API_URL || fileConfig.apiUrl || "http://localhost:3100",
    apiKey: envKey || fileConfig.apiKey || "",
  };
}

function saveConfig(config: AgentConfig) {
  const target = path.join(process.cwd(), CONFIG_FILE_NAME);
  fs.writeFileSync(target, JSON.stringify(config, null, 2), "utf-8");
  console.log(`✓ Configuration saved to ${target}`);
}

async function apiRequest<T>(
  config: AgentConfig,
  endpoint: string,
  method = "GET",
  body?: unknown
): Promise<T> {
  const url = `${config.apiUrl.replace(/\/$/, "")}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.apiKey) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Server returned non-JSON response (${res.status}): ${text.slice(0, 100)}`);
  }

  if (!res.ok) {
    throw new Error(json.error || `HTTP ${res.status}: ${res.statusText}`);
  }

  return json as T;
}

/* ─────────────────────────── Commands ─────────────────────────── */

async function cmdStatus() {
  const config = loadConfig();
  console.log(`\n=== TEMPLAR OS Agent Status ===`);
  console.log(`API URL : ${config.apiUrl}`);
  console.log(`API Key : ${config.apiKey ? `${config.apiKey.slice(0, 12)}...` : "(none provided)"}`);

  const t0 = Date.now();
  try {
    const res = await apiRequest<any>(config, "/api/v1/portfolio");
    const data = res.data || res;
    const latency = Date.now() - t0;

    console.log(`\n✓ Server Connected (${latency}ms)`);
    console.log(`• Profile      : ${data.profile?.fullName || data.profile?.name || "Asenso Owusu Ansah"} (${data.profile?.title || "Computer Science · KNUST"})`);
    console.log(`• Projects     : ${data.projects?.length || 0} published`);
    console.log(`• Milestones   : ${data.timeline?.length || 0} timeline entries`);
    console.log(`• Skills       : ${data.skills?.length || 0} categories`);
    console.log(`• Snapshot mode: ${data.stale ? "STALE FALLBACK" : "LIVE POSTGRES"}`);

    if (config.apiKey) {
      try {
        const drafts = await apiRequest<any>(config, "/api/v1/drafts");
        console.log(`• Review Queue : ${drafts.items?.length || 0} pending drafts`);
      } catch {
        console.log(`• Review Queue : (Requires agent/admin scope)`);
      }
    }
  } catch (err: any) {
    console.error(`\n✗ Connection failed: ${err.message}`);
    console.log(`Tip: Run "pnpm dev" to start the local Next.js server on port 3100.`);
  }
}

function getTargetConfigs(target: string) {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  const isWin = process.platform === "win32";
  const isMac = process.platform === "darwin";

  const targets: { name: string; path: string }[] = [];

  const claudeDesktopPath = isWin
    ? path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "Claude", "claude_desktop_config.json")
    : isMac
    ? path.join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json")
    : path.join(home, ".config", "Claude", "claude_desktop_config.json");

  const claudeCodePath = path.join(home, ".claude.json");
  const cursorGlobalPath = path.join(home, ".cursor", "mcp.json");
  const cursorLocalPath = path.join(process.cwd(), ".cursor", "mcp.json");
  const antigravityPaths = [
    path.join(home, ".gemini", "antigravity", "mcp_config.json"),
    path.join(home, ".gemini", "config", "mcp_config.json"),
    path.join(home, ".gemini", "antigravity-ide", "mcp_config.json"),
  ];
  const windsurfPath = isWin
    ? path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "Codeium", "windsurf", "mcp_config.json")
    : isMac
    ? path.join(home, "Library", "Application Support", "Windsurf", "mcp_config.json")
    : path.join(home, ".codeium", "windsurf", "mcp_config.json");

  const addClaudeDesktop = () => targets.push({ name: "Claude Desktop", path: claudeDesktopPath });
  const addClaudeCode = () => targets.push({ name: "Claude Code CLI", path: claudeCodePath });
  const addCursor = () => {
    targets.push({ name: "Cursor (Global)", path: cursorGlobalPath });
    if (fs.existsSync(path.dirname(cursorLocalPath))) {
      targets.push({ name: "Cursor (Project)", path: cursorLocalPath });
    }
  };
  const addAntigravity = () => {
    for (const agPath of antigravityPaths) {
      targets.push({ name: `Antigravity (${path.basename(path.dirname(agPath))})`, path: agPath });
    }
  };
  const addWindsurf = () => targets.push({ name: "Windsurf", path: windsurfPath });

  switch (target.toLowerCase()) {
    case "claude":
    case "claudedesktop":
      addClaudeDesktop();
      break;
    case "claude-code":
    case "claudecode":
      addClaudeCode();
      break;
    case "cursor":
      addCursor();
      break;
    case "antigravity":
    case "gemini":
      addAntigravity();
      break;
    case "windsurf":
      addWindsurf();
      break;
    case "all":
    default:
      addClaudeDesktop();
      addClaudeCode();
      addCursor();
      addAntigravity();
      addWindsurf();
      break;
  }

  return targets;
}

function injectMcpServer(targetFile: string, serverName: string, serverConfig: any): boolean {
  try {
    let data: any = {};
    if (fs.existsSync(targetFile)) {
      try {
        data = JSON.parse(fs.readFileSync(targetFile, "utf-8"));
      } catch {
        data = {};
      }
    } else {
      fs.mkdirSync(path.dirname(targetFile), { recursive: true });
    }
    if (!data.mcpServers) data.mcpServers = {};
    data.mcpServers[serverName] = serverConfig;
    fs.writeFileSync(targetFile, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch {
    return false;
  }
}

function installSkillsToAgents(home: string, repoDir: string): string[] {
  const sourceSkill = path.join(repoDir, "skills", "portfolio-management", "SKILL.md");
  if (!fs.existsSync(sourceSkill)) return [];
  const content = fs.readFileSync(sourceSkill, "utf-8");

  const destinations = [
    path.join(home, ".gemini", "config", "skills", "portfolio-management", "SKILL.md"),
    path.join(home, ".config", "skills", "portfolio-management", "SKILL.md"),
  ];

  const installed: string[] = [];
  for (const dest of destinations) {
    try {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, content, "utf-8");
      installed.push(dest);
    } catch {}
  }
  return installed;
}

async function cmdInstall(args: string[]) {
  console.log(`\n=== TEMPLAR OS One-Command Agent Installer ===\n`);

  let targetAgent = "all";
  let apiUrl = "";
  let apiKey = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--url" && args[i + 1]) apiUrl = args[++i];
    else if ((arg === "--key" || arg === "--api-key") && args[i + 1]) apiKey = args[++i];
    else if (arg === "--agent" && args[i + 1]) targetAgent = args[++i];
    else if (!arg.startsWith("-") && i === 0) targetAgent = arg;
  }

  const existingConfig = loadConfig();
  if (!apiKey) apiKey = existingConfig.apiKey;
  if (!apiUrl) apiUrl = existingConfig.apiUrl || "https://templar-os.vercel.app";

  console.log(`1. Testing connection to ${apiUrl}...`);
  try {
    const res = await apiRequest<any>({ apiUrl, apiKey }, "/api/v1/portfolio");
    const data = res.data || res;
    console.log(`   ✓ Connected! Found portfolio for "${data.profile?.fullName || "Asenso Owusu Ansah"}".`);
  } catch (err: any) {
    console.warn(`   ! Warning: Could not reach API at ${apiUrl}: ${err.message}`);
    console.warn(`     Continuing installation.`);
  }

  // Save config
  saveConfig({ apiUrl, apiKey });

  // MCP Server Configuration
  const rootDir = process.cwd();
  const tsxBin = path.join(rootDir, "node_modules", ".bin", "tsx");
  const serverPath = path.join(rootDir, "src", "mcp", "server.ts");

  let mcpCommand = "tsx";
  let mcpArgs = [serverPath];

  if (fs.existsSync(tsxBin)) {
    mcpCommand = tsxBin;
    mcpArgs = [serverPath];
  } else if (fs.existsSync(serverPath)) {
    mcpCommand = "npx";
    mcpArgs = ["-y", "tsx", serverPath];
  } else {
    mcpCommand = "npx";
    mcpArgs = ["-y", "templar-os", "mcp"];
  }

  const serverConfig = {
    command: mcpCommand,
    args: mcpArgs,
    env: {
      PORTFOLIO_API_URL: apiUrl,
      PORTFOLIO_API_KEY: apiKey,
    },
  };

  console.log(`\n2. Configuring AI Agent MCP Client(s): [target: ${targetAgent}]`);
  const targets = getTargetConfigs(targetAgent);
  let updatedCount = 0;

  for (const t of targets) {
    // If target is "all", only write to existing client directories or files
    if (targetAgent === "all" && !fs.existsSync(t.path) && !fs.existsSync(path.dirname(t.path))) {
      continue;
    }
    const success = injectMcpServer(t.path, "templar-portfolio", serverConfig);
    if (success) {
      console.log(`   ✓ Configured ${t.name}: ${t.path}`);
      updatedCount++;
    }
  }

  if (updatedCount === 0) {
    console.log(`   ! No matching client config files found. Manual configuration snippet:\n`);
    console.log(JSON.stringify({ mcpServers: { "templar-portfolio": serverConfig } }, null, 2));
  }

  console.log(`\n3. Installing Agent Skill:`);
  const home = process.env.HOME || process.env.USERPROFILE || "";
  const installedSkills = installSkillsToAgents(home, rootDir);
  if (installedSkills.length > 0) {
    for (const s of installedSkills) {
      console.log(`   ✓ Installed skill to: ${s}`);
    }
  } else {
    const skillFile = path.join(rootDir, "skills", "portfolio-management", "SKILL.md");
    if (fs.existsSync(skillFile)) {
      console.log(`   • Skill file located at: ${skillFile}`);
    }
  }

  console.log(`\n✓ Installation complete! Run "pnpm cli status" to verify at any time.\n`);
}

async function cmdProjects(args: string[]) {
  const config = loadConfig();
  const sub = args[0] || "list";

  if (sub === "list") {
    const data = await apiRequest<any>(config, "/api/v1/projects");
    console.log(`\n=== Published Projects (${data.items?.length || 0}) ===\n`);
    for (const p of data.items || []) {
      console.log(`• [${p.category.padEnd(12)}] ${p.title} (${p.slug})`);
      console.log(`  ${p.summary}`);
      if (p.technologies?.length) {
        console.log(`  Tech: ${p.technologies.join(", ")}`);
      }
      console.log();
    }
  } else if (sub === "get") {
    const slug = args[1];
    if (!slug) {
      console.error("Usage: cli projects get <slug>");
      return;
    }
    const data = await apiRequest<any>(config, `/api/v1/projects/${slug}`);
    console.log(JSON.stringify(data.project, null, 2));
  } else {
    console.log("Usage: cli projects [list | get <slug>]");
  }
}

async function cmdDrafts(args: string[]) {
  const config = loadConfig();
  const sub = args[0] || "list";

  if (sub === "list") {
    const data = await apiRequest<any>(config, "/api/v1/drafts");
    console.log(`\n=== Review Queue / Drafts (${data.items?.length || 0}) ===\n`);
    if (data.items?.length === 0) {
      console.log("No pending drafts in the review queue.");
      return;
    }
    for (const d of data.items || []) {
      console.log(`ID: ${d.id}`);
      console.log(`  Entity : ${d.entityType} (${d.action})`);
      console.log(`  Summary: ${d.summary}`);
      console.log(`  Created: ${d.createdAt} by ${d.author || "Agent"}`);
      console.log(`  Status : ${d.status}`);
      console.log();
    }
  } else if (sub === "approve") {
    const id = args[1];
    if (!id) {
      console.error("Usage: cli drafts approve <draft-id>");
      return;
    }
    const res = await apiRequest<any>(config, `/api/v1/drafts/${id}/approve`, "POST");
    console.log(`✓ Draft ${id} approved.`);
  } else if (sub === "publish") {
    const id = args[1];
    if (!id) {
      console.error("Usage: cli drafts publish <draft-id>");
      return;
    }
    const res = await apiRequest<any>(config, `/api/v1/drafts/${id}/publish`, "POST");
    console.log(`✓ Draft ${id} published into production.`);
  } else if (sub === "reject") {
    const id = args[1];
    const reason = args.slice(2).join(" ") || "Rejected by developer";
    if (!id) {
      console.error("Usage: cli drafts reject <draft-id> [reason]");
      return;
    }
    const res = await apiRequest<any>(config, `/api/v1/drafts/${id}/reject`, "POST", { reason });
    console.log(`✓ Draft ${id} rejected.`);
  } else {
    console.log("Usage: cli drafts [list | approve <id> | publish <id> | reject <id>]");
  }
}

async function cmdKeys(args: string[]) {
  const config = loadConfig();
  const sub = args[0] || "list";

  if (sub === "list") {
    const data = await apiRequest<any>(config, "/api/v1/keys");
    console.log(`\n=== API Keys (${data.keys?.length || 0}) ===\n`);
    for (const k of data.keys || []) {
      console.log(`• ${k.name} [${k.role}] (${k.keyPrefix}...)`);
      console.log(`  ID: ${k.id} | Scopes: ${k.scopes.join(", ")}`);
      console.log(`  Active: ${k.isActive} | Last used: ${k.lastUsedAt || "Never"}`);
      console.log();
    }
  } else if (sub === "create") {
    let name = "CLI Agent Key";
    let role = "AGENT";
    for (let i = 1; i < args.length; i++) {
      if (args[i] === "--name" && args[i + 1]) name = args[++i];
      if (args[i] === "--role" && args[i + 1]) role = args[++i].toUpperCase();
    }
    const data = await apiRequest<any>(config, "/api/v1/keys", "POST", { name, role });
    console.log(`\n✓ API Key created!`);
    console.log(`Name  : ${data.key.name}`);
    console.log(`Secret: ${data.secret}`);
    console.log(`\nIMPORTANT: Save this secret now. It will not be shown again.`);
  } else if (sub === "revoke") {
    const id = args[1];
    if (!id) {
      console.error("Usage: cli keys revoke <key-id>");
      return;
    }
    await apiRequest<any>(config, `/api/v1/keys/${id}`, "DELETE");
    console.log(`✓ Key ${id} revoked.`);
  } else {
    console.log("Usage: cli keys [list | create --name <name> --role <admin|agent|read_only> | revoke <id>]");
  }
}

async function cmdDiscover() {
  const config = loadConfig();
  console.log(`\nDiscovering repositories and generating draft proposals...`);
  try {
    const data = await apiRequest<any>(config, "/api/v1/github/discover", "POST");
    console.log(`\n=== Discovery Results ===`);
    console.log(`Total checked: ${data.checkedCount}`);
    console.log(`New drafts created: ${data.draftsCreated?.length || 0}\n`);
    for (const d of data.draftsCreated || []) {
      console.log(`• Draft ID: ${d.draftId} - ${d.repoName} (${d.summary})`);
    }
  } catch (err: any) {
    console.error(`✗ Discovery failed: ${err.message}`);
  }
}

function printHelp() {
  console.log(`
TEMPLAR OS Portfolio Agent CLI

USAGE:
  pnpm cli <command> [options]

COMMANDS:
  status                Check server health, database connectivity, and portfolio stats
  install [options]     One-command setup for MCP server and agent configuration
                        Options: --url <url> --key <key> --agent <generic|claude|cursor>
  projects [subcommand] List and inspect published projects
                        Subcommands: list, get <slug>
  drafts [subcommand]   Manage the Review Queue and draft proposals
                        Subcommands: list, approve <id>, publish <id>, reject <id>
  keys [subcommand]     Manage API keys for AI agents and integrations
                        Subcommands: list, create [--name <n> --role <r>], revoke <id>
  discover              Auto-discover missing GitHub repos and queue project drafts
  help                  Show this help screen
`);
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);

  try {
    switch (cmd) {
      case "status":
        await cmdStatus();
        break;
      case "install":
      case "setup":
        await cmdInstall(args);
        break;
      case "projects":
        await cmdProjects(args);
        break;
      case "drafts":
        await cmdDrafts(args);
        break;
      case "keys":
        await cmdKeys(args);
        break;
      case "discover":
        await cmdDiscover();
        break;
      case "help":
      case "--help":
      case "-h":
      case undefined:
        printHelp();
        break;
      default:
        console.error(`Unknown command: ${cmd}`);
        printHelp();
        process.exit(1);
    }
  } catch (err: any) {
    console.error(`\nError: ${err.message}`);
    process.exit(1);
  }
}

main();
