from .auth import AuthConfig


def get_riff_auth_custom_token_config(*, project_id: str) -> AuthConfig:
    project = "databutton"
    return AuthConfig(
        issuer=f"https://securetoken.google.com/{project}",
        jwks_url="https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
        audience=project,
        required_attributes=[
            ("projectId", project_id),
            ("sub", "riff-auth-custom-token"),
        ],
    )
