from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

from ..schemas.stats import DashboardStats
from ..utils.auth import get_current_user
from ..utils.mock_db import get_api_keys_for_user, get_requests_log
from ..utils import redis_client

router = APIRouter(
    prefix="/api/stats",
    tags=["stats"],
    dependencies=[Depends(get_current_user)],
)


@router.get("", response_model=DashboardStats)
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """
    Get dashboard statistics for the current user
    """
    user_id = current_user["sub"]
    
    # Get API keys for the user
    api_keys = get_api_keys_for_user(user_id)
    total_api_keys = len(api_keys) if api_keys else 0
    
    # Get request logs from the last 30 days
    request_logs = get_requests_log(user_id, days=30)
    total_requests = len(request_logs) if request_logs else 0
    
    # Calculate success rate and average latency
    success_rate = None
    average_latency = None
    
    if total_requests > 0:
        # Count successful requests (status code < 400)
        successful_requests = sum(1 for req in request_logs if req["status_code"] < 400)
        success_rate = (successful_requests / total_requests) * 100
        
        # Calculate average latency
        latencies = [req["time_taken"] for req in request_logs if "time_taken" in req]
        if latencies:
            average_latency = sum(latencies) / len(latencies)
    
    # Get rate limit information
    rate_limits = {}
    rate_limit_data = redis_client.get_all_rate_limits(user_id=user_id)
    
    if rate_limit_data:
        for limit in rate_limit_data:
            rate_limits[limit.api_name] = {
                "limit": limit.limit,
                "remaining": limit.remaining,
                "reset_time": limit.reset_time.isoformat() if limit.reset_time else None,
                "last_updated": limit.last_updated.isoformat(),
                "percentage": round((limit.remaining / limit.limit) * 100) if limit.limit > 0 else 0
            }
    
    # Return the dashboard stats
    return DashboardStats(
        total_api_keys=total_api_keys,
        api_calls=total_requests,
        success_rate=success_rate,
        average_latency=average_latency,
        rate_limits=rate_limits
    ) 