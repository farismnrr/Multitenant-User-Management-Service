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
    log::info!("Checking username: '{}' (len: {})", username, username.trim().len());
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

    // Check for allowed characters (alphanumeric, underscore, dash)
    if !trimmed.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '-') {
        return Err(AppError::ValidationError(
            "Validation Error".to_string(),
        ));
    }

    // Check for reserved words
    let reserved_words = [
        "admin", "root", "system", "superuser", "administrator", "god", 
        "null", "undefined", "test", "demo"
    ];
    
    if reserved_words.contains(&trimmed.to_lowercase().as_str()) {
        return Err(AppError::Conflict(
            "Reserved Username".to_string(),
        )); 
    }
    
    validate_no_xss(trimmed)?;
    
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
            "Validation Error".to_string(),
        ));
    }
    
    // Check @ comes before .
    if let Some(at_pos) = trimmed.find('@') {
        // Check there's content before @
        if at_pos == 0 {
            return Err(AppError::ValidationError(
                "Validation Error".to_string(),
            ));
        }
        
        if let Some(dot_pos) = trimmed.rfind('.') {
            if at_pos >= dot_pos {
                return Err(AppError::ValidationError(
                    "Validation Error".to_string(),
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
            "Validation Error (Password too weak)".to_string(),
        ));
    }
    
    if password.len() > 128 {
        return Err(AppError::ValidationError(
            "Validation Error".to_string(),
        ));
    }
    
    Ok(())
}


pub fn validate_no_xss(input: &str) -> Result<(), AppError> {
    if input.contains('<') || input.contains('>') || input.contains("javascript:") {
        return Err(AppError::ValidationError("Validation Error".to_string()));
    }
    Ok(())
}

pub fn validate_phone(phone: &str) -> Result<(), AppError> {
     // Basic format: +1234567890 (Must start with +, only digits)
     if !phone.starts_with('+') {
        return Err(AppError::ValidationError("Validation Error".to_string()));
     }
     if !phone[1..].chars().all(|c| c.is_digit(10)) {
        return Err(AppError::ValidationError("Validation Error".to_string()));
     }
     if phone.len() < 10 || phone.len() > 15 {
         return Err(AppError::ValidationError("Validation Error".to_string()));
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
