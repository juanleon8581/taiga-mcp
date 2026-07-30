import { z } from "zod";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TaigaClient } from "../client.js";

const OBJECT_TYPE = z.enum(["issue", "userstory", "task", "epic", "wikipage"]);
type ObjectType = z.infer<typeof OBJECT_TYPE>;

const ENDPOINT_MAP: Record<ObjectType, string> = {
  issue: "issues",
  userstory: "userstories",
  task: "tasks",
  epic: "epics",
  wikipage: "wiki",
};

interface TaigaAttachment {
  id: number;
  project: number;
  object_id: number;
  owner: number;
  name: string;
  size: number;
  description: string;
  url: string;
  sha1: string;
  created_date: string;
}

export const attachmentsTools = (client: TaigaClient) => [
  {
    name: "list_attachments",
    description: "List attachments on a Taiga issue, user story, task, epic, or wiki page",
    inputSchema: z.object({
      object_type: OBJECT_TYPE.describe("Type of object the attachments belong to"),
      object_id: z.number().describe("Numeric ID of the object (issue, user story, task, epic, or wiki page)"),
      project_id: z.number().describe("Numeric ID of the project"),
    }),
    handler: async ({ object_type, object_id, project_id }: {
      object_type: ObjectType;
      object_id: number;
      project_id: number;
    }) => {
      const endpoint = ENDPOINT_MAP[object_type];
      const attachments = await client.get<TaigaAttachment[]>(
        `/${endpoint}/attachments?object_id=${object_id}&project=${project_id}`,
      );
      return attachments.map((a) => ({
        id: a.id,
        name: a.name,
        size: a.size,
        description: a.description || null,
        created_date: a.created_date,
      }));
    },
  },
  {
    name: "download_attachment",
    description: "Download a Taiga attachment's file to local disk and return the saved path",
    inputSchema: z.object({
      object_type: OBJECT_TYPE.describe("Type of object the attachment belongs to"),
      attachment_id: z.number().describe("Numeric ID of the attachment"),
      dest_path: z.string().optional().describe(
        "Absolute file path to save the download to. Defaults to a temp directory using the attachment's original filename.",
      ),
    }),
    handler: async ({ object_type, attachment_id, dest_path }: {
      object_type: ObjectType;
      attachment_id: number;
      dest_path?: string;
    }) => {
      const endpoint = ENDPOINT_MAP[object_type];
      const attachment = await client.get<TaigaAttachment>(`/${endpoint}/attachments/${attachment_id}`);
      const buffer = await client.downloadFile(attachment.url);
      const path = dest_path ?? join(tmpdir(), attachment.name);
      await writeFile(path, buffer);
      return { id: attachment.id, name: attachment.name, size: attachment.size, saved_to: path };
    },
  },
];
