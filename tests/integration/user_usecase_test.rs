//! UserUseCase Integration Tests
//!
//! This module contains integration (white-box) tests for the UserUseCase.
//! These tests verify business logic with actual repository implementations
//! and database connections.

use user_auth_plugin::repositories::user_repository::{UserRepository, UserRepositoryTrait};
use user_auth_plugin::usecases::user_usecase::UserUseCase;
use std::sync::Arc;

use crate::common::{db, fixtures};

#[tokio::test]
async fn test_usecase_create_user_success() {
    let db = db::setup_test_db().await;
    let repo: Arc<dyn UserRepositoryTrait> = Arc::new(UserRepository::new(db.clone()));
    let usecase = UserUseCase::new(repo);

    let req = fixtures::default_create_user_request();
    let result = usecase.create_user(req).await;

    assert!(result.is_ok());
    let user_response = result.unwrap();
    assert_eq!(user_response.username, fixtures::TEST_USERNAME);
    assert_eq!(user_response.email, fixtures::TEST_EMAIL);
    assert!(user_response.id.to_string().len() > 0); // UUID should be generated
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_usecase_create_user_invalid_username_too_short() {
    let db = db::setup_test_db().await;
    let repo: Arc<dyn UserRepositoryTrait> = Arc::new(UserRepository::new(db.clone()));
    let usecase = UserUseCase::new(repo);

    let req = fixtures::create_user_request("ab", "valid@example.com", "password123");
    let result = usecase.create_user(req).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("Username"));
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_usecase_create_user_invalid_username_too_long() {
    let db = db::setup_test_db().await;
    let repo: Arc<dyn UserRepositoryTrait> = Arc::new(UserRepository::new(db.clone()));
    let usecase = UserUseCase::new(repo);

    let long_username = "a".repeat(51); // More than 50 characters
    let req = fixtures::create_user_request(&long_username, "valid@example.com", "password123");
    let result = usecase.create_user(req).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("Username"));
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_usecase_create_user_invalid_email() {
    let db = db::setup_test_db().await;
    let repo: Arc<dyn UserRepositoryTrait> = Arc::new(UserRepository::new(db.clone()));
    let usecase = UserUseCase::new(repo);

    let req = fixtures::create_user_request("validuser", "invalid-email", "password123");
    let result = usecase.create_user(req).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    // Email validation error should contain "email" (case insensitive)
    let err_msg = err.to_string().to_lowercase();
    assert!(err_msg.contains("email"), "Expected error to contain 'email', got: {}", err);
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_usecase_create_user_invalid_password_too_short() {
    let db = db::setup_test_db().await;
    let repo: Arc<dyn UserRepositoryTrait> = Arc::new(UserRepository::new(db.clone()));
    let usecase = UserUseCase::new(repo);

    let req = fixtures::create_user_request("validuser", "valid@example.com", "12345");
    let result = usecase.create_user(req).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("Password"));
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_usecase_get_user_success() {
    let db = db::setup_test_db().await;
    let repo: Arc<dyn UserRepositoryTrait> = Arc::new(UserRepository::new(db.clone()));
    let usecase = UserUseCase::new(repo);

    // Create a user first
    let create_req = fixtures::default_create_user_request();
    let created_user = usecase.create_user(create_req).await.expect("User creation failed");

    // Get the user
    let result = usecase.get_user(created_user.id).await;

    assert!(result.is_ok());
    let user_response = result.unwrap();
    assert_eq!(user_response.id, created_user.id);
    assert_eq!(user_response.username, fixtures::TEST_USERNAME);
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_usecase_get_user_not_found() {
    let db = db::setup_test_db().await;
    let repo: Arc<dyn UserRepositoryTrait> = Arc::new(UserRepository::new(db.clone()));
    let usecase = UserUseCase::new(repo);

    let random_id = uuid::Uuid::new_v4();
    let result = usecase.get_user(random_id).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("not found"));
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_usecase_get_all_users() {
    let db = db::setup_test_db().await;
    let repo: Arc<dyn UserRepositoryTrait> = Arc::new(UserRepository::new(db.clone()));
    let usecase = UserUseCase::new(repo);

    // Create multiple users
    let req1 = fixtures::create_user_request("user1", "user1@example.com", "password123");
    let req2 = fixtures::create_user_request("user2", "user2@example.com", "password123");
    let req3 = fixtures::create_user_request("user3", "user3@example.com", "password123");

    usecase.create_user(req1).await.expect("User 1 creation failed");
    usecase.create_user(req2).await.expect("User 2 creation failed");
    usecase.create_user(req3).await.expect("User 3 creation failed");

    let result = usecase.get_all_users().await;

    assert!(result.is_ok());
    let users = result.unwrap();
    assert_eq!(users.len(), 3);
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_usecase_update_user_success() {
    let db = db::setup_test_db().await;
    let repo: Arc<dyn UserRepositoryTrait> = Arc::new(UserRepository::new(db.clone()));
    let usecase = UserUseCase::new(repo);

    // Create a user first
    let create_req = fixtures::default_create_user_request();
    let created_user = usecase.create_user(create_req).await.expect("User creation failed");

    // Update the user
    let update_req = fixtures::update_user_request(
        Some("updated_username".to_string()),
        None,
        None,
    );
    let result = usecase.update_user(created_user.id, update_req).await;

    assert!(result.is_ok());
    let updated_user = result.unwrap();
    assert_eq!(updated_user.username, "updated_username");
    assert_eq!(updated_user.email, fixtures::TEST_EMAIL);
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_usecase_update_user_invalid_username() {
    let db = db::setup_test_db().await;
    let repo: Arc<dyn UserRepositoryTrait> = Arc::new(UserRepository::new(db.clone()));
    let usecase = UserUseCase::new(repo);

    // Create a user first
    let create_req = fixtures::default_create_user_request();
    let created_user = usecase.create_user(create_req).await.expect("User creation failed");

    // Try to update with invalid username
    let update_req = fixtures::update_user_request(
        Some("ab".to_string()), // Too short
        None,
        None,
    );
    let result = usecase.update_user(created_user.id, update_req).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("Username"));
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_usecase_update_user_invalid_email() {
    let db = db::setup_test_db().await;
    let repo: Arc<dyn UserRepositoryTrait> = Arc::new(UserRepository::new(db.clone()));
    let usecase = UserUseCase::new(repo);

    // Create a user first
    let create_req = fixtures::default_create_user_request();
    let created_user = usecase.create_user(create_req).await.expect("User creation failed");

    // Try to update with invalid email
    let update_req = fixtures::update_user_request(
        None,
        Some("invalid-email".to_string()),
        None,
    );
    let result = usecase.update_user(created_user.id, update_req).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    // Email validation error should contain "email" (case insensitive)
    let err_msg = err.to_string().to_lowercase();
    assert!(err_msg.contains("email"), "Expected error to contain 'email', got: {}", err);
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_usecase_update_user_invalid_password() {
    let db = db::setup_test_db().await;
    let repo: Arc<dyn UserRepositoryTrait> = Arc::new(UserRepository::new(db.clone()));
    let usecase = UserUseCase::new(repo);

    // Create a user first
    let create_req = fixtures::default_create_user_request();
    let created_user = usecase.create_user(create_req).await.expect("User creation failed");

    // Try to update with invalid password
    let update_req = fixtures::update_user_request(
        None,
        None,
        Some("123".to_string()), // Too short
    );
    let result = usecase.update_user(created_user.id, update_req).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("Password"));
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_usecase_delete_user_success() {
    let db = db::setup_test_db().await;
    let repo: Arc<dyn UserRepositoryTrait> = Arc::new(UserRepository::new(db.clone()));
    let usecase = UserUseCase::new(repo);

    // Create a user first
    let create_req = fixtures::default_create_user_request();
    let created_user = usecase.create_user(create_req).await.expect("User creation failed");

    // Delete the user
    let result = usecase.delete_user(created_user.id).await;

    assert!(result.is_ok());

    // Verify user is deleted
    let get_result = usecase.get_user(created_user.id).await;
    assert!(get_result.is_err());
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_usecase_delete_user_not_found() {
    let db = db::setup_test_db().await;
    let repo: Arc<dyn UserRepositoryTrait> = Arc::new(UserRepository::new(db.clone()));
    let usecase = UserUseCase::new(repo);

    let random_id = uuid::Uuid::new_v4();
    let result = usecase.delete_user(random_id).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("not found"));
    
    db::teardown_test_db(db).await;
}
