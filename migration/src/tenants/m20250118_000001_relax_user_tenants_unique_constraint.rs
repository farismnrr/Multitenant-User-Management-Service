use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // 1. Drop the existing unique constraint (user_id, tenant_id)
        manager
            .drop_index(
                Index::drop()
                    .name("idx_user_tenants_unique")
                    .table(UserTenants::Table)
                    .to_owned(),
            )
            .await?;

        // 2. Create a new unique constraint (user_id, tenant_id, role)
        manager
            .create_index(
                Index::create()
                    .name("idx_user_tenant_role_unique")
                    .table(UserTenants::Table)
                    .col(UserTenants::UserId)
                    .col(UserTenants::TenantId)
                    .col(UserTenants::Role)
                    .unique()
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Reverse: Drop the multi-col unique and restore the dual-col unique
        // WARNING: This will fail if there are already multiple roles for a user in a tenant.
        manager
            .drop_index(
                Index::drop()
                    .name("idx_user_tenant_role_unique")
                    .table(UserTenants::Table)
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_user_tenants_unique")
                    .table(UserTenants::Table)
                    .col(UserTenants::UserId)
                    .col(UserTenants::TenantId)
                    .unique()
                    .to_owned(),
            )
            .await?;

        Ok(())
    }
}

#[derive(DeriveIden)]
enum UserTenants {
    Table,
    UserId,
    TenantId,
    Role,
}
