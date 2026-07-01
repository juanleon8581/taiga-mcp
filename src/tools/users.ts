import { z } from "zod";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { TaigaClient } from "../client.js";

const execFileAsync = promisify(execFile);

const TAIGA_CONTAINER = "taiga-taiga-back-1";

export const usersTools = (_client: TaigaClient) => [
  {
    name: "create_user",
    description: "Create a new user account in Taiga via Django shell (requires docker access to taiga-taiga-back-1)",
    inputSchema: z.object({
      username: z.string().describe("Unique username"),
      email: z.string().email().describe("User email address"),
      full_name: z.string().describe("User's full name"),
      password: z.string().describe("User password"),
      lang: z.string().optional().describe("Language code (e.g. 'en', 'es')"),
      timezone: z.string().optional().describe("Timezone (e.g. 'America/Bogota')"),
    }),
    handler: async (args: {
      username: string;
      email: string;
      full_name: string;
      password: string;
      lang?: string;
      timezone?: string;
    }) => {
      const lang = args.lang ?? "es";
      const timezone = args.timezone ?? "America/Bogota";

      const script = `
import json, sys
from django.contrib.auth import get_user_model
User = get_user_model()
if User.objects.filter(username=${JSON.stringify(args.username)}).exists():
    print(json.dumps({"error": "username already exists"}))
    sys.exit(0)
if User.objects.filter(email=${JSON.stringify(args.email)}).exists():
    print(json.dumps({"error": "email already exists"}))
    sys.exit(0)
u = User.objects.create_user(
    username=${JSON.stringify(args.username)},
    email=${JSON.stringify(args.email)},
    full_name=${JSON.stringify(args.full_name)},
    password=${JSON.stringify(args.password)},
)
u.lang = ${JSON.stringify(lang)}
u.timezone = ${JSON.stringify(timezone)}
u.is_active = True
u.save()
print(json.dumps({"id": u.id, "username": u.username, "full_name": u.full_name, "email": u.email, "lang": u.lang, "timezone": u.timezone, "is_active": u.is_active, "date_joined": str(u.date_joined)}))
`.trim();

      const { stdout, stderr } = await execFileAsync("docker", [
        "exec", TAIGA_CONTAINER,
        "python", "manage.py", "shell", "-c", script,
      ]);

      if (stderr) {
        const lines = stderr.trim().split("\n").filter(l => !l.startsWith("Python") && !l.includes("shell"));
        if (lines.length > 0) throw new Error(lines.join("\n"));
      }

      const result = JSON.parse(stdout.trim()) as { error?: string } & Partial<TaigaUser>;
      if (result.error) throw new Error(result.error);
      return result as TaigaUser;
    },
  },
];

interface TaigaUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  bio: string;
  lang: string;
  timezone: string;
  is_active: boolean;
  date_joined: string;
}
