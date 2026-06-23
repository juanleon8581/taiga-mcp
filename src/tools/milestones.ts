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
      return milestones.map(formatMilestone);
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
  {
    name: "create_milestone",
    description: "Create a new sprint/milestone in a Taiga project",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
      name: z.string().describe("Milestone name (e.g. 'Sprint 1')"),
      estimated_start: z.string().describe("Start date (YYYY-MM-DD)"),
      estimated_finish: z.string().describe("End date (YYYY-MM-DD)"),
      disponibility: z.number().optional().describe("Team availability percentage (0-100)"),
      slug: z.string().optional().describe("URL slug (auto-generated if omitted)"),
    }),
    handler: async ({ project_id, ...fields }: {
      project_id: number;
      name: string;
      estimated_start: string;
      estimated_finish: string;
      disponibility?: number;
      slug?: string;
    }) => {
      return formatMilestone(await client.post<TaigaMilestone>("/milestones", { project: project_id, ...fields }));
    },
  },
  {
    name: "update_milestone",
    description: "Update an existing sprint/milestone (name, dates, availability, close it)",
    inputSchema: z.object({
      milestone_id: z.number().describe("Milestone numeric ID"),
      name: z.string().optional().describe("New milestone name"),
      estimated_start: z.string().optional().describe("New start date (YYYY-MM-DD)"),
      estimated_finish: z.string().optional().describe("New end date (YYYY-MM-DD)"),
      disponibility: z.number().optional().describe("Team availability percentage (0-100)"),
      closed: z.boolean().optional().describe("true to close/finish the sprint"),
    }),
    handler: async ({ milestone_id, ...fields }: {
      milestone_id: number;
      name?: string;
      estimated_start?: string;
      estimated_finish?: string;
      disponibility?: number;
      closed?: boolean;
    }) => {
      return formatMilestone(await client.patch<TaigaMilestone>(`/milestones/${milestone_id}`, fields));
    },
  },
];

function formatMilestone(m: TaigaMilestone) {
  return {
    id: m.id,
    name: m.name,
    slug: m.slug,
    estimated_start: m.estimated_start,
    estimated_finish: m.estimated_finish,
    closed: m.closed,
    total_points: m.total_points,
    closed_points: m.closed_points,
  };
}

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
