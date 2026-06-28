"""Runtime configuration loaded from env vars."""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gvm_socket: str = "/run/gvmd/gvmd.sock"
    gvm_user: str = "admin"
    gvm_password: str = "admin"
    app_secret: str = "change-me"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = ".env"
        env_prefix = ""


settings = Settings()
