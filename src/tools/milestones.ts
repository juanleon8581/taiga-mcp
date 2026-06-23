import { z } from "zod";
import type { TaigaClient } from "../client.js";

export const milestonesTools = (client: TaigaClient) => [
  {
    name: "list_milestones",
    description: "List sprints/milestones in a Taiga project",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
      closed: z.boolean().optional().describe("Filter closed milestones (default: all)"),
    }),
    handler: async ({ project_id, closed }: { project_id: number; closed?: boolean }) => {
      const params = new URLSearchParams({ project: String(project_id) });
      if (closed !== undefined) params.set("closed", String(closed));
      const milestones = await client.get<TaigaMilestone[]>(`/milestones?${params}`);
      return milestones.map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        estimated_start: m.estimated_start,
        estimated_finish: m.estimated_finish,
        closed: m.closed,
        total_points: m.total_points,
        closed_points: m.closed_points,
      }));
    },
  },
  {
    name: "get_milestone",
    description: "Get details of a specific sprint/milestone",
    inputSchema: z.object({
      milestone_id: z.number().describe("Milestone numeric ID"),
    }),
    handler: async ({ milestone_id }: { milestone_id: number }) => {
      return client.get<TaigaMilestone>(`/milestones/${milestone_id}`);
    },
  },
];

interface TaigaMilestone {
  id: number;
  name: string;
  slug: string;
  estimated_start: string;
  estimated_finish: string;
  closed: boolean;
  total_points: number;
  closed_points: number;
}
