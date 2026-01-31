#!/bin/bash
set -e

# Use /app/.dev_data for volume mount
DEV_DATA="/app/.dev_data"
echo "🔗 Preparing Dev Cache in $DEV_DATA..."
mkdir -p "$DEV_DATA/target" "$DEV_DATA/cargo_registry" "$DEV_DATA/cargo_git"

# Link Rust target folder (Use force -n to overwrite symlinks to directories)
echo "  - Linking target to volume..."
rm -rf target
ln -sfn ".dev_data/target" "target"

# Link Cargo folders (Absolute is fine here, outside /app)
mkdir -p /usr/local/cargo
if [ ! -L "/usr/local/cargo/registry" ]; then
    rm -rf /usr/local/cargo/registry
    ln -sfn "$DEV_DATA/cargo_registry" "/usr/local/cargo/registry"
fi
if [ ! -L "/usr/local/cargo/git" ]; then
    rm -rf /usr/local/cargo/git
    ln -sfn "$DEV_DATA/cargo_git" "/usr/local/cargo/git"
fi

echo "🚀 Checking for migrations..."
cd migration
cargo run -- up
cd ..

echo "🚀 Starting User Management Service (Cargo Watch)..."
cargo watch -x run -w src -w migration
