use crate::dtos::auth_dto::{LoginRequest, RegisterRequest, AuthResponse};
use crate::dtos::user_dto::{CreateUserRequest, UserResponse};
use crate::entities::user::Model as User;
use crate::errors::AppError;
use crate::repositories::user_repository::UserRepositoryTrait;
use crate::utils::jwt::JwtService;
use crate::utils::password;
use crate::validators::user_validator;
use std::sync::Arc;

/// Authentication use case handling user registration and login.
///
/// This use case manages authentication operations including user registration,
/// login with password verification, and JWT token generation. It coordinates
/// between the repository, validators, password utilities, and JWT service.
pub struct AuthUseCase {
    repository: Arc<dyn UserRepositoryTrait>,
    jwt_service: JwtService,
}

impl AuthUseCase {
    /// Creates a new AuthUseCase instance.
    ///
    /// # Arguments
    ///
    /// * `repository` - Arc-wrapped user repository implementation
    pub fn new(repository: Arc<dyn UserRepositoryTrait>) -> Self {
        Self {
            repository,
            jwt_service: JwtService::new(),
        }
    }

    /// Registers a new user and generates authentication tokens.
    ///
    /// # Arguments
    ///
    /// * `req` - Registration request containing username, email, password, and role
    ///
    /// # Returns
    ///
    /// Returns `AuthResponse` with user data and access token.
    ///
    /// # Errors
    ///
    /// - `AppError::BadRequest` if email is already registered
    /// - `AppError::ValidationError` if input validation fails
    /// - `AppError::InternalError` if token generation fails
    pub async fn register(&self, req: RegisterRequest) -> Result<AuthResponse, AppError> {
        // Validate input
        user_validator::validate_username(&req.username)?;
        user_validator::validate_email(&req.email)?;
        user_validator::validate_password(&req.password)?;

        // Check if email already exists
        if self.repository.find_by_email(&req.email).await?.is_some() {
            return Err(AppError::BadRequest("Email already registered".to_string()));
        }

        // Create user via repository
        let create_req = CreateUserRequest {
            username: req.username,
            email: req.email,
            password: req.password,
            role: req.role,
        };
        let user = self.repository.create(&create_req).await?;

        // Generate tokens
        let access_token = self.jwt_service.generate_access_token(user.id)
            .map_err(|e| AppError::InternalError(format!("Failed to generate access token: {}", e)))?;
        
        let _refresh_token = self.jwt_service.generate_refresh_token(user.id)
            .map_err(|e| AppError::InternalError(format!("Failed to generate refresh token: {}", e)))?;

        Ok(AuthResponse {
            user: Self::user_to_response(user),
            access_token,
        })
    }

    /// Authenticates a user and generates tokens.
    ///
    /// # Arguments
    ///
    /// * `req` - Login request containing email and password
    ///
    /// # Returns
    ///
    /// Returns tuple of (`AuthResponse`, refresh_token as `String`).
    /// The refresh token should be set as an HTTP-only cookie.
    ///
    /// # Errors
    ///
    /// - `AppError::Unauthorized` if email not found or password is incorrect
    /// - `AppError::InternalError` if password verification or token generation fails
    pub async fn login(&self, req: LoginRequest) -> Result<(AuthResponse, String), AppError> {
        // Find user by email
        let user = self
            .repository
            .find_by_email(&req.email)
            .await?
            .ok_or_else(|| AppError::Unauthorized("Invalid email or password".to_string()))?;

        // Verify password
        let is_valid = password::verify_password(&req.password, &user.password_hash)
            .map_err(|e| AppError::InternalError(format!("Password verification failed: {}", e)))?;

        if !is_valid {
            return Err(AppError::Unauthorized("Invalid email or password".to_string()));
        }

        // Generate tokens
        let access_token = self.jwt_service.generate_access_token(user.id)
            .map_err(|e| AppError::InternalError(format!("Failed to generate access token: {}", e)))?;
        
        let refresh_token = self.jwt_service.generate_refresh_token(user.id)
            .map_err(|e| AppError::InternalError(format!("Failed to generate refresh token: {}", e)))?;

        Ok((
            AuthResponse {
                user: Self::user_to_response(user),
                access_token,
            },
            refresh_token,
        ))
    }

    /// Gets the refresh token expiry duration in seconds.
    ///
    /// This value is used for setting the max-age of the refresh token cookie.
    ///
    /// # Returns
    ///
    /// Refresh token expiry in seconds (default: 604800 = 7 days).
    pub fn get_refresh_token_expiry(&self) -> i64 {
        self.jwt_service.get_refresh_token_expiry()
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
