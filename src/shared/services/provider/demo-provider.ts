import { NetworkProvider, ProviderRequest } from "./types";

const DEMO_MODELS = ["demo-radio-v1", "demo-script-v1", "demo-lite-v1"];

function createJsonResponse(payload: unknown, status = 200): Response {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}

function getMockAiText(): string {
    return JSON.stringify({
        type: "host_talk",
        content: "欢迎来到 Demo 模式，这段内容由前端本地模拟生成。",
        music_keyword: "lofi",
    });
}

function buildMockAiPayload(url: string): unknown {
    if (url.includes("/chat/completions")) {
        return {
            choices: [{ message: { content: getMockAiText() } }],
        };
    }

    return {
        candidates: [{ content: { parts: [{ text: getMockAiText() }] } }],
    };
}

export function createDemoProvider(): NetworkProvider {
    return {
        async request(input: ProviderRequest): Promise<Response> {
            if (input.url.includes("/models")) {
                if (input.url.includes("openai") || input.url.includes("/v1/models")) {
                    return createJsonResponse({
                        data: DEMO_MODELS.map((id) => ({ id })),
                    });
                }

                return createJsonResponse({
                    models: DEMO_MODELS.map((name) => ({ name: `models/${name}` })),
                });
            }

            if (input.url.includes("generateContent") || input.url.includes("/chat/completions")) {
                return createJsonResponse(buildMockAiPayload(input.url));
            }

            return createJsonResponse(
                {
                    error: "Demo provider does not serve this endpoint",
                    detail: input.url,
                },
                503
            );
        },
    };
}
