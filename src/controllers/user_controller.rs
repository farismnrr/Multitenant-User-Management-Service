use crate::dtos::user_dto::UpdateUserRequest;
use crate::dtos::response_dto::{SuccessResponseDTO, IdResponse};
use crate::errors::AppError;
use crate::usecases::user_usecase::UserUseCase;
use crate::usecases::auth_usecase::AuthUseCase;
use actix_web::{web, HttpMessage, HttpRequest, HttpResponse, Responder};
use std::sync::Arc;

use crate::middlewares::api_key_middleware::TenantId;

// ...

pub async fn get_user(
    usecase: web::Data<Arc<UserUseCase>>,
    req: HttpRequest,
) -> Result<impl Responder, AppError> {
    let user_id = AuthUseCase::extract_user_id_from_request(&req)?;
    let tenant_id = req.extensions()
        .get::<TenantId>()
        .map(|id| id.0)
        .ok_or_else(|| AppError::Unauthorized("Tenant ID not found in request context".to_string()))?;

    let user = usecase.get_user(user_id, tenant_id).await?;

    Ok(HttpResponse::Ok().json(SuccessResponseDTO::new("User retrieved successfully", user)))
}

/// Get all users
pub async fn get_all_users(
    usecase: web::Data<Arc<UserUseCase>>,
    req: HttpRequest,
) -> Result<impl Responder, AppError> {
    let user_id = AuthUseCase::extract_user_id_from_request(&req)?;
    let tenant_id = req.extensions()
        .get::<TenantId>()
        .map(|id| id.0)
        .ok_or_else(|| AppError::Unauthorized("Tenant ID not found in request context".to_string()))?;

    // Check permissions by fetching current user's role
    let current_user = usecase.get_user(user_id, tenant_id).await?;
    
    let users = usecase.get_all_users(tenant_id, &current_user.role).await?;

    Ok(HttpResponse::Ok().json(SuccessResponseDTO::new("Users retrieved successfully", users)))
}

/// Update current user (from JWT)
pub async fn update_user(
    usecase: web::Data<Arc<UserUseCase>>,
    body: web::Json<UpdateUserRequest>,
    req: HttpRequest,
) -> Result<impl Responder, AppError> {
    let user_id = AuthUseCase::extract_user_id_from_request(&req)?;
    let tenant_id = req.extensions()
        .get::<TenantId>()
        .map(|id| id.0)
         .ok_or_else(|| AppError::Unauthorized("Tenant ID not found in request context".to_string()))?;

    let updated_user = usecase.update_user(user_id, body.into_inner(), tenant_id).await?;

    Ok(HttpResponse::Ok().json(SuccessResponseDTO::new(
        "User updated successfully",
        IdResponse { id: updated_user.id },
    )))
}

/// Delete current user (from JWT)
pub async fn delete_user(
    usecase: web::Data<Arc<UserUseCase>>,
    req: HttpRequest,
) -> Result<impl Responder, AppError> {
    let user_id = AuthUseCase::extract_user_id_from_request(&req)?;
    usecase.delete_user(user_id).await?;

    Ok(HttpResponse::Ok().json(SuccessResponseDTO::new(
        "User deleted successfully",
        IdResponse { id: user_id },
    )))
}
