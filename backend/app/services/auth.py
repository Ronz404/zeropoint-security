"""Authentication & RBAC service using JWT tokens."""
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from ..config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# JWT config
# ---------------------------------------------------------------------------
SECRET_KEY = settings.app_secret
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# ---------------------------------------------------------------------------
# Simple password hashing (SHA-256 + salt, no bcrypt dependency issues)
# ---------------------------------------------------------------------------

_SALT = "zeropoint-capstone-2026"


def _hash_pw(plain: str) -> str:
    return hashlib.sha256(f"{_SALT}:{plain}".encode()).hexdigest()


def _verify_pw(plain: str, hashed: str) -> bool:
    return _hash_pw(plain) == hashed


# ---------------------------------------------------------------------------
# User model (hardcoded users for capstone demo)
# ---------------------------------------------------------------------------

class UserInDB(BaseModel):
    username: str
    hashed_password: str
    role: str  # "admin" or "viewer"
    full_name: str


USERS_DB: dict[str, UserInDB] = {
    "admin": UserInDB(
        username="admin",
        hashed_password=_hash_pw("admin123"),
        role="admin",
        full_name="Administrator",
    ),
    "viewer": UserInDB(
        username="viewer",
        hashed_password=_hash_pw("viewer123"),
        role="viewer",
        full_name="Read-Only User",
    ),
}


class TokenData(BaseModel):
    username: str
    role: str


class UserOut(BaseModel):
    username: str
    role: str
    full_name: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    user = USERS_DB.get(username)
    if not user:
        return None
    if not _verify_pw(password, user.hashed_password):
        return None
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ---------------------------------------------------------------------------
# Dependencies (inject into route handlers)
# ---------------------------------------------------------------------------

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserOut:
    """Decode JWT and return the current user. Raises 401 if invalid."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None or role is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = USERS_DB.get(username)
    if user is None:
        raise credentials_exception

    return UserOut(username=user.username, role=user.role, full_name=user.full_name)


async def require_admin(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    """Only allow admin users. Raises 403 if viewer."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user
