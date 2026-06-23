import { z } from "zod";
import type { TaigaClient } from "../client.js";

const OBJECT_TYPE = z.enum(["issue", "userstory", "task", "epic"]);
type ObjectType = z.infer<typeof OBJECT_TYPE>;

const ENDPOINT_MAP: Record<ObjectType, string> = {
  issue: "issues",
  userstory: "userstories",
  task: "tasks",
  epic: "epics",
};

export const commentsTools = (client: TaigaClient) => [
  {
    name: "add_comment",
    description: "Add a comment to a Taiga issue, user story, task, or epic",
    inputSchema: z.object({
      object_type: OBJECT_TYPE.describe("Type of object to comment on"),
      object_id: z.number().describe("Numeric ID of the object"),
      version: z.number().describe("Current version of the object (required for optimistic locking)"),
      comment: z.string().describe("Comment text (markdown supported)"),
    }),
    handler: async ({ object_type, object_id, version, comment }: {
      object_type: ObjectType;
      object_id: number;
      version: number;
      comment: string;
    }) => {
      const endpoint = ENDPOINT_MAP[object_type];
      const result = await client.patch<{ id: number; version: number }>(`/${endpoint}/${object_id}`, {
        version,
        comment,
      });
      return { id: result.id, new_version: result.version, comment_added: true };
    },
  },
  {
    name: "get_history",
    description: "Get the activity history and comments of a Taiga issue, user story, task, or epic",
    inputSchema: z.object({
      object_type: OBJECT_TYPE.describe("Type of object"),
      object_id: z.number().describe("Numeric ID of the object"),
    }),
    handler: async ({ object_type, object_id }: { object_type: ObjectType; object_id: number }) => {
      const entries = await client.get<TaigaHistoryEntry[]>(`/history/${object_type}/${object_id}`);
      return entries.map((e) => ({
        id: e.id,
        created_at: e.created_at,
        user: e.user?.name,
        comment: e.comment || null,
        comment_html: e.comment_html || null,
        is_hidden: e.is_hidden,
        diff: e.diff ? Object.keys(e.diff) : [],
      }));
    },
  },
];

interface TaigaHistoryEntry {
  id: string;
  created_at: string;
  is_hidden: boolean;
  comment: string;
  comment_html: string;
  user?: { name: string };
  diff?: Record<string, unknown>;
}
