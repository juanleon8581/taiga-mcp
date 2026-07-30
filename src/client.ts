import type { Config } from "./config.js";

export class TaigaClient {
  private token: string | null = null;
  private refreshToken: string | null = null;
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;

  constructor(config: Config) {
    this.baseUrl = `${config.taigaUrl}/api/v1`;
    this.username = config.username;
    this.password = config.password;
  }

  async login(): Promise<void> {
    const res = await fetch(`${this.baseUrl}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "normal", username: this.username, password: this.password }),
    });
    if (!res.ok) throw new Error(`Auth failed: ${res.status} ${await res.text()}`);
    const data = (await res.json()) as { auth_token: string; refresh: string };
    this.token = data.auth_token;
    this.refreshToken = data.refresh;
  }

  private async refresh(): Promise<boolean> {
    if (!this.refreshToken) return false;
    const res = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: this.refreshToken }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { auth_token?: string; access?: string; refresh?: string };
    const newToken = data.auth_token ?? data.access;
    if (!newToken) return false;
    this.token = newToken;
    if (data.refresh) this.refreshToken = data.refresh;
    return true;
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.token) await this.login();

    const res = await this.doFetch(method, path, body);
    if (res.status !== 401) {
      if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status} ${await res.text()}`);
      return res.json() as Promise<T>;
    }

    // 401 — try refresh first, fall back to full re-login
    const refreshed = await this.refresh();
    if (!refreshed) await this.login();

    const retry = await this.doFetch(method, path, body);
    if (!retry.ok) throw new Error(`${method} ${path} failed: ${retry.status} ${await retry.text()}`);
    return retry.json() as Promise<T>;
  }

  private doFetch(method: string, path: string, body?: unknown): Promise<Response> {
    return fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  get<T>(path: string): Promise<T> { return this.request("GET", path); }
  post<T>(path: string, body: unknown): Promise<T> { return this.request("POST", path, body); }
  patch<T>(path: string, body: unknown): Promise<T> { return this.request("PATCH", path, body); }
  delete(path: string): Promise<void> { return this.request("DELETE", path); }

  async downloadFile(url: string): Promise<Buffer> {
    if (!this.token) await this.login();

    let res = await this.fetchBinary(url);
    if (res.status === 401) {
      const refreshed = await this.refresh();
      if (!refreshed) await this.login();
      res = await this.fetchBinary(url);
    }
    if (!res.ok) throw new Error(`GET ${url} failed: ${res.status} ${await res.text()}`);
    return Buffer.from(await res.arrayBuffer());
  }

  private fetchBinary(url: string): Promise<Response> {
    return fetch(url, { headers: { Authorization: `Bearer ${this.token}` } });
  }
}
