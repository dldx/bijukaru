from pydantic import BaseModel
from typing import Optional

class FeedItem(BaseModel):
    id: str
    title: str
    image_url: str
    link: str
    description: Optional[str] = None

class Category(BaseModel):
    id: str
    name: str