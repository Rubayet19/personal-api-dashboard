from pydantic import BaseModel
from typing import Dict, List, Optional


class DashboardStats(BaseModel):
    """Dashboard statistics schema"""
    total_api_keys: int
    api_calls: int
    success_rate: Optional[float] = None
    average_latency: Optional[float] = None
    rate_limits: Dict[str, dict] = {}


class RequestLog(BaseModel):
    """Request log schema"""
    timestamp: str
    url: str
    method: str
    status_code: int
    time_taken: float 