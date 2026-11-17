from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=150, example="Laptop Gamer Pro")
    description: Optional[str] = Field(None, max_length=500, example="Intel i7, 16GB RAM, RTX 4060")
    price: float = Field(..., gt=0, example=1299.99)
    category: str = Field(default="General", max_length=100, example="Tecnología")
    stock: int = Field(default=0, ge=0, example=15)


class ProductCreate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
