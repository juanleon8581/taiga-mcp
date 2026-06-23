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
        username: m.user_extra_info?.username,
        full_name: m.user_extra_info?.full_name,
        email: m.user_extra_info?.email,
        role: m.role_name,
        is_active: m.is_user_active,
      }));
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
  role_name: string;
  is_user_active: boolean;
  user_extra_info?: {
    username: string;
    full_name: string;
    email: string;
  };
}
