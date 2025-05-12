import random
from urllib.parse import parse_qs, urlencode
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from typing import List, Literal, Optional
import hmac
import os
from fastapi_cache import FastAPICache
from fastapi_cache.backends.inmemory import InMemoryBackend
from fastapi_cache.decorator import cache
from apod import get_apod_categories, get_apod_feed, search_apod
from thisiscolossal import get_thisiscolossal_categories, get_thisiscolossal_feed
from ukiyoe import get_ukiyo_e_feed, get_ukiyo_e_categories
from guardian_photos import get_guardian_categories, get_guardian_photos_feed
from reddit import get_reddit_feed, get_reddit_categories
from wikiart import get_popular_artists, get_wikiart_feed, get_wikiart_categories
from dotenv import load_dotenv

# Import for structured search
from llm_research import get_structured_params
from models import BijukaruUrlParams

from schema import Category, Feed


load_dotenv()
if redis_url := os.getenv("REDIS_URL"):
    from redis import asyncio as aioredis
    from fastapi_cache.backends.redis import RedisBackend

    redis = aioredis.from_url(redis_url)
    FastAPICache.init(RedisBackend(redis), prefix="bijukaru")
else:
    FastAPICache.init(InMemoryBackend(), prefix="bijukaru")


app = FastAPI()

if os.getenv("SEARCH_TOKEN") is None:
    raise ValueError("SEARCH_TOKEN is not set in the environment variables")

# Set up templates
templates = Jinja2Templates(directory="templates")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Mount Svelte SPA static files
app.mount("/_app", StaticFiles(directory="static/spa/_app"), name="spa-assets")

media_sources = {
    "apod": {
        "media_source_name": "Astronomy Picture of the Day",
        "media_source_url": "https://apod.nasa.gov/apod/astropix.html",
        "media_hd": "true",
    },
    "thisiscolossal": {
        "media_source_name": "This is Colossal",
        "media_source_url": "https://www.thisiscolossal.com",
        "media_hd": "false",
    },
    "guardian": {
        "media_source_name": "Guardian Photos",
        "media_source_url": "https://www.theguardian.com",
        "media_hd": "false",
    },
    "reddit": {
        "media_source_name": "Reddit",
        "media_source_url": "https://www.reddit.com",
        "media_hd": "true",
    },
    "ukiyo-e": {
        "media_source_name": "Ukiyo-e",
        "media_source_url": "https://ukiyo-e.org",
        "media_hd": "false",
    },
    "wikiart": {
        "media_source_name": "WikiArt",
        "media_source_url": "https://www.wikiart.org",
        "media_hd": "false",
    },
}


@app.get("/", response_class=HTMLResponse)
async def serve_root(request: Request):
    # Serve the Svelte SPA for the root route
    return FileResponse("static/spa/index.html")


@app.get("/api/thisiscolossal/categories", response_model=List[Category])
@cache(expire=3600)  # Cache for 1 hour
async def _get_thisiscolossal_categories():
    return get_thisiscolossal_categories()


@app.get("/api/thisiscolossal/feed", response_model=Feed)
@cache(expire=600)  # Cache for 10 minutes (600 seconds)
async def _get_thisiscolossal_feed(category: Optional[str] = None):
    return await get_thisiscolossal_feed(category)


@app.get("/api/apod/categories", response_model=List[Category])
@cache(expire=3600)  # Cache for 1 hour
async def _get_apod_categories():
    return get_apod_categories()


@app.get("/api/apod/feed", response_model=Feed)
@cache(expire=600)  # Cache for 10 minutes
async def _get_apod_feed(category: str = "2025", hd: bool = False) -> Feed:
    if category.startswith("search:"):
        return await search_apod(category.replace("search:", ""), hd)
    else:
        return await get_apod_feed(year=category, hd=hd)


@app.get("/api/ukiyo-e/categories", response_model=List[Category])
@cache(expire=3600)  # Cache for 1 hour
async def _get_ukiyo_e_categories():
    return get_ukiyo_e_categories()


@app.get("/api/ukiyo-e/feed", response_model=Feed)
@cache(expire=60 * 60 * 24)  # Cache for 1 day
async def _get_ukiyo_e_feed(category: str = "met"):
    # Get multiple pages of data
    items = []
    for start in [1, 100, 200, 300]:
        feed = get_ukiyo_e_feed(category, start)
        items.extend(feed.items)
    return Feed(items=items, category=feed.category)

@app.get("/api/guardian/categories", response_model=List[Category])
@cache(expire=3600)  # Cache for 1 hour
async def _get_guardian_photos_categories():
    return get_guardian_categories()


@app.get("/api/guardian/feed", response_model=Feed)
@cache(expire=60 * 60 * 24)  # Cache for 1 day
async def _get_guardian_photos_feed(category: str = get_guardian_categories()[0].id):
    return get_guardian_photos_feed(category.replace("__", "/"))

@app.get("/api/reddit/categories", response_model=List[Category])
@cache(expire=3600)  # Cache for 1 hour
async def _get_reddit_categories():
    return get_reddit_categories()


@app.get("/api/reddit/feed", response_model=Feed)
@cache(expire=60 * 60 * 24)  # Cache for 1 day
async def _get_reddit_feed(category: str = get_reddit_categories()[0].id, hd: bool = False):
    return get_reddit_feed(category, hd)


@app.get("/api/wikiart/categories", response_model=List[Category])
@cache(expire=3600)  # Cache for 1 hour
async def _get_wikiart_categories():
    return get_wikiart_categories()


@app.get("/api/wikiart/feed")
async def _get_wikiart_feed(
    request: Request, category: str = get_wikiart_categories()[0].id, hd: bool = False
):
    if category == "random-artist":
        _category = "artist:" + random.choice(get_popular_artists())
        return RedirectResponse(
            f"{app.url_path_for('_get_wikiart_feed')}/?category={_category}&hd={hd}"
        )
    else:
        _category = category
    # Send cache control headers
    content = get_wikiart_feed(_category, hd)
    response = JSONResponse(
        content=content.model_dump(),
        headers={
            "Cache-Control": (
                "public, max-age=3600" if category != "random-artist" else "no-cache"
            )
        },
    )
    return response


@app.get("/api/verify_token")
async def verify_token(token: str) -> JSONResponse:
    """
    Verify if the provided token is correct for accessing the search functionality.
    Uses constant time comparison to prevent timing attacks.
    """
    # Use constant time comparison to prevent timing attacks
    search_token = os.getenv("SEARCH_TOKEN")
    if search_token is None:
        return JSONResponse(
            content={"authorized": False, "error": "Server configuration error"},
            status_code=500,
        )

    is_correct = hmac.compare_digest(token, search_token)

    if is_correct:
        return JSONResponse(content={"authorized": True, "message": "Token accepted"})
    else:
        # Don't provide too specific error messages for security
        return JSONResponse(
            content={"authorized": False, "error": "Invalid token"}, status_code=401
        )


@app.get("/api/search")
@cache(expire=60 * 60 * 24)  # Cache for 1 day
async def search_gallery(query: str, token: Optional[str] = None) -> JSONResponse:
    """
    Parses a natural language query to generate gallery parameters and returns a relative URL.
    Requires a valid token for access.
    """
    # Verify token first
    search_token = os.getenv("SEARCH_TOKEN")
    if search_token is None:
        return JSONResponse(
            content={"error": "Server configuration error"}, status_code=500
        )

    if not token or not hmac.compare_digest(token, search_token):
        return JSONResponse(
            content={"error": "Unauthorized. Valid token required for search."},
            status_code=401,
        )

    structured_params: Optional[BijukaruUrlParams] = await get_structured_params(query)
    if structured_params and structured_params.url:
        return JSONResponse(
            content={
                "url": structured_params.url,
                "userfriendly_message": structured_params.userfriendly_message,
            }
        )
    else:
        # You might want to return a more specific error message
        # based on why structured_params is None or has no URL.
        return JSONResponse(
            content={"error": "Could not interpret the search query."}, status_code=400
        )


@app.get("/api/media_sources")
@cache(expire=3600)
async def get_media_sources():
    """Return a list of all available media sources."""
    sources = []
    for source_id, source_info in media_sources.items():
        sources.append(
            {
                "id": source_id,
                "name": source_info["media_source_name"],
                "hdSupported": source_info["media_hd"] == "true",
                "url": source_info["media_source_url"],
            }
        )
    return sources


# This must be last to avoid capturing API routes
@app.get("/{path}", response_class=HTMLResponse)
async def serve_spa(
    request: Request,
    path: Literal["apod", "thisiscolossal", "guardian", "reddit", "ukiyo-e", "wikiart"],
):
    # All non-API routes should be handled by the SPA
    # This includes media source routes like /guardian, /thisiscolossal, etc.
    query_params = request.query_params.items()
    # Remove the source parameter
    query_params = [param for param in query_params if param[0] != "media_source"]
    # Redirect to the new URL with the source parameter
    return RedirectResponse(
        f"/?media_source={path}&{urlencode(query_params)}", status_code=302
    )
