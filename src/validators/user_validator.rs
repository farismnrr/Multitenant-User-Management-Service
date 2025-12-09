use crate::errors::AppError;

/// Validates a username.
///
/// # Rules
///
/// - Must not be empty or whitespace only
/// - Must be at least 3 characters long
/// - Must be at most 50 characters long
///
/// # Arguments
///
/// * `username` - Username string to validate
///
/// # Returns
///
/// Returns `Ok(())` if valid, or `AppError::ValidationError` with details if invalid.
pub fn validate_username(username: &str) -> Result<(), AppError> {
    let trimmed = username.trim();
    
    if trimmed.is_empty() {
        return Err(AppError::ValidationError(
            "Username cannot be empty".to_string(),
        ));
    }
    
    if trimmed.len() < 3 {
        return Err(AppError::ValidationError(
            "Username must be at least 3 characters".to_string(),
        ));
    }
    
    if trimmed.len() > 50 {
        return Err(AppError::ValidationError(
            "Username must be at most 50 characters".to_string(),
        ));
    }
    
    Ok(())
}

/// Validates an email address.
///
/// # Rules
///
/// - Must contain @ and .
/// - @ must come before .
/// - Must have content before @ and after .
/// - Basic email format check
///
/// # Arguments
///
/// * `email` - Email string to validate
///
/// # Returns
///
/// Returns `Ok(())` if valid, or `AppError::ValidationError` with details if invalid.
pub fn validate_email(email: &str) -> Result<(), AppError> {
    let trimmed = email.trim();
    
    if !trimmed.contains('@') || !trimmed.contains('.') {
        return Err(AppError::ValidationError(
            "Invalid email format".to_string(),
        ));
    }
    
    // Check @ comes before .
    if let Some(at_pos) = trimmed.find('@') {
        // Check there's content before @
        if at_pos == 0 {
            return Err(AppError::ValidationError(
                "Invalid email format".to_string(),
            ));
        }
        
        if let Some(dot_pos) = trimmed.rfind('.') {
            if at_pos >= dot_pos {
                return Err(AppError::ValidationError(
                    "Invalid email format".to_string(),
                ));
            }
        }
    }
    
    Ok(())
}

/// Validates a password.
///
/// # Rules
///
/// - Must be at least 6 characters long
/// - Must be at most 128 characters long
///
/// # Arguments
///
/// * `password` - Password string to validate
///
/// # Returns
///
/// Returns `Ok(())` if valid, or `AppError::ValidationError` with details if invalid.
pub fn validate_password(password: &str) -> Result<(), AppError> {
    if password.len() < 6 {
        return Err(AppError::ValidationError(
            "Password must be at least 6 characters".to_string(),
        ));
    }
    
    if password.len() > 128 {
        return Err(AppError::ValidationError(
            "Password must be at most 128 characters".to_string(),
        ));
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_username() {
        assert!(validate_username("validuser").is_ok());
        assert!(validate_username("ab").is_err());
        assert!(validate_username("").is_err());
        assert!(validate_username("   ").is_err());
    }

    #[test]
    fn test_validate_email() {
        assert!(validate_email("test@example.com").is_ok());
        assert!(validate_email("invalid").is_err());
        assert!(validate_email("test@").is_err());
        assert!(validate_email("@example.com").is_err());
    }

    #[test]
    fn test_validate_password() {
        assert!(validate_password("password123").is_ok());
        assert!(validate_password("12345").is_err());
        assert!(validate_password(&"a".repeat(129)).is_err());
    }
}
