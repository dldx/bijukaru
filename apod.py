from datetime import datetime
from schema import Category, FeedItem, Feed
import httpx


def get_apod_categories():
    # Generate a list of years starting from current year down to 2015
    current_year = datetime.now().year
    categories = []

    for year in range(current_year, 1995, -1):
        categories.append(Category(id=str(year), name=str(year)))

    return categories


async def get_apod_feed(category: str | None = None, hd: bool = False):
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

        items.append(
            FeedItem(
                id=item.get("date"),
                title=item.get("title", "No Title"),
                image_url=item["hdurl"] if ("hdurl" in item and hd) else item["url"],
                link=link,
                description=description,
            )
        )

    return Feed(items=items, category=Category(id=category, name=category))
