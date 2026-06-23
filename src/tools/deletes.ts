import { z } from "zod";
import type { TaigaClient } from "../client.js";

function deleteToolFor(
  client: TaigaClient,
  name: string,
  objectType: string,
  endpoint: string,
  idParam: string,
) {
  return {
    name,
    description: `Permanently delete a ${objectType}. This action cannot be undone.`,
    inputSchema: z.object({
      [idParam]: z.number().describe(`${objectType} numeric ID`),
    }),
    handler: async (args: Record<string, number>) => {
      const id = args[idParam];
      await client.delete(`${endpoint}/${id}`);
      return { deleted: true, [idParam]: id };
    },
  };
}

export const deletesTools = (client: TaigaClient) => [
  deleteToolFor(client, "delete_issue",     "issue",      "/issues",      "issue_id"),
  deleteToolFor(client, "delete_userstory", "user story", "/userstories", "userstory_id"),
  deleteToolFor(client, "delete_task",      "task",       "/tasks",       "task_id"),
  deleteToolFor(client, "delete_epic",      "epic",       "/epics",       "epic_id"),
  deleteToolFor(client, "delete_milestone", "milestone",  "/milestones",  "milestone_id"),
];
