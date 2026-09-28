

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext

from schemas import TokenData


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "development-secret-key-change-this",
)

ALGORITHM = os.getenv(
    "ALGORITHM",
    "HS256",
)

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "60",
    )
)


# ============================================================
# PASSWORD HASHING
# ============================================================

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    """
    Hash a user's password using bcrypt.

    bcrypt supports passwords up to 72 bytes.
    """

    password_bytes = password.encode("utf-8")

    if len(password_bytes) > 72:
        raise ValueError(
            "Password cannot be longer than 72 bytes."
        )

    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """
    Verify a plain-text password against
    the stored bcrypt hash.
    """

    password_bytes = plain_password.encode("utf-8")

    if len(password_bytes) > 72:
        return False

    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


# ============================================================
# JWT - CREATE TOKEN
# ============================================================

def create_access_token(
    username: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create a JWT access token containing
    the user's username.
    """

    if expires_delta is None:
        expires_delta = timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    expire = (
        datetime.now(timezone.utc)
        + expires_delta
    )

    payload = {
        "sub": username,
        "exp": expire,
    }

    token = jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return token


# ============================================================
# JWT - DECODE TOKEN
# ============================================================

def decode_access_token(
    token: str,
) -> Optional[TokenData]:
    """
    Decode and validate a JWT token.

    Returns TokenData when valid.
    Returns None when invalid or expired.
    """

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        username = payload.get("sub")

        if username is None:
            return None

        return TokenData(
            username=username
        )

    except JWTError:
        return None
        