from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RateLimit(BaseModel):
    """Rate limit information for an API"""
    api_name: str = Field(..., description="Name of the API service")
    limit: int = Field(..., description="Total request limit")
    remaining: int = Field(..., description="Remaining requests")
    reset_time: Optional[datetime] = Field(None, description="When the rate limit resets")
    last_updated: datetime = Field(..., description="When this rate limit data was last updated")
    
    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }


class RateLimitCreate(BaseModel):
    """Schema for creating a rate limit entry"""
    api_name: str = Field(..., description="Name of the API service")
    limit: int = Field(..., description="Total request limit")
    remaining: int = Field(..., description="Remaining requests")
    reset_time: Optional[datetime] = Field(None, description="When the rate limit resets")


class RateLimitUpdate(BaseModel):
    """Schema for updating a rate limit entry"""
    limit: Optional[int] = None
    remaining: Optional[int] = None
    reset_time: Optional[datetime] = None 