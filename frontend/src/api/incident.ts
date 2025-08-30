import { Incident, ListResponse } from "../types/incident";
import { api } from "./client";

export const createIncident = (incident: Incident) =>
    api.post<{ incident: Incident }>("/incidents", incident);

export const listIncidents = (prefix?: string, limit?: number) => {
    const qs = new URLSearchParams();
    if (prefix) qs.set("prefix", prefix);
    if (limit) qs.set("limit", String(limit));
    const q = qs.toString() ? `?${qs.toString()}` : "";
    return api.get<ListResponse>(`/incidents${q}`);
};

export const getIncident = (key: string) =>
    api.get<Incident>(`/incidents/${encodeURIComponent(key)}`);
