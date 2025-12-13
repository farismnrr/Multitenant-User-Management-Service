use crate::controllers::tenant_controller;
use crate::middlewares::auth_middleware::validator;
use crate::middlewares::tenant_secret_middleware::TenantSecretMiddleware;
use actix_web::web;
use actix_web_httpauth::middleware::HttpAuthentication;

/// Configures tenant routes.
///
/// create_tenant supports dual authentication (JWT or TENANT_SECRET_KEY).
/// Other tenant routes require JWT authentication.
///
/// # Arguments
///
/// * `cfg` - Service configuration
pub fn configure_tenant_routes(cfg: &mut web::ServiceConfig) {
    let jwt_auth = HttpAuthentication::bearer(validator);
    let tenant_secret_auth = TenantSecretMiddleware;
    
    cfg.service(
        web::scope("/tenants")
            // create_tenant with tenant secret key authentication
            .service(
                web::resource("")
                    .route(web::post().to(tenant_controller::create_tenant))
                    .wrap(tenant_secret_auth)
            )
            // Other tenant routes require JWT authentication
            .service(
                web::scope("")
                    .wrap(jwt_auth)
                    .route("", web::get().to(tenant_controller::get_all_tenants))
                    .route("/{id}", web::get().to(tenant_controller::get_tenant))
                    .route("/{id}", web::put().to(tenant_controller::update_tenant))
                    .route("/{id}", web::delete().to(tenant_controller::delete_tenant))
            )
    );
}
