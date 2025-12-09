//! E2E User API Tests
//!
//! This module contains end-to-end tests for the User API endpoints.
//! These are black-box tests that test the HTTP API through the full application stack.

use actix_web::{test, web, App};
use user_auth_plugin::*;
use serde_json::json;
use std::sync::Arc;

use crate::common::db;

/// Creates a JSON payload for user registration.
///
/// # Arguments
///
/// * `username` - Username for the new user
/// * `email` - Email address for the new user
/// * `password` - Password for the new user
///
/// # Returns
///
/// Returns a JSON value with user registration data and default "USER" role.
fn create_user_json(username: &str, email: &str, password: &str) -> serde_json::Value {
    json!({
        "username": username,
        "email": email,
        "password": password,
        "role": "USER"
    })
}

/// Creates a JSON payload for user updates with optional fields.
///
/// # Arguments
///
/// * `username` - Optional new username
/// * `email` - Optional new email address
/// * `password` - Optional new password
///
/// # Returns
///
/// Returns a JSON value with only the specified fields included.
fn update_user_json(
    username: Option<&str>,
    email: Option<&str>,
    password: Option<&str>,
) -> serde_json::Value {
    let mut json = json!({});
    
    if let Some(u) = username {
        json["username"] = json!(u);
    }
    if let Some(e) = email {
        json["email"] = json!(e);
    }
    if let Some(p) = password {
        json["password"] = json!(p);
    }
    
    json
}

/// Creates a test Actix application instance with all routes configured.
///
/// # Arguments
///
/// * `db` - Arc-wrapped database connection for the test app
///
/// # Returns
///
/// Returns a configured Actix `App` instance ready for testing.
fn create_test_app(
    db: Arc<sea_orm::DatabaseConnection>,
) -> App<
    impl actix_web::dev::ServiceFactory<
        actix_web::dev::ServiceRequest,
        Config = (),
        Response = actix_web::dev::ServiceResponse,
        Error = actix_web::Error,
        InitError = (),
    >,
> {
    use repositories::user_repository::{UserRepository, UserRepositoryTrait};
    use usecases::user_usecase::UserUseCase;
    use usecases::auth_usecase::AuthUseCase;
    use routes::{user_routes, auth_routes};

    let user_repository = UserRepository::new(db.clone());
    let user_repository: Arc<dyn UserRepositoryTrait> = Arc::new(user_repository);
    let user_usecase = Arc::new(UserUseCase::new(user_repository.clone()));
    let auth_usecase = Arc::new(AuthUseCase::new(user_repository));

    App::new()
        .app_data(web::Data::new(user_usecase))
        .app_data(web::Data::new(auth_usecase))
        .configure(user_routes::configure_user_routes)
        .configure(auth_routes::configure_auth_routes)
}

/// Tests successful user registration via API.
#[actix_web::test]
async fn test_api_register_user_success() {
    let db = db::setup_test_db().await;
    let app = test::init_service(create_test_app(db.clone())).await;

    let req = test::TestRequest::post()
        .uri("/auth/register")
        .set_json(create_user_json("testuser_e2e", "test_e2e@example.com", "password123"))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["success"], true);
    assert_eq!(body["data"]["user"]["username"], "testuser_e2e");
    assert_eq!(body["data"]["user"]["email"], "test_e2e@example.com");
    assert!(body["data"]["user"]["id"].is_string());
    assert!(body["data"]["access_token"].is_string());
    
    db::teardown_test_db(db).await;
}

/// Tests user registration with invalid username (too short).
#[actix_web::test]
async fn test_api_register_user_invalid_username() {
    let db = db::setup_test_db().await;
    let app = test::init_service(create_test_app(db.clone())).await;

    let req = test::TestRequest::post()
        .uri("/auth/register")
        .set_json(create_user_json("ab", "valid@example.com", "password123"))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 422);
    
    db::teardown_test_db(db).await;
}

/// Tests user registration with invalid email format.
#[actix_web::test]
async fn test_api_register_user_invalid_email() {
    let db = db::setup_test_db().await;
    let app = test::init_service(create_test_app(db.clone())).await;

    let req = test::TestRequest::post()
        .uri("/auth/register")
        .set_json(create_user_json("validuser", "invalid-email", "password123"))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 422);
    
    db::teardown_test_db(db).await;
}

/// Tests user registration with invalid password (too short).
#[actix_web::test]
async fn test_api_register_user_invalid_password() {
    let db = db::setup_test_db().await;
    let app = test::init_service(create_test_app(db.clone())).await;

    let req = test::TestRequest::post()
        .uri("/auth/register")
        .set_json(create_user_json("validuser", "valid@example.com", "12345"))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 422);
    
    db::teardown_test_db(db).await;
}

/// Tests user registration with duplicate username.
#[actix_web::test]
async fn test_api_register_user_duplicate_username() {
    let db = db::setup_test_db().await;
    let app = test::init_service(create_test_app(db.clone())).await;

    let req1 = test::TestRequest::post()
        .uri("/auth/register")
        .set_json(create_user_json("duplicate_test", "first@example.com", "password123"))
        .to_request();
    test::call_service(&app, req1).await;

    let req2 = test::TestRequest::post()
        .uri("/auth/register")
        .set_json(create_user_json("duplicate_test", "second@example.com", "password123"))
        .to_request();

    let resp = test::call_service(&app, req2).await;
    assert_eq!(resp.status(), 400);
    
    db::teardown_test_db(db).await;
}

/// Tests getting all users when database is empty.
#[actix_web::test]
async fn test_api_get_all_users_empty() {
    let db = db::setup_test_db().await;
    let app = test::init_service(create_test_app(db.clone())).await;

    let req = test::TestRequest::get()
        .uri("/users")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["success"], true);
    assert!(body["data"].is_array());
    assert_eq!(body["data"].as_array().unwrap().len(), 0);
    
    db::teardown_test_db(db).await;
}

/// Tests getting all users with multiple users in database.
#[actix_web::test]
async fn test_api_get_all_users_multiple() {
    let db = db::setup_test_db().await;
    let app = test::init_service(create_test_app(db.clone())).await;

    let create_req1 = test::TestRequest::post()
        .uri("/auth/register")
        .set_json(create_user_json("getall_test1", "getall1@example.com", "password123"))
        .to_request();
    test::call_service(&app, create_req1).await;

    let create_req2 = test::TestRequest::post()
        .uri("/auth/register")
        .set_json(create_user_json("getall_test2", "getall2@example.com", "password123"))
        .to_request();
    test::call_service(&app, create_req2).await;

    let req = test::TestRequest::get()
        .uri("/users")
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["success"], true);
    assert!(body["data"].is_array());
    assert_eq!(body["data"].as_array().unwrap().len(), 2);
    
    db::teardown_test_db(db).await;
}

/// Tests getting a user by ID successfully.
#[actix_web::test]
async fn test_api_get_user_by_id_success() {
    let db = db::setup_test_db().await;
    let app = test::init_service(create_test_app(db.clone())).await;

    let create_req = test::TestRequest::post()
        .uri("/auth/register")
        .set_json(create_user_json("getbyid_test", "getbyid@example.com", "password123"))
        .to_request();
    
    let create_resp = test::call_service(&app, create_req).await;
    let create_body: serde_json::Value = test::read_body_json(create_resp).await;
    let user_id = create_body["data"]["user"]["id"].as_str().unwrap();

    let req = test::TestRequest::get()
        .uri(&format!("/users/{}", user_id))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["success"], true);
    assert_eq!(body["data"]["id"], user_id);
    assert_eq!(body["data"]["username"], "getbyid_test");
    
    db::teardown_test_db(db).await;
}

/// Tests getting a user by ID when user doesn't exist.
#[actix_web::test]
async fn test_api_get_user_by_id_not_found() {
    let db = db::setup_test_db().await;
    let app = test::init_service(create_test_app(db.clone())).await;

    let random_id = uuid::Uuid::new_v4();
    let req = test::TestRequest::get()
        .uri(&format!("/users/{}", random_id))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 404);
    
    db::teardown_test_db(db).await;
}

/// Tests updating a user's username successfully.
#[actix_web::test]
async fn test_api_update_user_username() {
    let db = db::setup_test_db().await;
    let app = test::init_service(create_test_app(db.clone())).await;

    let create_req = test::TestRequest::post()
        .uri("/auth/register")
        .set_json(create_user_json("update_test", "update@example.com", "password123"))
        .to_request();
    
    let create_resp = test::call_service(&app, create_req).await;
    let create_body: serde_json::Value = test::read_body_json(create_resp).await;
    let user_id = create_body["data"]["user"]["id"].as_str().unwrap();

    let req = test::TestRequest::put()
        .uri(&format!("/users/{}", user_id))
        .set_json(update_user_json(Some("updated_username"), None, None))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["success"], true);
    assert_eq!(body["data"]["username"], "updated_username");
    
    db::teardown_test_db(db).await;
}

/// Tests updating a user's email successfully.
#[actix_web::test]
async fn test_api_update_user_email() {
    let db = db::setup_test_db().await;
    let app = test::init_service(create_test_app(db.clone())).await;

    let create_req = test::TestRequest::post()
        .uri("/auth/register")
        .set_json(create_user_json("update_test", "update@example.com", "password123"))
        .to_request();
    
    let create_resp = test::call_service(&app, create_req).await;
    let create_body: serde_json::Value = test::read_body_json(create_resp).await;
    let user_id = create_body["data"]["user"]["id"].as_str().unwrap();

    let req = test::TestRequest::put()
        .uri(&format!("/users/{}", user_id))
        .set_json(update_user_json(None, Some("newemail@example.com"), None))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["success"], true);
    assert_eq!(body["data"]["email"], "newemail@example.com");
    
    db::teardown_test_db(db).await;
}

/// Tests updating a user with invalid username.
#[actix_web::test]
async fn test_api_update_user_invalid_username() {
    let db = db::setup_test_db().await;
    let app = test::init_service(create_test_app(db.clone())).await;

    let create_req = test::TestRequest::post()
        .uri("/auth/register")
        .set_json(create_user_json("update_test", "update@example.com", "password123"))
        .to_request();
    
    let create_resp = test::call_service(&app, create_req).await;
    let create_body: serde_json::Value = test::read_body_json(create_resp).await;
    let user_id = create_body["data"]["user"]["id"].as_str().unwrap();

    let req = test::TestRequest::put()
        .uri(&format!("/users/{}", user_id))
        .set_json(update_user_json(Some("ab"), None, None))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 422);
    
    db::teardown_test_db(db).await;
}

/// Tests updating a non-existent user.
#[actix_web::test]
async fn test_api_update_user_not_found() {
    let db = db::setup_test_db().await;
    let app = test::init_service(create_test_app(db.clone())).await;

    let random_id = uuid::Uuid::new_v4();
    let req = test::TestRequest::put()
        .uri(&format!("/users/{}", random_id))
        .set_json(update_user_json(Some("updated_username"), None, None))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 404);
    
    db::teardown_test_db(db).await;
}

/// Tests deleting a user successfully.
#[actix_web::test]
async fn test_api_delete_user_success() {
    let db = db::setup_test_db().await;
    let app = test::init_service(create_test_app(db.clone())).await;

    let create_req = test::TestRequest::post()
        .uri("/auth/register")
        .set_json(create_user_json("delete_test", "delete@example.com", "password123"))
        .to_request();
    
    let create_resp = test::call_service(&app, create_req).await;
    let create_body: serde_json::Value = test::read_body_json(create_resp).await;
    let user_id = create_body["data"]["user"]["id"].as_str().unwrap();

    let req = test::TestRequest::delete()
        .uri(&format!("/users/{}", user_id))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());

    let body: serde_json::Value = test::read_body_json(resp).await;
    assert_eq!(body["success"], true);
    
    db::teardown_test_db(db).await;
}

/// Tests deleting a non-existent user.
#[actix_web::test]
async fn test_api_delete_user_not_found() {
    let db = db::setup_test_db().await;
    let app = test::init_service(create_test_app(db.clone())).await;

    let random_id = uuid::Uuid::new_v4();
    let req = test::TestRequest::delete()
        .uri(&format!("/users/{}", random_id))
        .to_request();

    let resp = test::call_service(&app, req).await;
    assert_eq!(resp.status(), 404);
    
    db::teardown_test_db(db).await;
}
