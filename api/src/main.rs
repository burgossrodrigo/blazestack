use std::sync::Arc;
use warp::{Filter, http::StatusCode, Reply};

use crate::domain::entities::incident::Incident;
use crate::domain::ports::incident_cache::IncidentCachePort;
use crate::infra::handler::incident::{
    post_incident_handler, get_incident_handler, list_incidents_handler,
    with_cache, ListQuery,
};
use crate::infra::redis::incident_cache::RedisIncidentCache;
use deadpool_redis::{Config, Runtime};
use tracing_subscriber::{fmt, EnvFilter};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    fmt().with_env_filter(EnvFilter::from_default_env()).init();

    let url = std::env::var("REDIS_URL").expect("REDIS_URL not set");
    let pool = Config::from_url(url)
        .create_pool(Some(Runtime::Tokio1))
        .expect("failed to create redis pool");

    let cache: Arc<dyn IncidentCachePort> = Arc::new(RedisIncidentCache::new(pool));

    let post_route = warp::path("incidents")
        .and(warp::post())
        .and(warp::body::json::<Incident>())
        .and(with_cache(cache.clone()))
        .and_then(post_incident_handler);

    let list_route = warp::path("incidents")
        .and(warp::get())
        .and(warp::query::<ListQuery>())
        .and(with_cache(cache.clone()))
        .and_then(list_incidents_handler);

    let get_one_route = warp::path!("incidents" / String)
        .and(warp::get())
        .and(with_cache(cache))
        .and_then(get_incident_handler);

    let health = warp::path!("healthz")
        .and(warp::get())
        .map(|| warp::reply::with_status("ok", StatusCode::OK));

    let routes = post_route
        .or(list_route)
        .or(get_one_route)
        .or(health)
        .recover(handle_rejection);

    warp::serve(routes).run(([0, 0, 0, 0], 3030)).await;
}

async fn handle_rejection(err: warp::Rejection)
    -> Result<impl warp::Reply, std::convert::Infallible>
{
    use serde_json::json;

    let (code, msg) = if err.is_not_found() {
        (StatusCode::NOT_FOUND, "not found")
    } else if let Some(_) = err.find::<warp::filters::body::BodyDeserializeError>() {
        (StatusCode::BAD_REQUEST, "invalid json")
    } else if let Some(_) = err.find::<warp::reject::MethodNotAllowed>() {
        (StatusCode::METHOD_NOT_ALLOWED, "method not allowed")
    } else {
        (StatusCode::INTERNAL_SERVER_ERROR, "internal error")
    };

    let body = warp::reply::json(&json!({ "error": msg }));
    Ok(warp::reply::with_status(body, code))
}
