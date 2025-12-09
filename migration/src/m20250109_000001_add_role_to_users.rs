//! Add Role Column to Users Table
//!
//! Adds a role column to the users table with a default value of "USER"
//! and creates an index for better query performance.

use sea_orm_migration::prelude::*;

/// Migration to add role column to users table.
#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .alter_table(
                Table::alter()
                    .table(Users::Table)
                    .add_column(
                        ColumnDef::new(Users::Role)
                            .string()
                            .string_len(50)
                            .not_null()
                            .default("USER"),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_users_role")
                    .table(Users::Table)
                    .col(Users::Role)
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_index(Index::drop().name("idx_users_role").to_owned())
            .await?;

        manager
            .alter_table(
                Table::alter()
                    .table(Users::Table)
                    .drop_column(Users::Role)
                    .to_owned(),
            )
            .await
    }
}

/// Column identifiers for the users table.
#[derive(DeriveIden)]
enum Users {
    Table,
    Role,
}
