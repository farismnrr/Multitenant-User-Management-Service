use crate::errors::AppError;

/// Validates SSO parameters (state, nonce, redirect_uri)
///
/// Rules:
/// - Max length: 128 characters
/// - State/Nonce: Alphanumeric only
/// - Redirect URI: Must be a valid URI format (basic check)
pub fn validate_sso_params(
    state: &Option<String>,
    nonce: &Option<String>,
    redirect_uri: &Option<String>,
) -> Result<(), AppError> {
    const MAX_LENGTH: usize = 128;

    if let Some(s) = state {
        if s.len() > MAX_LENGTH {
            return Err(AppError::ValidationError(format!(
                "State parameter too long (max {} chars)",
                MAX_LENGTH
            ), None));
        }
        if !s.chars().all(char::is_alphanumeric) {
            return Err(AppError::ValidationError(
                "State parameter must be alphanumeric".to_string(),
                None
            ));
        }
    }

    if let Some(n) = nonce {
        if n.len() > MAX_LENGTH {
            return Err(AppError::ValidationError(format!(
                "Nonce parameter too long (max {} chars)",
                MAX_LENGTH
            ), None));
        }
        if !n.chars().all(char::is_alphanumeric) {
            return Err(AppError::ValidationError(
                "Nonce parameter must be alphanumeric".to_string(),
                None
            ));
        }
    }

    if let Some(uri) = redirect_uri {
        if uri.len() > 256 {
            // slightly larger limit for URIs
            return Err(AppError::ValidationError(
                "Redirect URI too long (max 256 chars)".to_string(),
                None
            ));
        }
        // Basic URI validation - preventing obvious script injection
        if uri.contains('<') || uri.contains('>') || uri.contains('"') || uri.contains('\'') {
            return Err(AppError::ValidationError(
                "Redirect URI contains invalid characters".to_string(),
                None
            ));
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_params() {
        let state = Some("validState123".to_string());
        let nonce = Some("validNonce456".to_string());
        let redirect_uri = Some("https://example.com/callback".to_string());

        assert!(validate_sso_params(&state, &nonce, &redirect_uri).is_ok());
    }

    #[test]
    fn test_empty_params() {
        assert!(validate_sso_params(&None, &None, &None).is_ok());
    }

    #[test]
    fn test_state_too_long() {
        let state = Some("a".repeat(129));
        let result = validate_sso_params(&state, &None, &None);
        assert!(matches!(result, Err(AppError::ValidationError(..))));
    }

    #[test]
    fn test_state_invalid_chars() {
        let state = Some("invalid-state!".to_string());
        let result = validate_sso_params(&state, &None, &None);
        assert!(matches!(result, Err(AppError::ValidationError(..))));
    }

    #[test]
    fn test_nonce_too_long() {
        let nonce = Some("a".repeat(129));
        let result = validate_sso_params(&None, &nonce, &None);
        assert!(matches!(result, Err(AppError::ValidationError(..))));
    }

    #[test]
    fn test_nonce_invalid_chars() {
        let nonce = Some("invalid_nonce".to_string());
        let result = validate_sso_params(&None, &nonce, &None);
        assert!(matches!(result, Err(AppError::ValidationError(..))));
    }

    #[test]
    fn test_redirect_uri_too_long() {
        let uri = Some("https://example.com/".to_string() + &"a".repeat(250));
        let result = validate_sso_params(&None, &None, &uri);
        assert!(matches!(result, Err(AppError::ValidationError(..))));
    }

    #[test]
    fn test_redirect_uri_injection() {
        let uri = Some("https://example.com/<script>".to_string());
        let result = validate_sso_params(&None, &None, &uri);
        assert!(matches!(result, Err(AppError::ValidationError(..))));
    }
}

