from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from ..services import gvm_client

router = APIRouter(prefix="/api/quickscans", tags=["quickscans"])


class TlsScanCreate(BaseModel):
    name: str
    hosts: str  # comma-separated IPs or hostnames
    comment: Optional[str] = None


class DiscoveryScanCreate(BaseModel):
    name: str
    hosts: str  # subnet or comma-separated IPs, e.g. "192.168.1.0/24"
    comment: Optional[str] = None


class VulnScanCreate(BaseModel):
    host: str  # single IP to scan
    name: Optional[str] = None


# Known UUIDs of built-in scan configs (gvmd ships these)
DISCOVERY_CONFIG_UUID = "8715c877-47a0-438d-98a3-27c7a6ab2196"
FULL_AND_FAST_CONFIG_UUID = "daba56c8-73ec-11df-a475-002264764cea"


def _get_default_scanner_id() -> str:
    """Find the OpenVAS Default scanner."""
    for s in gvm_client.list_scanners():
        if s.get("name") == "OpenVAS Default":
            return s.get("id")
    # fallback to first scanner
    scanners = gvm_client.list_scanners()
    if scanners:
        return scanners[0].get("id")
    raise RuntimeError("No scanners available")


@router.post("/tls-certificate", status_code=201)
def create_tls_scan(payload: TlsScanCreate):
    """Quick-scan preset for TLS / SSL certificate checks.
    Creates: a TLS-focused port list (if needed), a target, a scan task
    bound to the Discovery config (which includes SSL/TLS NVTs)."""
    try:
        # 1. Get or create TLS port list
        port_list_id = gvm_client.get_or_create_tls_port_list()

        # 2. Create target
        target_id = gvm_client.create_target(
            name=f"{payload.name} (TLS target)",
            hosts=payload.hosts,
            port_list_id=port_list_id,
            comment=payload.comment or "Created by ZeroPoint TLS Quick Scan",
        )

        # 3. Create scan task using Full and Fast config
        # Discovery alone does not include the full SSL/TLS NVT family.
        # Full and Fast covers SSL/TLS thoroughly (cert expiry, weak ciphers,
        # protocol versions, hostname mismatch).
        scanner_id = _get_default_scanner_id()
        task_id = gvm_client.create_task(
            name=f"{payload.name} (TLS scan)",
            target_id=target_id,
            config_id=FULL_AND_FAST_CONFIG_UUID,
            scanner_id=scanner_id,
            comment="TLS / SSL certificate verification scan (Full and Fast config)",
        )

        return {
            "task_id": task_id,
            "target_id": target_id,
            "port_list_id": port_list_id,
            "message": "TLS scan task created. Go to Scans and click Play to start.",
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/discovery", status_code=201)
def create_discovery_scan(payload: DiscoveryScanCreate):
    """Quick-scan preset for network discovery.
    Scans a subnet or host range to find live devices, open ports, and
    running services. Uses gvmd's built-in Discovery scan config."""
    try:
        # 1. Create target (uses the default "All IANA assigned TCP" port list)
        target_id = gvm_client.create_target(
            name=f"{payload.name} (Discovery target)",
            hosts=payload.hosts,
            comment=payload.comment or "Created by ZeroPoint Discovery Scan",
        )

        # 2. Create scan task using Discovery config
        scanner_id = _get_default_scanner_id()
        task_id = gvm_client.create_task(
            name=f"{payload.name} (Discovery)",
            target_id=target_id,
            config_id=DISCOVERY_CONFIG_UUID,
            scanner_id=scanner_id,
            comment="Network discovery scan to find live hosts and services",
        )

        # 3. Start the task immediately
        gvm_client.start_task(task_id)

        return {
            "task_id": task_id,
            "target_id": target_id,
            "message": "Discovery scan created and started. Check Scans page for progress.",
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/vulnerability", status_code=201)
def create_vuln_scan(payload: VulnScanCreate):
    """Quick vulnerability scan for a single host.
    Creates a target and Full and Fast scan task, then starts it
    immediately. Designed for the discovery > scan workflow."""
    try:
        scan_name = payload.name or f"Vuln scan - {payload.host}"

        # 1. Create target for the single host
        target_id = gvm_client.create_target(
            name=f"{scan_name} (target)",
            hosts=payload.host,
            comment="Created from ZeroPoint Discovery results",
        )

        # 2. Create scan task using Full and Fast config
        scanner_id = _get_default_scanner_id()
        task_id = gvm_client.create_task(
            name=scan_name,
            target_id=target_id,
            config_id=FULL_AND_FAST_CONFIG_UUID,
            scanner_id=scanner_id,
            comment=f"Vulnerability scan for {payload.host}",
        )

        # 3. Start immediately
        gvm_client.start_task(task_id)

        return {
            "task_id": task_id,
            "target_id": target_id,
            "message": f"Vulnerability scan started for {payload.host}.",
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
