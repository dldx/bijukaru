# main.py
from fastapi import FastAPI, Request, Response, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import httpx
import xml.etree.ElementTree as ET
import re
from bs4 import BeautifulSoup
from pydantic import BaseModel, computed_field
from typing import List, Literal, Optional
from starlette.middleware.sessions import SessionMiddleware
import json
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
import hashlib
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from fastapi_cache.decorator import cache
from ukiyoe import get_ukiyo_e_feed, get_ukiyo_e_categories
from guardian_photos import get_guardian_categories, get_guardian_photos_feed

from schema import FeedItem, Category

FastAPICache.init(InMemoryBackend(), prefix="bijukaru")

app = FastAPI()


# Set up templates
templates = Jinja2Templates(directory="templates")

media_sources = {
    "thisiscolossal": {
        "media_source_name": "This is Colossal",
        "media_source_url": "https://www.thisiscolossal.com",
        "media_hd": "false"
    },
    "apod": {
        "media_source_name": "Astronomy Picture of the Day",
        "media_source_url": "https://apod.nasa.gov/apod/astropix.html",
        "media_hd_option": "true"
    },
    "ukiyo-e": {
        "media_source_name": "Ukiyo-e",
        "media_source_url": "https://ukiyo-e.org",
        "media_hd": "false"
    },
    "guardian": {
        "media_source_name": "Guardian Photos",
        "media_source_url": "https://www.theguardian.com",
        "media_hd": "false"
    }
}

@app.get("/{media_source}", response_class=HTMLResponse)
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request, media_source: Literal["thisiscolossal", "apod", "ukiyo-e", "guardian"] = "thisiscolossal"):
    return templates.TemplateResponse("index.html", {"request": request, "media_source": media_source, **media_sources[media_source]})

@app.get("/api/thisiscolossal/categories", response_model=List[Category])
@cache(expire=3600)  # Cache for 1 hour
async def get_thisiscolossal_categories():
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

@app.get("/api/thisiscolossal/feed", response_model=List[FeedItem])
@cache(expire=600)  # Cache for 10 minutes (600 seconds)
async def get_thisiscolossal_feed(category: Optional[str] = None):
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
        slug = item.find("link").text.removesuffix("/").split("/")[-1]

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
            description = soup.get_text()

        # Only add items that have images
        if image_url:
            items.append(FeedItem(
                id=slug,
                title=title,
                image_url=image_url,
                link=link,
                description=description
            ))

    return items  # Return items with images

@app.get("/api/apod/categories", response_model=List[Category])
@cache(expire=3600)  # Cache for 1 hour
async def get_apod_categories():
    # Generate a list of years starting from current year down to 2015
    current_year = datetime.now().year
    categories = []

    for year in range(current_year, 1995, -1):
        categories.append(Category(id=str(year), name=str(year)))

    return categories

@app.get("/api/apod/feed", response_model=List[FeedItem])
@cache(expire=600)  # Cache for 10 minutes
async def get_apod_feed(category: Optional[str] = None, hd: bool = False):
    # Determine start_date based on category (which is a year)
    if category and category.isdigit():
        start_date = f"{category}-01-01"
    else:
        # If no category or invalid, use current year
        current_year = datetime.now().year
        start_date = f"{current_year}-01-01"

    # Construct the API URL
    api_url = f"https://apod.ellanan.com/api?start_date={start_date}&limit=365"

    # Fetch the JSON data
    async with httpx.AsyncClient() as client:
        response = await client.get(api_url)

    if response.status_code != 200:
        return []

    # Parse the JSON data
    apod_items = response.json()

    # Convert to FeedItem format
    items = []
    for item in apod_items:
        # Skip items without images or with media_type other than image
        if "url" not in item or item.get("media_type") != "image":
            continue

        # For APOD, the link should go to the official NASA APOD page
        date_parts = item["date"].split("-")
        link = f"https://apod.nasa.gov/apod/ap{date_parts[0][2:]}{date_parts[1]}{date_parts[2]}.html"

        description = item.get("explanation", "")

        items.append(FeedItem(
            id=item.get("date"),
            title=item.get("title", "No Title"),
            image_url=item["hdurl"] if ("hdurl" in item and hd) else item["url"],
            link=link,
            description=description
        ))

    return items

@app.get("/api/ukiyo-e/categories", response_model=List[Category])
@cache(expire=3600)  # Cache for 1 hour
async def _get_ukiyo_e_categories():
    return get_ukiyo_e_categories()

@app.get("/api/ukiyo-e/feed", response_model=List[FeedItem])
@cache(expire=60 * 60 * 24)  # Cache for 1 day
async def _get_ukiyo_e_feed(category: str = "met"):
    # Get multiple pages of data
    items = []
    for start in [1, 100, 200, 300]:
        items.extend(get_ukiyo_e_feed(category, start))
    return items

@app.get("/api/guardian/categories", response_model=List[Category])
@cache(expire=3600)  # Cache for 1 hour
async def _get_guardian_photos_categories():
    return get_guardian_categories()

@app.get("/api/guardian/feed", response_model=List[FeedItem])
@cache(expire=60 * 60 * 24)  # Cache for 1 day
async def _get_guardian_photos_feed(category: str = "artanddesign__gallery__2022__feb__17__ansel-adams-rare-photographs-in-stunning-hi-definition"):
    return get_guardian_photos_feed(category.replace("__", "/"))

@app.get("/api/media_sources")
@cache(expire=3600)
async def get_media_sources():
    """Return a list of all available media sources."""
    sources = []
    for source_id, source_info in media_sources.items():
        sources.append({
            "id": source_id,
            "name": source_info["media_source_name"]
        })
    return sources
