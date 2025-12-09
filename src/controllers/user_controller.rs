use crate::dtos::user_dto::UpdateUserRequest;
use crate::dtos::response_dto::SuccessResponseDTO;
use crate::errors::AppError;
use crate::usecases::user_usecase::UserUseCase;
use actix_web::{web, HttpResponse, Responder};
use std::sync::Arc;
use uuid::Uuid;

/// Get user by ID
pub async fn get_user(
    usecase: web::Data<Arc<UserUseCase>>,
    path: web::Path<Uuid>,
) -> Result<impl Responder, AppError> {
    let user_id = path.into_inner();
    let user = usecase.get_user(user_id).await?;

    Ok(HttpResponse::Ok().json(SuccessResponseDTO::new("User retrieved successfully", user)))
}

/// Get all users
pub async fn get_all_users(
    usecase: web::Data<Arc<UserUseCase>>,
) -> Result<impl Responder, AppError> {
    let users = usecase.get_all_users().await?;

    Ok(HttpResponse::Ok().json(SuccessResponseDTO::new("Users retrieved successfully", users)))
}

/// Update user
pub async fn update_user(
    usecase: web::Data<Arc<UserUseCase>>,
    path: web::Path<Uuid>,
    body: web::Json<UpdateUserRequest>,
) -> Result<impl Responder, AppError> {
    let user_id = path.into_inner();
    let user = usecase.update_user(user_id, body.into_inner()).await?;

    Ok(HttpResponse::Ok().json(SuccessResponseDTO::new("User updated successfully", user)))
}

/// Delete user
pub async fn delete_user(
    usecase: web::Data<Arc<UserUseCase>>,
    path: web::Path<Uuid>,
) -> Result<impl Responder, AppError> {
    let user_id = path.into_inner();
    usecase.delete_user(user_id).await?;

    Ok(HttpResponse::Ok().json(SuccessResponseDTO::<()>::new("User deleted successfully", ())))
}
