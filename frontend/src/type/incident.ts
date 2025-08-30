export type IncidentType = "fire" | "flood" | "earthquake";

export interface Incident {
    title: string;
    incident_type: IncidentType;
    description?: string | null;
    location?: string | null;
    image?: string | null;
}

export interface ListItem {
    key: string;
    incident: Incident;
}

export interface ListResponse {
    items: ListItem[];
}
