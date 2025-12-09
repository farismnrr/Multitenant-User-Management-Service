use sea_orm::{Database, DatabaseConnection};
use std::sync::Arc;

/// Sets up a test database with migrations applied.
///
/// This function connects to the test database and runs all pending migrations.
/// It uses `up()` instead of `refresh()` to avoid conflicts when tests run in parallel.
/// After migrations, it cleans up all existing data to ensure test isolation.
///
/// # Returns
///
/// Returns an Arc-wrapped database connection ready for testing.
///
/// # Panics
///
/// Panics if database connection or migration fails.
pub async fn setup_test_db() -> Arc<DatabaseConnection> {
    dotenvy::dotenv().ok();
    
    let host = std::env::var("CORE_DB_HOST").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port = std::env::var("CORE_DB_PORT").unwrap_or_else(|_| "5432".to_string());
    let user = std::env::var("CORE_DB_USER").unwrap_or_else(|_| "postgres".to_string());
    let pass = std::env::var("CORE_DB_PASS").unwrap_or_else(|_| "postgres".to_string());
    let name = std::env::var("CORE_DB_NAME").unwrap_or_else(|_| "user_auth_plugin_test".to_string());

    let url = format!("postgres://{}:{}@{}:{}/{}", user, pass, host, port, name);
    let db = Database::connect(&url)
        .await
        .expect("Failed to connect to test database");
    
    // Run migrations (up) - this is idempotent and safe for parallel tests
    use migration::MigratorTrait;
    migration::Migrator::up(&db, None)
        .await
        .expect("Failed to run migrations");
    
    // Clean up all data from tables for this test
    cleanup_test_data(&db).await;
    
    Arc::new(db)
}

/// Cleans up test data by truncating all tables.
///
/// This function truncates the users table with CASCADE to remove all test data
/// and reset auto-increment sequences. This ensures test isolation between runs.
///
/// # Arguments
///
/// * `db` - Database connection to clean up
async fn cleanup_test_data(db: &DatabaseConnection) {
    use sea_orm::Statement;
    use sea_orm::ConnectionTrait;
    
    // Truncate users table to clean up test data
    let _ = db.execute(Statement::from_string(
        db.get_database_backend(),
        "TRUNCATE TABLE users RESTART IDENTITY CASCADE".to_string()
    )).await;
}

/// Tears down the test database connection.
///
/// Currently a placeholder for future cleanup logic. The database connection
/// will be dropped automatically when the Arc reference count reaches zero.
///
/// # Arguments
///
/// * `_db` - Database connection to tear down (unused currently)
pub async fn teardown_test_db(_db: Arc<DatabaseConnection>) {
    // Database connection will be dropped automatically
    // Add any additional cleanup logic here if needed
}
