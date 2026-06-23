import { z } from "zod";
import type { TaigaClient } from "../client.js";

export const wikiTools = (client: TaigaClient) => [
  {
    name: "list_wiki_pages",
    description: "List all wiki pages in a Taiga project",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
    }),
    handler: async ({ project_id }: { project_id: number }) => {
      const pages = await client.get<TaigaWikiPage[]>(`/wiki?project=${project_id}`);
      return pages.map((p) => ({
        id: p.id,
        slug: p.slug,
        project: p.project,
        last_modifier: p.last_modifier,
        modified_date: p.modified_date,
      }));
    },
  },
  {
    name: "get_wiki_page",
    description: "Get the full content of a wiki page by ID",
    inputSchema: z.object({
      wiki_id: z.number().describe("Wiki page numeric ID"),
    }),
    handler: async ({ wiki_id }: { wiki_id: number }) => {
      const page = await client.get<TaigaWikiPage>(`/wiki/${wiki_id}`);
      return {
        id: page.id,
        slug: page.slug,
        content: page.content,
        project: page.project,
        version: page.version,
        last_modifier: page.last_modifier,
        modified_date: page.modified_date,
      };
    },
  },
  {
    name: "create_wiki_page",
    description: "Create a new wiki page in a Taiga project",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
      slug: z.string().describe("URL-friendly page identifier (e.g. 'getting-started')"),
      content: z.string().describe("Page content in markdown"),
    }),
    handler: async ({ project_id, slug, content }: { project_id: number; slug: string; content: string }) => {
      const page = await client.post<TaigaWikiPage>("/wiki", { project: project_id, slug, content });
      return { id: page.id, slug: page.slug, version: page.version };
    },
  },
  {
    name: "update_wiki_page",
    description: "Update the content of an existing wiki page",
    inputSchema: z.object({
      wiki_id: z.number().describe("Wiki page numeric ID"),
      version: z.number().describe("Current version for optimistic locking"),
      content: z.string().describe("New page content in markdown"),
      slug: z.string().optional().describe("New slug (rename the page)"),
    }),
    handler: async ({ wiki_id, ...fields }: { wiki_id: number; version: number; content: string; slug?: string }) => {
      const page = await client.patch<TaigaWikiPage>(`/wiki/${wiki_id}`, fields);
      return { id: page.id, slug: page.slug, version: page.version, modified_date: page.modified_date };
    },
  },
  {
    name: "delete_wiki_page",
    description: "Delete a wiki page permanently",
    inputSchema: z.object({
      wiki_id: z.number().describe("Wiki page numeric ID"),
    }),
    handler: async ({ wiki_id }: { wiki_id: number }) => {
      await client.delete(`/wiki/${wiki_id}`);
      return { deleted: true, wiki_id };
    },
  },
];

interface TaigaWikiPage {
  id: number;
  slug: string;
  content: string;
  project: number;
  version: number;
  last_modifier: number | null;
  modified_date: string;
}
