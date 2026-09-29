from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel

DataType = TypeVar("DataType")

class ResponseBase(BaseModel, Generic[DataType]):
    success: bool = True
    message: str = "Operation completed successfully"
    data: Optional[DataType] = None

class PaginatedResponse(BaseModel, Generic[DataType]):
    total: int
    page: int
    limit: int
    items: List[DataType]
