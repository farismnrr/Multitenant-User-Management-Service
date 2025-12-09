//! Test Fixtures
//!
//! This module provides test data fixtures for integration tests.
//! These fixtures are not used by E2E tests which create their own test data.

#![allow(unused)]

use user_auth_plugin::dtos::user_dto::{CreateUserRequest, UpdateUserRequest};

/// Default test username.
pub const TEST_USERNAME: &str = "testuser";

/// Default test email address.
pub const TEST_EMAIL: &str = "test@example.com";

/// Default test password.
pub const TEST_PASSWORD: &str = "password123";

/// Default test user role.
pub const TEST_ROLE: &str = "USER";

/// Creates a `CreateUserRequest` with custom values.
///
/// # Arguments
///
/// * `username` - Username for the new user
/// * `email` - Email address for the new user
/// * `password` - Password for the new user
///
/// # Returns
///
/// Returns a `CreateUserRequest` with the specified values and default role.
pub fn create_user_request(username: &str, email: &str, password: &str) -> CreateUserRequest {
    CreateUserRequest {
        username: username.to_string(),
        email: email.to_string(),
        password: password.to_string(),
        role: TEST_ROLE.to_string(),
    }
}

/// Creates a `CreateUserRequest` with default test values.
///
/// Uses `TEST_USERNAME`, `TEST_EMAIL`, `TEST_PASSWORD`, and `TEST_ROLE` constants.
///
/// # Returns
///
/// Returns a `CreateUserRequest` with default test values.
pub fn default_create_user_request() -> CreateUserRequest {
    create_user_request(TEST_USERNAME, TEST_EMAIL, TEST_PASSWORD)
}

/// Creates an `UpdateUserRequest` with optional field values.
///
/// All fields are optional, allowing selective updates in tests.
///
/// # Arguments
///
/// * `username` - Optional new username
/// * `email` - Optional new email address
/// * `password` - Optional new password
///
/// # Returns
///
/// Returns an `UpdateUserRequest` with the specified optional values.
pub fn update_user_request(
    username: Option<String>,
    email: Option<String>,
    password: Option<String>,
) -> UpdateUserRequest {
    UpdateUserRequest {
        username,
        email,
        password,
        role: None,
    }
}
