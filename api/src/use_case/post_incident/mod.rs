use std::sync::Arc;
use async_trait::async_trait;

use crate::domain::entities::incident::Incident;
use crate::domain::ports::incident_cache::IncidentCachePort;
use crate::domain::use_case::post_incident::{
    PostIncidentInputType, PostIncidentOutputType, PostIncidentUseCaseType,
};

pub struct PostIncidentUseCase {
    pub cache: Arc<dyn IncidentCachePort>,
}

impl PostIncidentUseCase {
    pub fn new(cache: Arc<dyn IncidentCachePort>) -> Self {
        Self { cache }
    }
}

#[async_trait]
impl PostIncidentUseCaseType for PostIncidentUseCase {
    type Input = PostIncidentInputType;
    type Output = PostIncidentOutputType;

    async fn execute(&self, input: Self::Input) -> Self::Output {
        let key = input.incident.title.to_lowercase();
        let _ = self.cache.set(&key, &input.incident, Some(3600)).await;
        PostIncidentOutputType { incident: input.incident }
    }
}
