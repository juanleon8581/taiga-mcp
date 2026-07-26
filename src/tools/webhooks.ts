import { z } from "zod";
import type { TaigaClient } from "../client.js";

interface TaigaWebhook {
  id: number;
  project: number;
  name: string;
  url: string;
  key: string;
  logs_counter: number;
}

interface TaigaWebhookLog {
  id: number;
  webhook: number;
  url: string;
  status: number;
  duration: number;
  request: { data: unknown; headers: Record<string, string> };
  response: { data: unknown; headers: Record<string, string> };
  created: string;
}

function fmtWebhook(w: TaigaWebhook) {
  return {
    id: w.id,
    project_id: w.project,
    name: w.name,
    url: w.url,
    key: w.key,
    logs_counter: w.logs_counter,
  };
}

export const webhooksTools = (client: TaigaClient) => [
  {
    name: "list_webhooks",
    description: "List all webhooks for a Taiga project",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
    }),
    handler: async ({ project_id }: { project_id: number }) => {
      const webhooks = await client.get<TaigaWebhook[]>(`/webhooks?project=${project_id}`);
      return webhooks.map(fmtWebhook);
    },
  },
  {
    name: "create_webhook",
    description: "Create a webhook for a Taiga project",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
      name: z.string().describe("Webhook name"),
      url: z.string().url().describe("Target URL to receive POST requests"),
      key: z.string().describe("Secret key used for HMAC-SHA1 payload signing"),
    }),
    handler: async (fields: { project_id: number; name: string; url: string; key: string }) => {
      const result = await client.post<TaigaWebhook>("/webhooks", {
        project: fields.project_id,
        name: fields.name,
        url: fields.url,
        key: fields.key,
      });
      return fmtWebhook(result);
    },
  },
  {
    name: "get_webhook",
    description: "Get details of a specific Taiga webhook",
    inputSchema: z.object({
      webhook_id: z.number().describe("Webhook numeric ID"),
    }),
    handler: async ({ webhook_id }: { webhook_id: number }) => {
      const result = await client.get<TaigaWebhook>(`/webhooks/${webhook_id}`);
      return fmtWebhook(result);
    },
  },
  {
    name: "update_webhook",
    description: "Update a Taiga webhook (name, url, or secret key)",
    inputSchema: z.object({
      webhook_id: z.number().describe("Webhook numeric ID"),
      name: z.string().optional().describe("New webhook name"),
      url: z.string().url().optional().describe("New target URL"),
      key: z.string().optional().describe("New secret key"),
    }),
    handler: async ({ webhook_id, ...fields }: { webhook_id: number; name?: string; url?: string; key?: string }) => {
      const result = await client.patch<TaigaWebhook>(`/webhooks/${webhook_id}`, fields);
      return fmtWebhook(result);
    },
  },
  {
    name: "delete_webhook",
    description: "Delete a Taiga webhook",
    inputSchema: z.object({
      webhook_id: z.number().describe("Webhook numeric ID"),
    }),
    handler: async ({ webhook_id }: { webhook_id: number }) => {
      await client.delete(`/webhooks/${webhook_id}`);
      return { deleted: true, webhook_id };
    },
  },
  {
    name: "test_webhook",
    description: "Send a test payload to a Taiga webhook URL",
    inputSchema: z.object({
      webhook_id: z.number().describe("Webhook numeric ID"),
    }),
    handler: async ({ webhook_id }: { webhook_id: number }) => {
      const result = await client.post<TaigaWebhookLog>(`/webhooks/${webhook_id}/test`, {});
      return {
        id: result.id,
        url: result.url,
        status: result.status,
        duration: result.duration,
        created: result.created,
      };
    },
  },
  {
    name: "list_webhook_logs",
    description: "List execution logs for a Taiga webhook",
    inputSchema: z.object({
      webhook_id: z.number().describe("Webhook numeric ID"),
    }),
    handler: async ({ webhook_id }: { webhook_id: number }) => {
      const logs = await client.get<TaigaWebhookLog[]>(`/webhooklogs?webhook=${webhook_id}`);
      return logs.map((l) => ({
        id: l.id,
        url: l.url,
        status: l.status,
        duration: l.duration,
        created: l.created,
      }));
    },
  },
];
