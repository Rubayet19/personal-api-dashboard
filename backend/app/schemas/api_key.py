from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ApiKeyBase(BaseModel):
    api_name: str
    api_key: str

class ApiKeyCreate(ApiKeyBase):
    pass

class ApiKeyUpdate(BaseModel):
    api_name: Optional[str] = None
    api_key: Optional[str] = None

class ApiKeyInDB(ApiKeyBase):
    id: str
    user_id: str
    encrypted_key: str
    created_at: datetime
    updated_at: datetime

class ApiKey(ApiKeyBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 