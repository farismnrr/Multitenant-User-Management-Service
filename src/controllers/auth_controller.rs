use crate::dtos::auth_dto::{LoginRequest, RegisterRequest};
use crate::dtos::response_dto::SuccessResponseDTO;
use crate::errors::AppError;
use crate::usecases::auth_usecase::AuthUseCase;
use actix_web::{cookie::{Cookie, SameSite}, web, HttpResponse, Responder};
use std::sync::Arc;

/// Register a new user
pub async fn register(
    usecase: web::Data<Arc<AuthUseCase>>,
    body: web::Json<RegisterRequest>,
) -> Result<impl Responder, AppError> {
    let auth_response = usecase.register(body.into_inner()).await?;
    
    Ok(HttpResponse::Created().json(SuccessResponseDTO::new(
        "User registered successfully",
        auth_response,
    )))
}

/// Authenticates a user and returns access token with refresh token cookie.
///
/// The refresh token is set as an HTTP-only cookie for security.
/// In production, ensure `secure` is set to `true` when using HTTPS.
pub async fn login(
    usecase: web::Data<Arc<AuthUseCase>>,
    body: web::Json<LoginRequest>,
) -> Result<impl Responder, AppError> {
    let (auth_response, refresh_token) = usecase.login(body.into_inner()).await?;
    
    let refresh_token_expiry = usecase.get_refresh_token_expiry();
    let cookie = Cookie::build("refresh_token", refresh_token)
        .path("/")
        .http_only(true)
        .secure(false)
        .same_site(SameSite::Strict)
        .max_age(actix_web::cookie::time::Duration::seconds(refresh_token_expiry))
        .finish();
    
    Ok(HttpResponse::Ok()
        .cookie(cookie)
        .json(SuccessResponseDTO::new(
            "Login successful",
            auth_response,
        )))
}

/// Logs out a user by clearing the refresh token cookie.
pub async fn logout() -> Result<impl Responder, AppError> {
    let cookie = Cookie::build("refresh_token", "")
        .path("/")
        .http_only(true)
        .secure(false)
        .same_site(SameSite::Strict)
        .max_age(actix_web::cookie::time::Duration::seconds(0))
        .finish();
    
    Ok(HttpResponse::Ok()
        .cookie(cookie)
        .json(SuccessResponseDTO::<()>::new(
            "Logout successful",
            (),
        )))
}
