const BASE = import.meta.env.VITE_API_BASE || "/api";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers || {}),
        },
        ...init,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg =
            typeof json?.error === "string" ? json.error : res.statusText;
        throw new Error(msg || "Request failed");
    }
    return json as T;
}

export const api = {
    get: <T>(p: string) => http<T>(p),
    post: <T>(p: string, body: unknown) =>
        http<T>(p, { method: "POST", body: JSON.stringify(body) }),
};
