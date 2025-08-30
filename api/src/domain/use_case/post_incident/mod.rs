use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use crate::domain::entities::incident::Incident;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostIncidentInputType {
    pub incident: Incident,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PostIncidentOutputType {
    pub incident: Incident,
}

#[async_trait]
pub trait PostIncidentUseCaseType: Send + Sync {
    type Input: Send;
    type Output: Send;
    async fn execute(&self, input: Self::Input) -> Self::Output;
}
