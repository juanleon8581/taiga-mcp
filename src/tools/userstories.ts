import { z } from "zod";
import type { TaigaClient } from "../client.js";

export const userstoriesTools = (client: TaigaClient) => [
  {
    name: "bulk_create_userstories",
    description: "Create multiple user stories at once from a list of subjects (one per line)",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
      subjects: z.array(z.string()).describe("List of user story subjects/titles to create"),
      status_id: z.number().optional().describe("Status ID to assign to all created stories"),
      milestone_id: z.number().optional().describe("Sprint/milestone ID to assign to all stories"),
    }),
    handler: async ({ project_id, subjects, status_id, milestone_id }: {
      project_id: number;
      subjects: string[];
      status_id?: number;
      milestone_id?: number;
    }) => {
      const body: Record<string, unknown> = {
        project_id,
        bulk_stories: subjects.join("\n"),
      };
      if (status_id) body.status_id = status_id;
      if (milestone_id) body.milestone_id = milestone_id;
      const stories = await client.post<TaigaUS[]>("/userstories/bulk_create", body);
      return stories.map(formatUS);
    },
  },
  {
    name: "list_userstories",
    description: "List user stories in a Taiga project, optionally filtered by milestone",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
      milestone_id: z.number().optional().describe("Filter by sprint/milestone ID"),
      status: z.string().optional().describe("'open' or 'closed'"),
    }),
    handler: async ({ project_id, milestone_id, status }: { project_id: number; milestone_id?: number; status?: string }) => {
      const params = new URLSearchParams({ project: String(project_id) });
      if (milestone_id) params.set("milestone", String(milestone_id));
      if (status === "closed") params.set("status__is_closed", "true");
      if (status === "open") params.set("status__is_closed", "false");
      const stories = await client.get<TaigaUS[]>(`/userstories?${params}`);
      return stories.map(formatUS);
    },
  },
  {
    name: "get_userstory",
    description: "Get a specific user story by ID",
    inputSchema: z.object({
      userstory_id: z.number().describe("User story numeric ID"),
    }),
    handler: async ({ userstory_id }: { userstory_id: number }) => {
      return formatUS(await client.get<TaigaUS>(`/userstories/${userstory_id}`));
    },
  },
  {
    name: "create_userstory",
    description: "Create a new user story in a Taiga project",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
      subject: z.string().describe("User story title"),
      description: z.string().optional().describe("User story description (markdown)"),
      milestone_id: z.number().optional().describe("Sprint/milestone ID to assign"),
      assigned_to: z.number().optional().describe("Assignee user ID"),
      tags: z.array(z.string()).optional(),
      points: z.record(z.string(), z.number()).optional().describe("Story points by role ID"),
    }),
    handler: async (args: {
      project_id: number;
      subject: string;
      description?: string;
      milestone_id?: number;
      assigned_to?: number;
      tags?: string[];
      points?: Record<string, number>;
    }) => {
      const { project_id, milestone_id, ...rest } = args;
      const body: Record<string, unknown> = { project: project_id, ...rest };
      if (milestone_id) body.milestone = milestone_id;
      return formatUS(await client.post<TaigaUS>("/userstories", body));
    },
  },
  {
    name: "update_userstory",
    description: "Update an existing user story",
    inputSchema: z.object({
      userstory_id: z.number().describe("User story numeric ID"),
      version: z.number().describe("Current version for optimistic locking"),
      subject: z.string().optional(),
      description: z.string().optional(),
      status: z.number().optional().describe("Status ID"),
      milestone: z.number().optional().describe("Sprint/milestone ID"),
      assigned_to: z.number().optional(),
      tags: z.array(z.string()).optional(),
    }),
    handler: async ({ userstory_id, ...fields }: { userstory_id: number; version: number; [key: string]: unknown }) => {
      return formatUS(await client.patch<TaigaUS>(`/userstories/${userstory_id}`, fields));
    },
  },
];

function formatUS(s: TaigaUS) {
  return {
    id: s.id,
    ref: s.ref,
    subject: s.subject,
    description: s.description,
    status: s.status_extra_info?.name,
    milestone: s.milestone_extra_info?.name,
    assigned_to: s.assigned_to_extra_info?.full_name,
    tags: s.tags,
    version: s.version,
    total_points: s.total_points,
    created_date: s.created_date,
    modified_date: s.modified_date,
  };
}

interface TaigaUS {
  id: number;
  ref: number;
  subject: string;
  description: string;
  version: number;
  tags: string[];
  total_points: number;
  created_date: string;
  modified_date: string;
  status_extra_info?: { name: string };
  milestone_extra_info?: { name: string } | null;
  assigned_to_extra_info?: { full_name: string } | null;
}
