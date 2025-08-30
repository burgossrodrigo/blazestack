use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub struct Incident {
    pub title: String,
    pub incident_type: IncidentType,
    pub description: Option<String>,
    pub location: Option<String>,
    pub image: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum IncidentType {
    Fire,
    Flood,
    Earthquake,
}
