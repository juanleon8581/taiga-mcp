import { z } from "zod";
import type { TaigaClient } from "../client.js";

export const tasksTools = (client: TaigaClient) => [
  {
    name: "list_tasks",
    description: "List tasks in a Taiga project, optionally filtered by user story or milestone",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
      userstory_id: z.number().optional().describe("Filter by user story ID"),
      milestone_id: z.number().optional().describe("Filter by sprint/milestone ID"),
      assigned_to: z.number().optional().describe("Filter by assignee user ID"),
    }),
    handler: async ({ project_id, userstory_id, milestone_id, assigned_to }: {
      project_id: number;
      userstory_id?: number;
      milestone_id?: number;
      assigned_to?: number;
    }) => {
      const params = new URLSearchParams({ project: String(project_id) });
      if (userstory_id) params.set("user_story", String(userstory_id));
      if (milestone_id) params.set("milestone", String(milestone_id));
      if (assigned_to) params.set("assigned_to", String(assigned_to));
      const tasks = await client.get<TaigaTask[]>(`/tasks?${params}`);
      return tasks.map(formatTask);
    },
  },
  {
    name: "get_task",
    description: "Get a specific task by ID, including full description",
    inputSchema: z.object({
      task_id: z.number().describe("Task numeric ID"),
    }),
    handler: async ({ task_id }: { task_id: number }) => {
      return formatTask(await client.get<TaigaTask>(`/tasks/${task_id}`));
    },
  },
  {
    name: "create_task",
    description: "Create a new task in a Taiga project",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
      subject: z.string().describe("Task title"),
      description: z.string().optional(),
      userstory_id: z.number().optional().describe("Parent user story ID"),
      milestone_id: z.number().optional().describe("Sprint/milestone ID"),
      assigned_to: z.number().optional().describe("Assignee user ID"),
      tags: z.array(z.string()).optional(),
    }),
    handler: async (args: {
      project_id: number;
      subject: string;
      description?: string;
      userstory_id?: number;
      milestone_id?: number;
      assigned_to?: number;
      tags?: string[];
    }) => {
      const { project_id, userstory_id, milestone_id, ...rest } = args;
      const body: Record<string, unknown> = { project: project_id, ...rest };
      if (userstory_id) body.user_story = userstory_id;
      if (milestone_id) body.milestone = milestone_id;
      return formatTask(await client.post<TaigaTask>("/tasks", body));
    },
  },
  {
    name: "update_task",
    description: "Update an existing task (status, assignee, description, etc.)",
    inputSchema: z.object({
      task_id: z.number().describe("Task numeric ID"),
      version: z.number().describe("Current version for optimistic locking"),
      subject: z.string().optional(),
      description: z.string().optional(),
      status: z.number().optional().describe("Status ID"),
      assigned_to: z.number().optional(),
      tags: z.array(z.string()).optional(),
    }),
    handler: async ({ task_id, ...fields }: { task_id: number; version: number; [key: string]: unknown }) => {
      return formatTask(await client.patch<TaigaTask>(`/tasks/${task_id}`, fields));
    },
  },
  {
    name: "move_task",
    description: "Move a task to a different user story (or unassign it from any user story)",
    inputSchema: z.object({
      task_id: z.number().describe("Task numeric ID"),
      version: z.number().describe("Current version for optimistic locking"),
      userstory_id: z.number().nullable().describe("Target user story ID, or null to unassign"),
    }),
    handler: async ({ task_id, version, userstory_id }: { task_id: number; version: number; userstory_id: number | null }) => {
      return formatTask(await client.patch<TaigaTask>(`/tasks/${task_id}`, { version, user_story: userstory_id }));
    },
  },
];

function formatTask(t: TaigaTask) {
  return {
    id: t.id,
    ref: t.ref,
    subject: t.subject,
    description: t.description,
    status: t.status_extra_info?.name,
    assigned_to: t.assigned_to_extra_info?.full_name,
    userstory: t.user_story_extra_info?.subject,
    tags: t.tags,
    version: t.version,
    created_date: t.created_date,
    modified_date: t.modified_date,
  };
}

interface TaigaTask {
  id: number;
  ref: number;
  subject: string;
  description: string;
  version: number;
  tags: string[];
  created_date: string;
  modified_date: string;
  status_extra_info?: { name: string };
  assigned_to_extra_info?: { full_name: string } | null;
  user_story_extra_info?: { subject: string } | null;
}
