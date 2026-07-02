import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./director-agent", () => ({
  directorAgent: {
    startShow: vi.fn(),
    pauseShow: vi.fn(),
    resumeShow: vi.fn(),
    stopShow: vi.fn(),
    skipToBlock: vi.fn(),
  },
}));

import { frontendOrchestrator } from "./frontend-orchestrator";
import { directorAgent } from "./director-agent";

describe("frontend orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ready state when start succeeds", async () => {
    vi.mocked(directorAgent.startShow).mockResolvedValueOnce(undefined);
    const result = await frontendOrchestrator.start();
    expect(result.success).toBe(true);
    expect(result.state.health).toBe("ready");
  });

  it("returns degraded state when start fails", async () => {
    vi.mocked(directorAgent.startShow).mockRejectedValueOnce(new Error("boom"));
    const result = await frontendOrchestrator.start();
    expect(result.success).toBe(false);
    expect(result.state.health).toBe("degraded");
  });
});
