use async_trait::async_trait;
use anyhow::Result;
use crate::domain::entities::incident::Incident;

#[async_trait]
pub trait IncidentCachePort: Send + Sync {
    async fn get(&self, key: &str) -> Result<Option<Incident>>;
    async fn set(&self, key: &str, incident: &Incident, ttl_secs: Option<u64>) -> Result<()>;
    async fn del(&self, key: &str) -> Result<()>;
    async fn list(&self, prefix: Option<&str>, limit: Option<u64>) -> Result<Vec<(String, Incident)>>;
}
