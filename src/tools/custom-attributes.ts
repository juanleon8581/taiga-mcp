import { z } from "zod";
import type { TaigaClient } from "../client.js";

type EntityType = "task" | "userstory" | "issue" | "epic";

const ENTITY_MAP: Record<EntityType, { plural: string; defs: string }> = {
  task: { plural: "tasks", defs: "task-custom-attributes" },
  userstory: { plural: "userstories", defs: "userstory-custom-attributes" },
  issue: { plural: "issues", defs: "issue-custom-attributes" },
  epic: { plural: "epics", defs: "epic-custom-attributes" },
};

const entityTypeSchema = z.enum(["task", "userstory", "issue", "epic"]);

export const customAttributesTools = (client: TaigaClient) => [
  {
    name: "list_custom_attributes",
    description: "List custom attribute definitions for a project (id, name, type) for a given item type — use to find which attribute to read or set",
    inputSchema: z.object({
      entity_type: entityTypeSchema.describe("Type of item the custom attributes belong to"),
      project_id: z.number().describe("Project numeric ID"),
    }),
    handler: async ({ entity_type, project_id }: { entity_type: EntityType; project_id: number }) => {
      const { defs } = ENTITY_MAP[entity_type];
      const attrs = await client.get<CustomAttributeDef[]>(`/${defs}?project=${project_id}`);
      return attrs.map(formatDef);
    },
  },
  {
    name: "get_custom_attributes_values",
    description: "Get the current custom attribute values of a task/user story/issue/epic, joined with their definitions (name, type). Returns 'version', required by update_custom_attribute_value.",
    inputSchema: z.object({
      entity_type: entityTypeSchema,
      entity_id: z.number().describe("Numeric ID of the task/user story/issue/epic"),
    }),
    handler: async ({ entity_type, entity_id }: { entity_type: EntityType; entity_id: number }) => {
      const { plural, defs } = ENTITY_MAP[entity_type];
      const [entity, values] = await Promise.all([
        client.get<{ project: number }>(`/${plural}/${entity_id}`),
        client.get<CustomAttributesValues>(`/${plural}/custom-attributes-values/${entity_id}`),
      ]);
      const attrs = await client.get<CustomAttributeDef[]>(`/${defs}?project=${entity.project}`);
      return {
        version: values.version,
        values: attrs.map((a) => ({
          ...formatDef(a),
          value: values.attributes_values[String(a.id)] ?? null,
        })),
      };
    },
  },
  {
    name: "update_custom_attribute_value",
    description: "Set a single custom attribute value on a task/user story/issue/epic, by attribute name or ID. Fetch 'version' via get_custom_attributes_values first.",
    inputSchema: z.object({
      entity_type: entityTypeSchema,
      entity_id: z.number().describe("Numeric ID of the task/user story/issue/epic"),
      version: z.number().describe("Current version of the custom-attributes-values object (from get_custom_attributes_values)"),
      attribute: z.union([z.string(), z.number()]).describe("Custom attribute name (case-insensitive) or numeric ID"),
      value: z.unknown().describe("New value — string, number, boolean, or null depending on the attribute's type"),
    }),
    handler: async ({ entity_type, entity_id, version, attribute, value }: {
      entity_type: EntityType;
      entity_id: number;
      version: number;
      attribute: string | number;
      value: unknown;
    }) => {
      const { plural, defs } = ENTITY_MAP[entity_type];
      const attributeId = await resolveAttributeId(client, entity_type, entity_id, attribute, plural, defs);

      const current = await client.get<CustomAttributesValues>(`/${plural}/custom-attributes-values/${entity_id}`);
      const attributes_values = { ...current.attributes_values, [String(attributeId)]: value };
      const updated = await client.patch<CustomAttributesValues>(
        `/${plural}/custom-attributes-values/${entity_id}`,
        { version, attributes_values },
      );
      return { entity_type, entity_id, attribute_id: attributeId, value, version: updated.version };
    },
  },
];

async function resolveAttributeId(
  client: TaigaClient,
  entity_type: EntityType,
  entity_id: number,
  attribute: string | number,
  plural: string,
  defs: string,
): Promise<number> {
  if (typeof attribute === "number") return attribute;

  const entity = await client.get<{ project: number }>(`/${plural}/${entity_id}`);
  const attrs = await client.get<CustomAttributeDef[]>(`/${defs}?project=${entity.project}`);
  const match = attrs.find((a) => a.name.toLowerCase() === attribute.toLowerCase());
  if (!match) throw new Error(`Custom attribute "${attribute}" not found for this ${entity_type}`);
  return match.id;
}

function formatDef(a: CustomAttributeDef) {
  return { id: a.id, name: a.name, type: a.type, description: a.description, order: a.order };
}

interface CustomAttributeDef {
  id: number;
  name: string;
  description?: string;
  type: string;
  order?: number;
}

interface CustomAttributesValues {
  attributes_values: Record<string, unknown>;
  version: number;
}
