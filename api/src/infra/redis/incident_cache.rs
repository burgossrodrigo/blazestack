use anyhow::Result;
use async_trait::async_trait;
use deadpool_redis::{redis::AsyncCommands, Pool};

use crate::domain::entities::incident::Incident;
use crate::domain::ports::incident_cache::IncidentCachePort;

pub struct RedisIncidentCache {
    pub(crate) pool: Pool,
    pub(crate) key_prefix: String,
}

impl RedisIncidentCache {
    pub fn new(pool: Pool) -> Self {
        Self { pool, key_prefix: "incident:".into() }
    }
    fn key(&self, k: &str) -> String { format!("{}{}", self.key_prefix, k) }
    fn strip_prefix<'a>(&self, full: &'a str) -> &'a str {
        full.strip_prefix(&self.key_prefix).unwrap_or(full)
    }
}

#[async_trait]
impl IncidentCachePort for RedisIncidentCache {
    async fn get(&self, key: &str) -> Result<Option<Incident>> {
        let mut conn = self.pool.get().await?;
        let raw: Option<String> = conn.get(self.key(key)).await?;
        Ok(match raw {
            Some(s) => Some(serde_json::from_str(&s)?),
            None => None,
        })
    }

    async fn set(&self, key: &str, incident: &Incident, ttl_secs: Option<u64>) -> Result<()> {
        let mut conn = self.pool.get().await?;
        let payload = serde_json::to_string(incident)?;
        let key = self.key(key);
        if let Some(ttl) = ttl_secs {
            conn.set_ex::<_, _, ()>(key, payload, ttl).await?;
        } else {
            conn.set::<_, _, ()>(key, payload).await?;
        }
        Ok(())
    }

    async fn del(&self, key: &str) -> Result<()> {
        let mut conn = self.pool.get().await?;
        conn.del::<_, ()>(self.key(key)).await?;
        Ok(())
    }

    async fn list(&self, prefix: Option<&str>, limit: Option<u64>) -> Result<Vec<(String, Incident)>> {
        let mut conn = self.pool.get().await?;
        let user_prefix = prefix.unwrap_or_default();
        let pattern = format!("{}{}*", self.key_prefix, user_prefix);

        let keys: Vec<String> = conn.keys(pattern).await?;
        let cap = limit.unwrap_or(u64::MAX) as usize;

        let mut items = Vec::with_capacity(keys.len().min(cap));
        for k in keys.into_iter().take(cap) {
            let raw: Option<String> = conn.get(&k).await?;
            if let Some(s) = raw {
                let inc: Incident = serde_json::from_str(&s)?;
                let user_key = self.strip_prefix(&k).to_string();
                items.push((user_key, inc));
            }
        }
        Ok(items)
    }
}
