import { getSettings } from "@shared/services/storage-service/settings";

export interface SupabaseSessionRecord {
    session_id: string;
    runtime_mode: string;
    current_block_index: number;
    playback_position: number;
    timeline_snapshot: unknown;
    saved_at: string;
}

function isSupabaseConfigured(): boolean {
    const settings = getSettings();
    return Boolean(settings.supabaseUrl && settings.supabaseAnonKey);
}

function getHeaders() {
    const settings = getSettings();
    return {
        "Content-Type": "application/json",
        apikey: settings.supabaseAnonKey,
        Authorization: `Bearer ${settings.supabaseAnonKey}`,
    };
}

export async function upsertSessionRecord(record: SupabaseSessionRecord): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const settings = getSettings();
    const baseUrl = settings.supabaseUrl.replace(/\/$/, "");
    const endpoint = `${baseUrl}/rest/v1/agent_sessions?on_conflict=session_id`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            ...getHeaders(),
            Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(record),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`SUPABASE_UPSERT_FAILED: ${response.status} ${text.slice(0, 200)}`);
    }
}

export async function listRecentSessionRecords(limit = 5): Promise<SupabaseSessionRecord[]> {
    if (!isSupabaseConfigured()) return [];

    const settings = getSettings();
    const baseUrl = settings.supabaseUrl.replace(/\/$/, "");
    const endpoint = `${baseUrl}/rest/v1/agent_sessions?select=session_id,runtime_mode,current_block_index,playback_position,timeline_snapshot,saved_at&order=saved_at.desc&limit=${limit}`;

    const response = await fetch(endpoint, {
        method: "GET",
        headers: getHeaders(),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`SUPABASE_QUERY_FAILED: ${response.status} ${text.slice(0, 200)}`);
    }

    return response.json();
}
