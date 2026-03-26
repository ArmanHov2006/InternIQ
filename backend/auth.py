import json
import os
from typing import Any, Dict
from urllib.error import URLError
from urllib.request import urlopen

from fastapi import Header, HTTPException
from jose import JWTError, jwt


def _get_jwks_url() -> str:
    configured = os.getenv("SUPABASE_JWKS_URL", "").strip()
    if configured:
        return configured

    supabase_url = (
        os.getenv("SUPABASE_URL", "").strip()
        or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "").strip()
    )
    if not supabase_url:
        return ""

    return f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"


def _decode_token(token: str) -> Dict[str, Any]:
    header = jwt.get_unverified_header(token)
    alg = str(header.get("alg", "")).upper()

    # Legacy Supabase projects can still use HS256 shared-secret signing.
    if alg.startswith("HS") or not alg:
        secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()
        if not secret:
            raise HTTPException(status_code=500, detail="Server auth is not configured")
        return jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )

    # Newer Supabase projects may use asymmetric signing (RS256/ES256) via JWKS.
    if alg.startswith("RS") or alg.startswith("ES"):
        jwks_url = _get_jwks_url()
        if not jwks_url:
            raise HTTPException(
                status_code=500,
                detail="Server auth is not configured for asymmetric Supabase JWTs",
            )

        try:
            with urlopen(jwks_url, timeout=8) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except URLError as exc:
            raise HTTPException(
                status_code=500, detail="Could not load Supabase JWKS"
            ) from exc

        keys = payload.get("keys")
        if not isinstance(keys, list) or not keys:
            raise HTTPException(status_code=500, detail="Invalid Supabase JWKS payload")

        kid = header.get("kid")
        jwk_key = next(
            (
                key
                for key in keys
                if isinstance(key, dict) and (kid is None or key.get("kid") == kid)
            ),
            None,
        )
        if not isinstance(jwk_key, dict):
            raise HTTPException(status_code=401, detail="Invalid token key id")

        return jwt.decode(
            token,
            jwk_key,
            algorithms=[alg],
            options={"verify_aud": False},
        )

    raise HTTPException(status_code=401, detail="Unsupported token algorithm")


def verify_token(authorization: str | None = Header(default=None)) -> str:
    if authorization is None:
        raise HTTPException(status_code=401, detail="Missing authorization header")

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    try:
        payload = _decode_token(token)
        user_id = payload.get("sub")
        if not isinstance(user_id, str) or not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc
