import { z } from "zod";
import type { TaigaClient } from "../client.js";

export const membersTools = (client: TaigaClient) => [
  {
    name: "get_me",
    description: "Get the currently authenticated Taiga user",
    inputSchema: z.object({}),
    handler: async () => {
      const user = await client.get<TaigaUser>("/users/me");
      return {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        photo: user.photo,
      };
    },
  },
  {
    name: "list_members",
    description: "List all members of a Taiga project with their user IDs (needed for assigning issues/tasks)",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
    }),
    handler: async ({ project_id }: { project_id: number }) => {
      const memberships = await client.get<TaigaMembership[]>(`/memberships?project=${project_id}`);
      return memberships.map((m) => ({
        user_id: m.user,
        full_name: m.full_name,
        email: m.email,
        role: m.role_name,
        is_active: m.is_user_active,
      }));
    },
  },
  {
    name: "add_member",
    description: "Add a user to a Taiga project by email. Optionally specify a role_id; defaults to the first role in the project.",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
      email: z.string().email().describe("Email of the user to add"),
      role_id: z.number().optional().describe("Role ID to assign (defaults to first project role)"),
    }),
    handler: async ({ project_id, email, role_id }: { project_id: number; email: string; role_id?: number }) => {
      let resolvedRoleId = role_id;
      if (!resolvedRoleId) {
        const roles = await client.get<TaigaRole[]>(`/roles?project=${project_id}`);
        if (!roles.length) throw new Error("No roles found for project");
        resolvedRoleId = roles[0].id;
      }
      const membership = await client.post<TaigaMembership>("/memberships", {
        project: project_id,
        role: resolvedRoleId,
        username: email,
      });
      return {
        user_id: membership.user,
        full_name: membership.full_name,
        email: membership.email,
        role: membership.role_name,
        is_active: membership.is_user_active,
      };
    },
  },
];

interface TaigaUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  photo: string | null;
}

interface TaigaMembership {
  user: number;
  full_name: string;
  email: string;
  role_name: string;
  is_user_active: boolean;
}

interface TaigaRole {
  id: number;
  name: string;
}
