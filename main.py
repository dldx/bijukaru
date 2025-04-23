# main.py
from fastapi import FastAPI, Request, Response, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import httpx
import xml.etree.ElementTree as ET
import re
from bs4 import BeautifulSoup
from pydantic import BaseModel
from typing import List, Optional
from starlette.middleware.sessions import SessionMiddleware
import json
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from fastapi_cache.decorator import cache

FastAPICache.init(InMemoryBackend(), prefix="colossal-gallery")

app = FastAPI()


# Set up templates
templates = Jinja2Templates(directory="templates")

class FeedItem(BaseModel):
    title: str
    image_url: str
    link: str
    description: Optional[str] = None

class Category(BaseModel):
    id: str
    name: str

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/categories", response_model=List[Category])
@cache(expire=3600)  # Cache for 1 hour
async def get_categories():
    # Return the list of categories
    categories = [
        Category(id="", name="All Posts"),
        Category(id="art", name="Art"),
        Category(id="craft", name="Craft"),
        Category(id="design", name="Design"),
        Category(id="photography", name="Photography"),
        Category(id="animation", name="Animation"),
        Category(id="books", name="Books"),
        Category(id="climate", name="Climate"),
        Category(id="film", name="Film"),
        Category(id="history", name="History"),
        Category(id="conversations", name="Conversations"),
        Category(id="illustration", name="Illustration"),
        Category(id="music", name="Music"),
        Category(id="nature", name="Nature"),
        Category(id="opportunities", name="Opportunities"),
        Category(id="science", name="Science"),
        Category(id="social-issues", name="Social Issues"),
    ]
    return categories

@app.get("/api/feed", response_model=List[FeedItem])
@cache(expire=600)  # Cache for 10 minutes (600 seconds)
async def get_feed(category: Optional[str] = None):
    # Construct the feed URL based on the category
    if category:
        feed_url = f"https://www.thisiscolossal.com/category/{category}/feed/"
    else:
        feed_url = "https://www.thisiscolossal.com/feed/"

    # Fetch the RSS feed
    async with httpx.AsyncClient() as client:
        response = await client.get(feed_url)

    if response.status_code != 200:
        return []

    # Parse the XML
    root = ET.fromstring(response.text)

    # Find the namespace
    ns = {"content": "http://purl.org/rss/1.0/modules/content/"}

    items = []
    for item in root.findall(".//item"):
        title = item.find("title").text if item.find("title") is not None else "No Title"
        link = item.find("link").text if item.find("link") is not None else "#"

        # Extract the content
        content_element = item.find(".//content:encoded", ns)
        content = content_element.text if content_element is not None else ""

        # Parse the HTML content to find the first image
        soup = BeautifulSoup(content, "html.parser")
        img_tag = soup.find("img")

        image_url = ""
        if img_tag and img_tag.get("src"):
            image_url = img_tag.get("src")

        # Get a short description
        description_element = item.find("description")
        description = ""
        if description_element is not None and description_element.text:
            # Clean HTML tags
            soup = BeautifulSoup(description_element.text, "html.parser")
            description = soup.get_text()[:200] + "..." if len(soup.get_text()) > 200 else soup.get_text()

        # Only add items that have images
        if image_url:
            items.append(FeedItem(
                title=title,
                image_url=image_url,
                link=link,
                description=description
            ))

    return items  # Return items with images
