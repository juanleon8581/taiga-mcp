#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { TaigaClient } from "./client.js";
import { projectsTools } from "./tools/projects.js";
import { issuesTools } from "./tools/issues.js";
import { userstoriesTools } from "./tools/userstories.js";
import { tasksTools } from "./tools/tasks.js";
import { milestonesTools } from "./tools/milestones.js";
import { membersTools } from "./tools/members.js";
import { lookupsTools } from "./tools/lookups.js";
import { commentsTools } from "./tools/comments.js";
import { epicsTools } from "./tools/epics.js";
import { searchTools } from "./tools/search.js";
import { wikiTools } from "./tools/wiki.js";
import { rolesTools } from "./tools/roles.js";
import { deletesTools } from "./tools/deletes.js";
import { usersTools } from "./tools/users.js";
import { webhooksTools } from "./tools/webhooks.js";
import { attachmentsTools } from "./tools/attachments.js";

const config = loadConfig();
const client = new TaigaClient(config);

const server = new McpServer({
  name: "taiga-mcp",
  version: "0.2.0",
});

const allTools = [
  ...projectsTools(client),
  ...issuesTools(client),
  ...userstoriesTools(client),
  ...tasksTools(client),
  ...milestonesTools(client),
  ...membersTools(client),
  ...lookupsTools(client),
  ...commentsTools(client),
  ...epicsTools(client),
  ...searchTools(client),
  ...wikiTools(client),
  ...rolesTools(client),
  ...deletesTools(client),
  ...usersTools(client),
  ...webhooksTools(client),
  ...attachmentsTools(client),
];

for (const tool of allTools) {
  const { name, description, inputSchema, handler } = tool;
  server.tool(
    name,
    description,
    inputSchema.shape,
    async (args: Record<string, unknown>) => {
      const result = await (handler as (a: Record<string, unknown>) => Promise<unknown>)(args);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}

const transport = new StdioServerTransport();
await server.connect(transport);
