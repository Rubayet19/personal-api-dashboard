from pydantic import BaseModel, HttpUrl, Field
from typing import Dict, Any, Optional, Union
from enum import Enum


class HttpMethod(str, Enum):
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"
    HEAD = "HEAD"
    OPTIONS = "OPTIONS"


class ProxyRequest(BaseModel):
    url: HttpUrl
    method: HttpMethod = HttpMethod.GET
    headers: Dict[str, str] = Field(default_factory=dict)
    body: Optional[Union[Dict[str, Any], str]] = None
    api_key_id: Optional[str] = None


class ProxyResponse(BaseModel):
    status_code: int
    headers: Dict[str, str]
    body: Any
    time_taken: float 