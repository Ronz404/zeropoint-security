from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from ..services import gvm_client

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


class EmailAlertCreate(BaseModel):
    name: str
    recipient: str  # email address
    on_severity_at_least: float = 7.0  # only fire if severity >= this
    comment: Optional[str] = None


@router.get("")
def list_alerts():
    try:
        return gvm_client.list_alerts()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("", status_code=201)
def create_email_alert(payload: EmailAlertCreate):
    try:
        alert_id = gvm_client.create_email_alert(
            name=payload.name,
            recipient=payload.recipient,
            on_severity_at_least=payload.on_severity_at_least,
            comment=payload.comment,
        )
        return {"id": alert_id}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.delete("/{alert_id}", status_code=204)
def delete_alert(alert_id: str):
    try:
        gvm_client.delete_alert(alert_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
