//! Rate Limiting Middleware
//!
//! This middleware implements IP-based rate limiting with automatic blocking.
//! It tracks request counts per IP address within a time window and blocks IPs
//! that exceed the limit for a configured duration.

use actix_web::{
    body::EitherBody,
    dev::{Service, ServiceRequest, ServiceResponse, Transform},
    http::header,
    Error, HttpResponse,
};
use futures_util::future::{ok, Ready, LocalBoxFuture};
use log::{debug, warn};
use std::collections::HashMap;
use std::sync::Arc;
use std::rc::Rc;
use tokio::sync::Mutex;
use chrono::{DateTime, Utc, Duration};
use crate::dtos::response_dto::ErrorResponseDTO;

/// Entry tracking request count and window start time for an IP address.
#[derive(Clone)]
struct RateLimitEntry {
    count: u32,
    window_start: DateTime<Utc>,
}

/// Entry tracking blocked status and expiration time for an IP address.
#[derive(Clone)]
struct BlockedEntry {
    blocked_until: DateTime<Utc>,
}

/// Rate limiting middleware configuration.
///
/// This middleware reads configuration from environment variables:
/// - `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window (default: 5)
/// - `RATE_LIMIT_WINDOW_SECS`: Time window in seconds (default: 900)
/// - `RATE_LIMIT_BLOCK_DURATION_SECS`: Block duration in seconds (default: 1800)
#[derive(Clone)]
pub struct RateLimiterMiddleware {
    max_requests: u32,
    window_secs: i64,
    block_duration_secs: i64,
}

impl RateLimiterMiddleware {
    pub fn new() -> Self {
        let max_requests = std::env::var("RATE_LIMIT_MAX_REQUESTS")
            .unwrap_or_else(|_| "5".to_string())
            .parse::<u32>()
            .unwrap_or(5);

        let window_secs = std::env::var("RATE_LIMIT_WINDOW_SECS")
            .unwrap_or_else(|_| "900".to_string())
            .parse::<i64>()
            .unwrap_or(900);

        let block_duration_secs = std::env::var("RATE_LIMIT_BLOCK_DURATION_SECS")
            .unwrap_or_else(|_| "1800".to_string())
            .parse::<i64>()
            .unwrap_or(1800);

        debug!(
            "[Middleware | RateLimiter] Initialized with max_requests={}, window_secs={}, block_duration_secs={}",
            max_requests, window_secs, block_duration_secs
        );

        Self {
            max_requests,
            window_secs,
            block_duration_secs,
        }
    }
}

impl Default for RateLimiterMiddleware {
    fn default() -> Self {
        Self::new()
    }
}

/// Service implementation for rate limiting.
pub struct RateLimiterMiddlewareService<S> {
    service: Rc<S>,
    rate_limits: Arc<Mutex<HashMap<String, RateLimitEntry>>>,
    blocked_ips: Arc<Mutex<HashMap<String, BlockedEntry>>>,
    max_requests: u32,
    window_secs: i64,
    block_duration_secs: i64,
}

impl<S, B> Transform<S, ServiceRequest> for RateLimiterMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type InitError = ();
    type Transform = RateLimiterMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(RateLimiterMiddlewareService {
            service: Rc::new(service),
            rate_limits: Arc::new(Mutex::new(HashMap::new())),
            blocked_ips: Arc::new(Mutex::new(HashMap::new())),
            max_requests: self.max_requests,
            window_secs: self.window_secs,
            block_duration_secs: self.block_duration_secs,
        })
    }
}

impl<S, B> Service<ServiceRequest> for RateLimiterMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = LocalBoxFuture<'static, Result<Self::Response, Self::Error>>;

    fn poll_ready(&self, ctx: &mut std::task::Context<'_>) -> std::task::Poll<Result<(), Self::Error>> {
        self.service.poll_ready(ctx)
    }

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let rate_limits = self.rate_limits.clone();
        let blocked_ips = self.blocked_ips.clone();
        let max_requests = self.max_requests;
        let window_secs = self.window_secs;
        let block_duration_secs = self.block_duration_secs;
        let service = Rc::clone(&self.service);

        let client_ip = req
            .connection_info()
            .realip_remote_addr()
            .unwrap_or("unknown")
            .to_string();

        let path = req.path().to_string();
        debug!("[Middleware | RateLimiter] Request from IP: {} to path: {}", client_ip, path);

        Box::pin(async move {
            let now = Utc::now();

            {
                let mut blocked = blocked_ips.lock().await;
                if let Some(entry) = blocked.get(&client_ip) {
                    if now < entry.blocked_until {
                        let remaining_secs = (entry.blocked_until - now).num_seconds();
                        warn!(
                            "[Middleware | RateLimiter] Blocked IP {} attempted access. Remaining: {}s",
                            client_ip, remaining_secs
                        );
                        let res = HttpResponse::Forbidden()
                            .insert_header((header::CONTENT_TYPE, "application/json"))
                            .json(ErrorResponseDTO {
                                success: false,
                                message: "IP address temporarily blocked due to rate limit violation",
                                details: Some(format!("Try again in {} seconds", remaining_secs)),
                                result: None,
                            });
                        return Ok(req.into_response(res.map_into_right_body()));
                    } else {
                        debug!("[Middleware | RateLimiter] Block expired for IP: {}", client_ip);
                        blocked.remove(&client_ip);
                    }
                }
            }

            {
                let mut limits = rate_limits.lock().await;
                
                let entry = limits.entry(client_ip.clone()).or_insert_with(|| {
                    debug!("[Middleware | RateLimiter] New IP tracked: {}", client_ip);
                    RateLimitEntry {
                        count: 0,
                        window_start: now,
                    }
                });

                let window_duration = Duration::seconds(window_secs);
                if now - entry.window_start > window_duration {
                    debug!("[Middleware | RateLimiter] Window reset for IP: {}", client_ip);
                    entry.count = 0;
                    entry.window_start = now;
                }

                entry.count += 1;
                debug!(
                    "[Middleware | RateLimiter] IP: {} - Request count: {}/{}",
                    client_ip, entry.count, max_requests
                );

                if entry.count > max_requests {
                    warn!(
                        "[Middleware | RateLimiter] Rate limit exceeded for IP: {}. Blocking for {}s",
                        client_ip, block_duration_secs
                    );
                    
                    let mut blocked = blocked_ips.lock().await;
                    blocked.insert(
                        client_ip.clone(),
                        BlockedEntry {
                            blocked_until: now + Duration::seconds(block_duration_secs),
                        },
                    );

                    entry.count = 0;
                    entry.window_start = now;

                    let res = HttpResponse::TooManyRequests()
                        .insert_header((header::CONTENT_TYPE, "application/json"))
                        .insert_header((header::RETRY_AFTER, block_duration_secs.to_string()))
                        .json(ErrorResponseDTO {
                            success: false,
                            message: "Rate limit exceeded",
                            details: Some(format!(
                                "Too many requests. IP blocked for {} seconds",
                                block_duration_secs
                            )),
                            result: None,
                        });
                    return Ok(req.into_response(res.map_into_right_body()));
                }
            }

            let fut = service.call(req);
            let res = fut.await?;
            Ok(res.map_into_left_body())
        })
    }
}
