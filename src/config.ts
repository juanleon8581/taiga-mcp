export interface Config {
  taigaUrl: string;
  username: string;
  password: string;
}

export function loadConfig(): Config {
  const taigaUrl = process.env.TAIGA_URL?.replace(/\/$/, "");
  const username = process.env.TAIGA_USERNAME;
  const password = process.env.TAIGA_PASSWORD;

  if (!taigaUrl) throw new Error("TAIGA_URL env var is required");
  if (!username) throw new Error("TAIGA_USERNAME env var is required");
  if (!password) throw new Error("TAIGA_PASSWORD env var is required");

  return { taigaUrl, username, password };
}
