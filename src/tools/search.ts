import { z } from "zod";
import type { TaigaClient } from "../client.js";

export const searchTools = (client: TaigaClient) => [
  {
    name: "search",
    description: "Search across all content in a Taiga project (issues, user stories, tasks, wiki pages) by text",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
      query: z.string().describe("Search text"),
    }),
    handler: async ({ project_id, query }: { project_id: number; query: string }) => {
      const params = new URLSearchParams({ project: String(project_id), text: query });
      const result = await client.get<TaigaSearchResult>(`/search?${params}`);
      return {
        userstories: (result.userstories ?? []).map((i) => ({
          id: i.id,
          ref: i.ref,
          subject: i.subject,
          type: "userstory",
        })),
        issues: (result.issues ?? []).map((i) => ({
          id: i.id,
          ref: i.ref,
          subject: i.subject,
          type: "issue",
        })),
        tasks: (result.tasks ?? []).map((i) => ({
          id: i.id,
          ref: i.ref,
          subject: i.subject,
          type: "task",
        })),
        epics: (result.epics ?? []).map((i) => ({
          id: i.id,
          ref: i.ref,
          subject: i.subject,
          type: "epic",
        })),
        wikipages: (result.wikipages ?? []).map((p) => ({
          id: p.id,
          slug: p.slug,
          type: "wikipage",
        })),
        count: {
          userstories: result.userstories?.length ?? 0,
          issues: result.issues?.length ?? 0,
          tasks: result.tasks?.length ?? 0,
          epics: result.epics?.length ?? 0,
          wikipages: result.wikipages?.length ?? 0,
        },
      };
    },
  },
];

interface SearchItem {
  id: number;
  ref: number;
  subject: string;
}

interface WikiPage {
  id: number;
  slug: string;
}

interface TaigaSearchResult {
  userstories?: SearchItem[];
  issues?: SearchItem[];
  tasks?: SearchItem[];
  epics?: SearchItem[];
  wikipages?: WikiPage[];
}
