import { z } from "zod";
import type { TaigaClient } from "../client.js";

export const rolesTools = (client: TaigaClient) => [
  {
    name: "list_roles",
    description: "List all roles defined in a Taiga project (needed for assigning story points per role)",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
    }),
    handler: async ({ project_id }: { project_id: number }) => {
      const roles = await client.get<TaigaRole[]>(`/roles?project=${project_id}`);
      return roles.map(formatRole);
    },
  },
  {
    name: "get_role",
    description: "Get details of a specific role including its permissions",
    inputSchema: z.object({
      role_id: z.number().describe("Role numeric ID"),
    }),
    handler: async ({ role_id }: { role_id: number }) => {
      return formatRole(await client.get<TaigaRole>(`/roles/${role_id}`));
    },
  },
  {
    name: "create_role",
    description: "Create a new role in a Taiga project",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
      name: z.string().describe("Role name"),
      order: z.number().optional().describe("Display order (lower = first)"),
      computable: z.boolean().optional().describe("Whether this role can have story point estimations"),
      permissions: z.array(z.string()).optional().describe("Permission slugs (e.g. view_us, add_issue, modify_task)"),
    }),
    handler: async ({ project_id, ...fields }: {
      project_id: number;
      name: string;
      order?: number;
      computable?: boolean;
      permissions?: string[];
    }) => {
      return formatRole(await client.post<TaigaRole>("/roles", { project: project_id, ...fields }));
    },
  },
  {
    name: "update_role",
    description: "Update an existing role (name, order, permissions, computability)",
    inputSchema: z.object({
      role_id: z.number().describe("Role numeric ID"),
      name: z.string().optional().describe("New role name"),
      order: z.number().optional().describe("Display order"),
      computable: z.boolean().optional().describe("Whether this role can have story point estimations"),
      permissions: z.array(z.string()).optional().describe("Full replacement list of permission slugs"),
    }),
    handler: async ({ role_id, ...fields }: {
      role_id: number;
      name?: string;
      order?: number;
      computable?: boolean;
      permissions?: string[];
    }) => {
      return formatRole(await client.patch<TaigaRole>(`/roles/${role_id}`, fields));
    },
  },
  {
    name: "delete_role",
    description: "Delete a role from a project. Cannot be undone.",
    inputSchema: z.object({
      role_id: z.number().describe("Role numeric ID"),
    }),
    handler: async ({ role_id }: { role_id: number }) => {
      await client.delete(`/roles/${role_id}`);
      return { deleted: true, role_id };
    },
  },
  {
    name: "list_tags",
    description: "List all tags used in a Taiga project with their colors",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
    }),
    handler: async ({ project_id }: { project_id: number }) => {
      const tagsColors = await client.get<Record<string, string>>(`/projects/${project_id}/tags_colors`);
      return Object.entries(tagsColors).map(([name, color]) => ({ name, color }));
    },
  },
  {
    name: "get_milestone_stats",
    description: "Get progress statistics for a sprint/milestone (points done, remaining, burndown data)",
    inputSchema: z.object({
      milestone_id: z.number().describe("Milestone/sprint numeric ID"),
    }),
    handler: async ({ milestone_id }: { milestone_id: number }) => {
      return client.get<TaigaMilestoneStats>(`/milestones/${milestone_id}/stats`);
    },
  },
];

function formatRole(r: TaigaRole) {
  return {
    id: r.id,
    name: r.name,
    order: r.order,
    computable: r.computable,
    permissions: r.permissions,
  };
}

interface TaigaRole {
  id: number;
  name: string;
  order: number;
  computable: boolean;
  permissions: string[];
}

interface TaigaMilestoneStats {
  name: string;
  estimated_start: string;
  estimated_finish: string;
  total_points: Record<string, number>;
  completed_points: Record<string, number> | number[];
  total_userstories: number;
  completed_userstories: number;
  total_tasks: number;
  completed_tasks: number;
  iocaine_doses: number;
  days: { day: string; name: number; open_points: number; optimal_points: number }[];
}
