use std::{convert::Infallible, sync::Arc};
use warp::{Filter, Reply, Rejection, http::StatusCode};
use serde::Deserialize;

use crate::domain::entities::incident::Incident;
use crate::domain::ports::incident_cache::IncidentCachePort;
use crate::domain::use_case::post_incident::{PostIncidentInputType, PostIncidentUseCaseType};
use crate::use_case::post_incident::PostIncidentUseCase;

pub fn with_cache(
    cache: Arc<dyn IncidentCachePort>,
) -> impl Filter<Extract = (Arc<dyn IncidentCachePort>,), Error = Infallible> + Clone {
    warp::any().map(move || cache.clone())
}

#[derive(Deserialize)]
pub struct ListQuery {
    pub prefix: Option<String>,
    pub limit: Option<u64>,
}

#[derive(serde::Serialize)]
struct ListResponse {
    items: Vec<ListItem>,
}

#[derive(serde::Serialize)]
struct ListItem {
    key: String,
    incident: Incident,
}

pub async fn post_incident_handler(
    incident: Incident,
    cache: Arc<dyn IncidentCachePort>,
) -> Result<impl Reply, Rejection> {
    let key = incident.title.to_lowercase();
    let _ = cache.set(&key, &incident, Some(3600)).await;

    let uc = PostIncidentUseCase::new(cache);
    let input = PostIncidentInputType { incident };
    let output = uc.execute(input).await;

    let body = warp::reply::json(&output);
    Ok(warp::reply::with_status(body, StatusCode::CREATED))
}

pub async fn get_incident_handler(
    key: String,
    cache: Arc<dyn IncidentCachePort>,
) -> Result<impl Reply, Rejection> {
    match cache.get(&key).await {
        Ok(Some(inc)) => {
            let body = warp::reply::json(&inc);
            Ok(warp::reply::with_status(body, StatusCode::OK))
        }
        Ok(None) => {
            let body = warp::reply::json(&serde_json::json!({"error":"not found"}));
            Ok(warp::reply::with_status(body, StatusCode::NOT_FOUND))
        }
        Err(e) => {
            let body = warp::reply::json(&serde_json::json!({"error": e.to_string()}));
            Ok(warp::reply::with_status(body, StatusCode::INTERNAL_SERVER_ERROR))
        }
    }
}

pub async fn list_incidents_handler(
    q: ListQuery,
    cache: Arc<dyn IncidentCachePort>,
) -> Result<impl Reply, Rejection> {
    match cache.list(q.prefix.as_deref(), q.limit).await {
        Ok(pairs) => {
            let items = pairs
                .into_iter()
                .map(|(key, incident)| ListItem { key, incident })
                .collect::<Vec<_>>();
            let body = warp::reply::json(&ListResponse { items });
            Ok(warp::reply::with_status(body, StatusCode::OK))
        }
        Err(e) => {
            let body = warp::reply::json(&serde_json::json!({"error": e.to_string()}));
            Ok(warp::reply::with_status(body, StatusCode::INTERNAL_SERVER_ERROR))
        }
    }
}
