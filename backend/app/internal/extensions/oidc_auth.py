from pydantic import BaseModel

from .auth import AuthConfig


class OidcAuthExtensionConfig(BaseModel):
    jwksUrl: str
    iss: str
    aud: str | None = None
    requiredAttributes: dict[str, str] = {}


def get_oidc_auth_config(c: OidcAuthExtensionConfig) -> AuthConfig:
    return AuthConfig(
        issuer=c.iss,
        jwks_url=c.jwksUrl,
        audience=c.aud,
        required_attributes=list(c.requiredAttributes.items()),
    )
