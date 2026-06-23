import { z } from "zod";
import type { TaigaClient } from "../client.js";

export const projectsTools = (client: TaigaClient) => [
  {
    name: "list_projects",
    description: "List all Taiga projects the authenticated user has access to",
    inputSchema: z.object({}),
    handler: async () => {
      const projects = await client.get<TaigaProject[]>("/projects?order_by=user_order");
      return projects.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        is_private: p.is_private,
        total_milestones: p.total_milestones,
        total_fans: p.total_fans,
      }));
    },
  },
  {
    name: "get_project",
    description: "Get details of a specific Taiga project by ID or slug",
    inputSchema: z.object({
      project_id: z.union([z.number(), z.string()]).describe("Project numeric ID or slug"),
    }),
    handler: async ({ project_id }: { project_id: number | string }) => {
      return client.get<TaigaProject>(`/projects/${project_id}`);
    },
  },
  {
    name: "create_project",
    description: "Create a new Taiga project",
    inputSchema: z.object({
      name: z.string().describe("Project name"),
      description: z.string().optional().describe("Project description"),
      is_private: z.boolean().optional().describe("true = private, false = public (default false)"),
      is_backlog_activated: z.boolean().optional().describe("Enable backlog module (default true)"),
      is_issues_activated: z.boolean().optional().describe("Enable issues module (default true)"),
      is_kanban_activated: z.boolean().optional().describe("Enable kanban module (default false)"),
      is_wiki_activated: z.boolean().optional().describe("Enable wiki module (default true)"),
    }),
    handler: async (fields: {
      name: string;
      description?: string;
      is_private?: boolean;
      is_backlog_activated?: boolean;
      is_issues_activated?: boolean;
      is_kanban_activated?: boolean;
      is_wiki_activated?: boolean;
    }) => {
      const result = await client.post<TaigaProject>("/projects", fields);
      return {
        id: result.id,
        slug: result.slug,
        name: result.name,
        description: result.description,
        is_private: result.is_private,
        total_milestones: result.total_milestones,
        total_fans: result.total_fans,
      };
    },
  },
  {
    name: "update_project",
    description: "Update a Taiga project's settings (name, description, visibility, etc.)",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
      name: z.string().optional().describe("New project name"),
      description: z.string().optional().describe("New project description"),
      is_private: z.boolean().optional().describe("true = private, false = public"),
      is_backlog_activated: z.boolean().optional().describe("Enable/disable backlog module"),
      is_issues_activated: z.boolean().optional().describe("Enable/disable issues module"),
      is_kanban_activated: z.boolean().optional().describe("Enable/disable kanban module"),
      is_wiki_activated: z.boolean().optional().describe("Enable/disable wiki module"),
    }),
    handler: async ({ project_id, ...fields }: {
      project_id: number;
      name?: string;
      description?: string;
      is_private?: boolean;
      is_backlog_activated?: boolean;
      is_issues_activated?: boolean;
      is_kanban_activated?: boolean;
      is_wiki_activated?: boolean;
    }) => {
      const result = await client.patch<TaigaProject>(`/projects/${project_id}`, fields);
      return {
        id: result.id,
        slug: result.slug,
        name: result.name,
        description: result.description,
        is_private: result.is_private,
        total_milestones: result.total_milestones,
        total_fans: result.total_fans,
      };
    },
  },
];

interface TaigaProject {
  id: number;
  slug: string;
  name: string;
  description: string;
  is_private: boolean;
  total_milestones: number;
  total_fans: number;
}
