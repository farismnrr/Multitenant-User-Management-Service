use crate::dtos::user_dto::{CreateUserRequest, UpdateUserRequest, UserResponse};
use crate::entities::user::Model as User;
use crate::errors::AppError;
use crate::repositories::user_repository::UserRepositoryTrait;
use crate::validators::user_validator;
use std::sync::Arc;
use uuid::Uuid;

/// User use case orchestrating user management business logic.
///
/// This use case handles all user-related operations including creation, retrieval,
/// updates, and deletion. It coordinates between the repository layer and validators
/// to ensure data integrity and business rule compliance.
pub struct UserUseCase {
    repository: Arc<dyn UserRepositoryTrait>,
}

impl UserUseCase {
    /// Creates a new UserUseCase instance.
    ///
    /// # Arguments
    ///
    /// * `repository` - Arc-wrapped user repository implementation
    pub fn new(repository: Arc<dyn UserRepositoryTrait>) -> Self {
        Self { repository }
    }

    /// Create a new user
    /// 
    /// Note: This method is primarily used by integration tests.
    /// For production use, prefer using AuthUseCase::register which includes
    /// authentication token generation.
    #[allow(dead_code)]
    pub async fn create_user(&self, req: CreateUserRequest) -> Result<UserResponse, AppError> {
        // Validate input
        user_validator::validate_username(&req.username)?;
        user_validator::validate_email(&req.email)?;
        user_validator::validate_password(&req.password)?;

        // Create user via repository
        let user = self.repository.create(&req).await?;

        Ok(Self::user_to_response(user))
    }

    /// Retrieves a user by their ID.
    ///
    /// # Arguments
    ///
    /// * `id` - UUID of the user to retrieve
    ///
    /// # Returns
    ///
    /// Returns `UserResponse` if found, or `AppError::NotFound` if the user doesn't exist.
    pub async fn get_user(&self, id: Uuid) -> Result<UserResponse, AppError> {
        let user = self
            .repository
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("User with id {} not found", id)))?;

        Ok(Self::user_to_response(user))
    }

    /// Retrieves all users from the database.
    ///
    /// # Returns
    ///
    /// Returns a vector of `UserResponse` containing all users.
    pub async fn get_all_users(&self) -> Result<Vec<UserResponse>, AppError> {
        let users = self.repository.find_all().await?;

        Ok(users.into_iter().map(Self::user_to_response).collect())
    }

    /// Updates an existing user.
    ///
    /// # Arguments
    ///
    /// * `id` - UUID of the user to update
    /// * `req` - Update request containing optional fields to update
    ///
    /// # Returns
    ///
    /// Returns updated `UserResponse` or `AppError` if validation fails or user not found.
    pub async fn update_user(
        &self,
        id: Uuid,
        req: UpdateUserRequest,
    ) -> Result<UserResponse, AppError> {
        // Validate input if provided
        if let Some(ref username) = req.username {
            user_validator::validate_username(username)?;
        }
        if let Some(ref email) = req.email {
            user_validator::validate_email(email)?;
        }
        if let Some(ref password) = req.password {
            user_validator::validate_password(password)?;
        }

        // Update user via repository
        let user = self.repository.update(id, &req).await?;

        Ok(Self::user_to_response(user))
    }

    /// Deletes a user by their ID.
    ///
    /// # Arguments
    ///
    /// * `id` - UUID of the user to delete
    ///
    /// # Returns
    ///
    /// Returns `Ok(())` if successful, or `AppError::NotFound` if user doesn't exist.
    pub async fn delete_user(&self, id: Uuid) -> Result<(), AppError> {
        self.repository.delete(id).await
    }

    /// Converts a User entity to UserResponse DTO.
    fn user_to_response(user: User) -> UserResponse {
        UserResponse {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            created_at: user.created_at,
            updated_at: user.updated_at,
        }
    }
}
