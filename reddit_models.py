from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

class RedditImageResolution(BaseModel):
    url: str = Field(validation_alias="u", serialization_alias="url")
    width: int = Field(validation_alias="x", serialization_alias="width")
    height: int = Field(validation_alias="y", serialization_alias="height")

    class Config:
        populate_by_name = True

class RedditImageSource(BaseModel):
    url: str
    width: int
    height: int

    class Config:
        populate_by_name = True

class RedditImagePreview(BaseModel):
    source: Union[RedditImageSource, RedditImageResolution]
    resolutions: List[RedditImageResolution]
    variants: Optional[Dict] = None

    class Config:
        populate_by_name = True

class RedditPreview(BaseModel):
    images: List[RedditImagePreview]
    enabled: bool

    class Config:
        populate_by_name = True

class RedditImageMetadata(BaseModel):
    status: str
    e: str
    m: str
    p: List[RedditImageResolution]
    s: RedditImageResolution
    id: str

    class Config:
        populate_by_name = True

class RedditGalleryItem(BaseModel):
    media_id: str
    id: int

    class Config:
        populate_by_name = True

class RedditGalleryData(BaseModel):
    items: List[RedditGalleryItem]

    class Config:
        populate_by_name = True

class RedditPostData(BaseModel):
    id: str
    title: str
    subreddit: str
    selftext: str = ""
    is_gallery: bool = False
    post_hint: Optional[str] = None
    preview: Optional[RedditPreview] = None
    gallery_data: Optional[RedditGalleryData] = None
    media_metadata: Optional[Dict[str, RedditImageMetadata]] = None
    permalink: str
    url: str
    author: Optional[str] = None
    created_utc: Optional[float] = None
    ups: Optional[int] = None
    upvote_ratio: Optional[float] = None
    num_comments: Optional[int] = None

    class Config:
        populate_by_name = True

class RedditPost(BaseModel):
    kind: str = "t3"
    data: RedditPostData

    class Config:
        populate_by_name = True

class RedditListing(BaseModel):
    after: Optional[str] = None
    before: Optional[str] = None
    children: List[RedditPost]
    dist: Optional[int] = None

    class Config:
        populate_by_name = True

class RedditResponse(BaseModel):
    kind: str
    data: RedditListing

    class Config:
        populate_by_name = True