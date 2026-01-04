pub use sea_orm_migration::prelude::*;

mod m20250111_000001_create_tenants_table;
mod m20250111_000005_create_user_tenants_junction;

pub use m20250111_000001_create_tenants_table::Migration as M20250111CreateTenantsTable;
pub use m20250111_000005_create_user_tenants_junction::Migration as M20250111CreateUserTenantsJunction;
