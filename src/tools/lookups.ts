import { z } from "zod";
import type { TaigaClient } from "../client.js";

interface LookupItem {
  id: number;
  name: string;
  color?: string;
  order?: number;
  is_closed?: boolean;
  is_archived?: boolean;
}

function simpleLookupTool(
  client: TaigaClient,
  name: string,
  description: string,
  endpoint: string,
) {
  return {
    name,
    description,
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
    }),
    handler: async ({ project_id }: { project_id: number }) => {
      const items = await client.get<LookupItem[]>(`${endpoint}?project=${project_id}`);
      return items.map((i) => ({
        id: i.id,
        name: i.name,
        ...(i.color !== undefined && { color: i.color }),
        ...(i.order !== undefined && { order: i.order }),
        ...(i.is_closed !== undefined && { is_closed: i.is_closed }),
        ...(i.is_archived !== undefined && { is_archived: i.is_archived }),
      }));
    },
  };
}

export const lookupsTools = (client: TaigaClient) => [
  simpleLookupTool(
    client,
    "list_issue_statuses",
    "List all issue statuses for a project (use these IDs when updating issue status)",
    "/issue-statuses",
  ),
  simpleLookupTool(
    client,
    "list_userstory_statuses",
    "List all user story statuses for a project (use these IDs when updating user story status)",
    "/userstory-statuses",
  ),
  simpleLookupTool(
    client,
    "list_task_statuses",
    "List all task statuses for a project (use these IDs when updating task status)",
    "/task-statuses",
  ),
  simpleLookupTool(
    client,
    "list_priorities",
    "List all issue priorities for a project (use these IDs when creating/updating issues)",
    "/priorities",
  ),
  simpleLookupTool(
    client,
    "list_severities",
    "List all issue severities for a project (use these IDs when creating/updating issues)",
    "/severities",
  ),
  simpleLookupTool(
    client,
    "list_issue_types",
    "List all issue types for a project (use these IDs when creating/updating issues)",
    "/issue-types",
  ),
];
