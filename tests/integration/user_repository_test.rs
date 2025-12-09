// Integration tests for UserRepository
// These are whitebox tests that directly test the repository layer with the database

use user_auth_plugin::repositories::user_repository::{UserRepository, UserRepositoryTrait};
use uuid::Uuid;

use crate::common::{db, fixtures};

#[tokio::test]
async fn test_repository_create_user_success() {
    let db = db::setup_test_db().await;
    let repo = UserRepository::new(db.clone());

    let req = fixtures::default_create_user_request();
    let result = repo.create(&req).await;

    assert!(result.is_ok());
    let user = result.unwrap();
    assert_eq!(user.username, fixtures::TEST_USERNAME);
    assert_eq!(user.email, fixtures::TEST_EMAIL);
    assert_ne!(user.password_hash, fixtures::TEST_PASSWORD); // Should be hashed
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_repository_create_duplicate_username() {
    let db = db::setup_test_db().await;
    let repo = UserRepository::new(db.clone());

    // Create first user
    let req1 = fixtures::create_user_request("duplicate_user", "first@example.com", "password123");
    repo.create(&req1).await.expect("First user creation failed");

    // Try to create user with same username
    let req2 = fixtures::create_user_request("duplicate_user", "second@example.com", "password123");
    let result = repo.create(&req2).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("already exists"));
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_repository_create_duplicate_email() {
    let db = db::setup_test_db().await;
    let repo = UserRepository::new(db.clone());

    // Create first user
    let req1 = fixtures::create_user_request("user1", "duplicate@example.com", "password123");
    repo.create(&req1).await.expect("First user creation failed");

    // Try to create user with same email
    let req2 = fixtures::create_user_request("user2", "duplicate@example.com", "password123");
    let result = repo.create(&req2).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("already exists"));
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_repository_find_by_id_success() {
    let db = db::setup_test_db().await;
    let repo = UserRepository::new(db.clone());

    // Create a user first
    let req = fixtures::default_create_user_request();
    let created_user = repo.create(&req).await.expect("User creation failed");

    // Find by ID
    let result = repo.find_by_id(created_user.id).await;

    assert!(result.is_ok());
    let user = result.unwrap();
    assert!(user.is_some());
    let user = user.unwrap();
    assert_eq!(user.id, created_user.id);
    assert_eq!(user.username, fixtures::TEST_USERNAME);
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_repository_find_by_id_not_found() {
    let db = db::setup_test_db().await;
    let repo = UserRepository::new(db.clone());

    let random_id = Uuid::new_v4();
    let result = repo.find_by_id(random_id).await;

    assert!(result.is_ok());
    let user = result.unwrap();
    assert!(user.is_none());
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_repository_find_by_email_success() {
    let db = db::setup_test_db().await;
    let repo = UserRepository::new(db.clone());

    // Create a user first
    let req = fixtures::default_create_user_request();
    let created_user = repo.create(&req).await.expect("User creation failed");

    // Find by email
    let result = repo.find_by_email(fixtures::TEST_EMAIL).await;

    assert!(result.is_ok());
    let user = result.unwrap();
    assert!(user.is_some());
    let user = user.unwrap();
    assert_eq!(user.id, created_user.id);
    assert_eq!(user.email, fixtures::TEST_EMAIL);
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_repository_find_by_email_not_found() {
    let db = db::setup_test_db().await;
    let repo = UserRepository::new(db.clone());

    let result = repo.find_by_email("nonexistent@example.com").await;

    assert!(result.is_ok());
    let user = result.unwrap();
    assert!(user.is_none());
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_repository_find_all_empty() {
    let db = db::setup_test_db().await;
    let repo = UserRepository::new(db.clone());

    let result = repo.find_all().await;

    assert!(result.is_ok());
    let users = result.unwrap();
    assert_eq!(users.len(), 0);
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_repository_find_all_multiple_users() {
    let db = db::setup_test_db().await;
    let repo = UserRepository::new(db.clone());

    // Create multiple users
    let req1 = fixtures::create_user_request("user1", "user1@example.com", "password123");
    let req2 = fixtures::create_user_request("user2", "user2@example.com", "password123");
    let req3 = fixtures::create_user_request("user3", "user3@example.com", "password123");

    repo.create(&req1).await.expect("User 1 creation failed");
    repo.create(&req2).await.expect("User 2 creation failed");
    repo.create(&req3).await.expect("User 3 creation failed");

    let result = repo.find_all().await;

    assert!(result.is_ok());
    let users = result.unwrap();
    assert_eq!(users.len(), 3);
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_repository_update_username() {
    let db = db::setup_test_db().await;
    let repo = UserRepository::new(db.clone());

    // Create a user first
    let req = fixtures::default_create_user_request();
    let created_user = repo.create(&req).await.expect("User creation failed");

    // Update username
    let update_req = fixtures::update_user_request(
        Some("updated_username".to_string()),
        None,
        None,
    );
    let result = repo.update(created_user.id, &update_req).await;

    assert!(result.is_ok());
    let updated_user = result.unwrap();
    assert_eq!(updated_user.username, "updated_username");
    assert_eq!(updated_user.email, fixtures::TEST_EMAIL); // Email unchanged
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_repository_update_email() {
    let db = db::setup_test_db().await;
    let repo = UserRepository::new(db.clone());

    // Create a user first
    let req = fixtures::default_create_user_request();
    let created_user = repo.create(&req).await.expect("User creation failed");

    // Update email
    let update_req = fixtures::update_user_request(
        None,
        Some("newemail@example.com".to_string()),
        None,
    );
    let result = repo.update(created_user.id, &update_req).await;

    assert!(result.is_ok());
    let updated_user = result.unwrap();
    assert_eq!(updated_user.email, "newemail@example.com");
    assert_eq!(updated_user.username, fixtures::TEST_USERNAME); // Username unchanged
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_repository_update_password() {
    let db = db::setup_test_db().await;
    let repo = UserRepository::new(db.clone());

    // Create a user first
    let req = fixtures::default_create_user_request();
    let created_user = repo.create(&req).await.expect("User creation failed");
    let old_password_hash = created_user.password_hash.clone();

    // Update password
    let update_req = fixtures::update_user_request(
        None,
        None,
        Some("newpassword456".to_string()),
    );
    let result = repo.update(created_user.id, &update_req).await;

    assert!(result.is_ok());
    let updated_user = result.unwrap();
    assert_ne!(updated_user.password_hash, old_password_hash); // Password hash should change
    assert_ne!(updated_user.password_hash, "newpassword456"); // Should be hashed
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_repository_update_not_found() {
    let db = db::setup_test_db().await;
    let repo = UserRepository::new(db.clone());

    let random_id = Uuid::new_v4();
    let update_req = fixtures::update_user_request(
        Some("updated_username".to_string()),
        None,
        None,
    );
    let result = repo.update(random_id, &update_req).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("not found"));
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_repository_delete_success() {
    let db = db::setup_test_db().await;
    let repo = UserRepository::new(db.clone());

    // Create a user first
    let req = fixtures::default_create_user_request();
    let created_user = repo.create(&req).await.expect("User creation failed");

    // Delete the user
    let result = repo.delete(created_user.id).await;

    assert!(result.is_ok());

    // Verify user is deleted
    let find_result = repo.find_by_id(created_user.id).await;
    assert!(find_result.is_ok());
    assert!(find_result.unwrap().is_none());
    
    db::teardown_test_db(db).await;
}

#[tokio::test]
async fn test_repository_delete_not_found() {
    let db = db::setup_test_db().await;
    let repo = UserRepository::new(db.clone());

    let random_id = Uuid::new_v4();
    let result = repo.delete(random_id).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("not found"));
    
    db::teardown_test_db(db).await;
}
