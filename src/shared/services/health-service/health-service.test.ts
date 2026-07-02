import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkOfficialBackendHealth,
  checkOllamaHealth,
  checkProxyHealth,
  checkSupabaseHealth,
} from "./index";
import { DEFAULT_SETTINGS, IApiSettings } from "@shared/services/storage-service/settings";

function makeSettings(overrides: Partial<IApiSettings> = {}): IApiSettings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}

describe("health service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("reports proxy ok on successful response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await checkProxyHealth();
    expect(result.status).toBe("ok");
  });

  it("reports official backend error when URL missing", async () => {
    const result = await checkOfficialBackendHealth(makeSettings({ officialBackendUrl: "" }));
    expect(result.status).toBe("error");
  });

  it("reports supabase config error without keys", async () => {
    const result = await checkSupabaseHealth(makeSettings({ supabaseUrl: "", supabaseAnonKey: "" }));
    expect(result.status).toBe("error");
    expect(result.message).toContain("not configured");
  });

  it("reports ollama disabled when provider is none", async () => {
    const result = await checkOllamaHealth(makeSettings({ openSourceLlmProvider: "none" }));
    expect(result.status).toBe("error");
  });
});
