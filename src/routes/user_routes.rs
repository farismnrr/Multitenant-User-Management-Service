use crate::controllers::user_controller::{
    delete_user, get_all_users, get_user, update_user,
};
use actix_web::web;

/// Configures user management routes.
///
/// # Routes
///
/// - `GET /users` - Get all users
/// - `GET /users/{id}` - Get user by ID
/// - `PUT /users/{id}` - Update user
/// - `DELETE /users/{id}` - Delete user
///
/// All routes require API key authentication.
pub fn configure_user_routes(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/users")
            .route("", web::get().to(get_all_users))
            .route("/{id}", web::get().to(get_user))
            .route("/{id}", web::put().to(update_user))
            .route("/{id}", web::delete().to(delete_user)),
    );
}
