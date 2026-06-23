import { z } from "zod";
import type { TaigaClient } from "../client.js";

export const epicsTools = (client: TaigaClient) => [
  {
    name: "list_epics",
    description: "List all epics in a Taiga project",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
    }),
    handler: async ({ project_id }: { project_id: number }) => {
      const epics = await client.get<TaigaEpic[]>(`/epics?project=${project_id}`);
      return epics.map(formatEpic);
    },
  },
  {
    name: "get_epic",
    description: "Get details of a specific epic by ID",
    inputSchema: z.object({
      epic_id: z.number().describe("Epic numeric ID"),
    }),
    handler: async ({ epic_id }: { epic_id: number }) => {
      return formatEpic(await client.get<TaigaEpic>(`/epics/${epic_id}`));
    },
  },
  {
    name: "create_epic",
    description: "Create a new epic in a Taiga project",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
      subject: z.string().describe("Epic title"),
      description: z.string().optional().describe("Epic description (markdown)"),
      color: z.string().optional().describe("Hex color code e.g. #F00000"),
      assigned_to: z.number().optional().describe("Assignee user ID"),
      tags: z.array(z.string()).optional(),
    }),
    handler: async (args: {
      project_id: number;
      subject: string;
      description?: string;
      color?: string;
      assigned_to?: number;
      tags?: string[];
    }) => {
      const { project_id, ...rest } = args;
      return formatEpic(await client.post<TaigaEpic>("/epics", { project: project_id, ...rest }));
    },
  },
  {
    name: "update_epic",
    description: "Update an existing epic (subject, description, status, assignee, color)",
    inputSchema: z.object({
      epic_id: z.number().describe("Epic numeric ID"),
      version: z.number().describe("Current version for optimistic locking"),
      subject: z.string().optional(),
      description: z.string().optional(),
      status: z.number().optional().describe("Status ID"),
      assigned_to: z.number().optional(),
      color: z.string().optional().describe("Hex color code"),
      tags: z.array(z.string()).optional(),
    }),
    handler: async ({ epic_id, ...fields }: { epic_id: number; version: number; [key: string]: unknown }) => {
      return formatEpic(await client.patch<TaigaEpic>(`/epics/${epic_id}`, fields));
    },
  },
  {
    name: "list_epic_userstories",
    description: "List all user stories linked to an epic",
    inputSchema: z.object({
      epic_id: z.number().describe("Epic numeric ID"),
    }),
    handler: async ({ epic_id }: { epic_id: number }) => {
      const items = await client.get<TaigaRelatedUS[]>(`/epics/${epic_id}/related_userstories`);
      return items.map((i) => ({
        userstory_id: i.user_story,
        epic_id: i.epic,
        order: i.order,
      }));
    },
  },
  {
    name: "link_userstory_to_epic",
    description: "Link an existing user story to an epic",
    inputSchema: z.object({
      epic_id: z.number().describe("Epic numeric ID"),
      userstory_id: z.number().describe("User story numeric ID"),
    }),
    handler: async ({ epic_id, userstory_id }: { epic_id: number; userstory_id: number }) => {
      const result = await client.post<TaigaRelatedUS>(`/epics/${epic_id}/related_userstories`, {
        epic: epic_id,
        user_story: userstory_id,
      });
      return { linked: true, userstory_id: result.user_story, epic_id: result.epic };
    },
  },
  {
    name: "unlink_userstory_from_epic",
    description: "Remove the link between a user story and an epic",
    inputSchema: z.object({
      epic_id: z.number().describe("Epic numeric ID"),
      userstory_id: z.number().describe("User story numeric ID"),
    }),
    handler: async ({ epic_id, userstory_id }: { epic_id: number; userstory_id: number }) => {
      await client.delete(`/epics/${epic_id}/related_userstories/${userstory_id}`);
      return { unlinked: true };
    },
  },
];

function formatEpic(e: TaigaEpic) {
  return {
    id: e.id,
    ref: e.ref,
    subject: e.subject,
    description: e.description,
    status: e.status_extra_info?.name,
    assigned_to: e.assigned_to_extra_info?.full_name,
    color: e.color,
    tags: e.tags,
    version: e.version,
    created_date: e.created_date,
    modified_date: e.modified_date,
  };
}

interface TaigaEpic {
  id: number;
  ref: number;
  subject: string;
  description: string;
  color: string;
  version: number;
  tags: string[];
  created_date: string;
  modified_date: string;
  status_extra_info?: { name: string };
  assigned_to_extra_info?: { full_name: string } | null;
}

interface TaigaRelatedUS {
  user_story: number;
  epic: number;
  order: number;
}
