import { z } from "zod";
import type { TaigaClient } from "../client.js";

export const issuesTools = (client: TaigaClient) => [
  {
    name: "list_issues",
    description: "List issues in a Taiga project",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
      status: z.string().optional().describe("Filter by status name"),
      assigned_to: z.number().optional().describe("Filter by assignee user ID"),
    }),
    handler: async ({ project_id, status, assigned_to }: { project_id: number; status?: string; assigned_to?: number }) => {
      const params = new URLSearchParams({ project: String(project_id) });
      if (status) params.set("status__is_closed", status === "closed" ? "true" : "false");
      if (assigned_to) params.set("assigned_to", String(assigned_to));
      const issues = await client.get<TaigaIssue[]>(`/issues?${params}`);
      return issues.map(formatIssue);
    },
  },
  {
    name: "get_issue",
    description: "Get a specific issue by ID",
    inputSchema: z.object({
      issue_id: z.number().describe("Issue numeric ID"),
    }),
    handler: async ({ issue_id }: { issue_id: number }) => {
      return formatIssue(await client.get<TaigaIssue>(`/issues/${issue_id}`));
    },
  },
  {
    name: "create_issue",
    description: "Create a new issue in a Taiga project",
    inputSchema: z.object({
      project_id: z.number().describe("Project numeric ID"),
      subject: z.string().describe("Issue title/subject"),
      description: z.string().optional().describe("Issue description (markdown)"),
      priority: z.number().optional().describe("Priority ID"),
      severity: z.number().optional().describe("Severity ID"),
      type: z.number().optional().describe("Issue type ID"),
      assigned_to: z.number().optional().describe("Assignee user ID"),
      tags: z.array(z.string()).optional().describe("List of tag strings"),
    }),
    handler: async (args: {
      project_id: number;
      subject: string;
      description?: string;
      priority?: number;
      severity?: number;
      type?: number;
      assigned_to?: number;
      tags?: string[];
    }) => {
      const { project_id, ...rest } = args;
      const issue = await client.post<TaigaIssue>("/issues", { project: project_id, ...rest });
      return formatIssue(issue);
    },
  },
  {
    name: "update_issue",
    description: "Update an existing issue (status, assignee, description, etc.)",
    inputSchema: z.object({
      issue_id: z.number().describe("Issue numeric ID"),
      version: z.number().describe("Current issue version (required by Taiga for optimistic locking)"),
      subject: z.string().optional(),
      description: z.string().optional(),
      status: z.number().optional().describe("Status ID"),
      assigned_to: z.number().optional().describe("Assignee user ID"),
      priority: z.number().optional(),
      severity: z.number().optional(),
      tags: z.array(z.string()).optional(),
    }),
    handler: async ({ issue_id, ...fields }: { issue_id: number; version: number; [key: string]: unknown }) => {
      return formatIssue(await client.patch<TaigaIssue>(`/issues/${issue_id}`, fields));
    },
  },
];

function formatIssue(i: TaigaIssue) {
  return {
    id: i.id,
    ref: i.ref,
    subject: i.subject,
    description: i.description,
    status: i.status_extra_info?.name,
    assigned_to: i.assigned_to_extra_info?.full_name,
    priority: i.priority_extra_info?.name,
    severity: i.severity_extra_info?.name,
    type: i.type_extra_info?.name,
    tags: i.tags,
    version: i.version,
    created_date: i.created_date,
    modified_date: i.modified_date,
  };
}

interface TaigaIssue {
  id: number;
  ref: number;
  subject: string;
  description: string;
  version: number;
  tags: string[];
  created_date: string;
  modified_date: string;
  status_extra_info?: { name: string };
  assigned_to_extra_info?: { full_name: string };
  priority_extra_info?: { name: string };
  severity_extra_info?: { name: string };
  type_extra_info?: { name: string };
}
