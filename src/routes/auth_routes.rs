use crate::controllers::auth_controller::{login, logout, register};
use crate::middlewares::rate_limiter::RateLimiterMiddleware;
use actix_web::web;

/// Configures authentication routes with rate limiting.
///
/// # Routes
///
/// - `POST /auth/register` - Register a new user
/// - `POST /auth/login` - Authenticate and get tokens
/// - `POST /auth/logout` - Clear refresh token cookie
///
/// All routes are protected by rate limiting middleware to prevent brute force attacks.
pub fn configure_auth_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            .wrap(RateLimiterMiddleware::new())
            .route("/register", web::post().to(register))
            .route("/login", web::post().to(login))
            .route("/logout", web::post().to(logout)),
    );
}
