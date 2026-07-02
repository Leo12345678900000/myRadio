import { directorAgent } from "./director-agent";

export type OrchestratorHealth = "ready" | "degraded" | "error";

export interface OrchestratorState {
    health: OrchestratorHealth;
    message: string;
}

export interface OrchestratorResult {
    success: boolean;
    state: OrchestratorState;
}

class FrontendOrchestrator {
    private state: OrchestratorState = {
        health: "ready",
        message: "System ready",
    };

    private setState(health: OrchestratorHealth, message: string): OrchestratorState {
        this.state = { health, message };
        return this.state;
    }

    getState(): OrchestratorState {
        return this.state;
    }

    async start(): Promise<OrchestratorResult> {
        try {
            await directorAgent.startShow({});
            return {
                success: true,
                state: this.setState("ready", "Playback running"),
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                state: this.setState("degraded", `Start failed, fallback active: ${message}`),
            };
        }
    }

    resume(): OrchestratorResult {
        try {
            directorAgent.resumeShow();
            return {
                success: true,
                state: this.setState("ready", "Playback resumed"),
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                state: this.setState("error", `Resume failed: ${message}`),
            };
        }
    }

    pause(): OrchestratorResult {
        try {
            directorAgent.pauseShow();
            return {
                success: true,
                state: this.setState("ready", "Playback paused"),
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                state: this.setState("error", `Pause failed: ${message}`),
            };
        }
    }

    stop(): OrchestratorResult {
        try {
            directorAgent.stopShow();
            return {
                success: true,
                state: this.setState("ready", "Disconnected"),
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                state: this.setState("error", `Stop failed: ${message}`),
            };
        }
    }

    jumpToBlock(index: number): OrchestratorResult {
        try {
            directorAgent.skipToBlock(index);
            return {
                success: true,
                state: this.setState("ready", "Jumped to target block"),
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                state: this.setState("error", `Jump failed: ${message}`),
            };
        }
    }
}

export const frontendOrchestrator = new FrontendOrchestrator();
