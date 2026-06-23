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
