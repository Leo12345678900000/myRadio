import { describe, expect, it, vi, beforeEach } from "vitest";
import { DEFAULT_SETTINGS, IApiSettings } from "@shared/services/storage-service/settings";
import { getNetworkProvider } from "./index";
import { createLiveProvider } from "./live-provider";
import { createOfficialBackendProvider } from "./official-backend-provider";

function makeSettings(overrides: Partial<IApiSettings> = {}): IApiSettings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}

describe("provider selector", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses demo provider in demo mode", async () => {
    const provider = getNetworkProvider(makeSettings({ runtimeMode: "demo" }));
    const response = await provider.request({
      url: "https://example.com/v1/models",
      method: "GET",
      headers: {},
    });

    expect(response.ok).toBe(true);
    const data = await response.json() as { data?: Array<{ id: string }> };
    expect(data.data?.length).toBeGreaterThan(0);
  });

  it("routes official provider to backend gateway", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const provider = createOfficialBackendProvider(
      makeSettings({
        backendRoute: "official",
        officialBackendUrl: "http://localhost:8000",
      })
    );

    await provider.request({
      url: "https://api.openai.com/v1/models",
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/api/gateway/fetch");
    expect(options.method).toBe("POST");
  });
});

describe("live provider fallback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to proxy when direct request fails for fallback hosts", async () => {
    const fetchMock = vi.spyOn(global, "fetch");
    fetchMock
      .mockRejectedValueOnce(new Error("direct failed"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      );

    const provider = createLiveProvider(makeSettings({ backendRoute: "direct" }));
    const response = await provider.request({
      url: "https://api.openai.com/v1/models",
      method: "GET",
      headers: { Accept: "application/json" },
    });

    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toBe("/api/proxy");
  });

  it("throws mapped error when direct and proxy both fail", async () => {
    const fetchMock = vi.spyOn(global, "fetch");
    fetchMock
      .mockRejectedValueOnce(new Error("direct failed"))
      .mockRejectedValueOnce(new Error("proxy failed"));

    const provider = createLiveProvider(makeSettings({ backendRoute: "direct" }));

    await expect(
      provider.request({
        url: "https://api.openai.com/v1/models",
        method: "GET",
        headers: { Accept: "application/json" },
      })
    ).rejects.toThrow("DIRECT_AND_PROXY_FAILED");
  });
});
