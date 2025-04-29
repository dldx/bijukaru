from schema import Category, FeedItem, Feed
from typing import Any, Optional
import httpx
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from functools import lru_cache


class ThisIsColossalCategory(Category):
    def model_post_init(self, __context: Any) -> None:
        if self.id == "":
            self.link = "https://www.thisiscolossal.com/"
        else:
            self.link = f"https://www.thisiscolossal.com/category/{self.id}/"


@lru_cache(maxsize=1)
def get_thisiscolossal_categories():
    # Return the list of categories
    categories = [
        ThisIsColossalCategory(id="", name="All Posts"),
        ThisIsColossalCategory(id="art", name="Art"),
        ThisIsColossalCategory(id="craft", name="Craft"),
        ThisIsColossalCategory(id="design", name="Design"),
        ThisIsColossalCategory(id="photography", name="Photography"),
        ThisIsColossalCategory(id="animation", name="Animation"),
        ThisIsColossalCategory(id="books", name="Books"),
        ThisIsColossalCategory(id="climate", name="Climate"),
        ThisIsColossalCategory(id="film", name="Film"),
        ThisIsColossalCategory(id="history", name="History"),
        ThisIsColossalCategory(id="conversations", name="Conversations"),
        ThisIsColossalCategory(id="illustration", name="Illustration"),
        ThisIsColossalCategory(id="music", name="Music"),
        ThisIsColossalCategory(id="nature", name="Nature"),
        ThisIsColossalCategory(id="opportunities", name="Opportunities"),
        ThisIsColossalCategory(id="science", name="Science"),
        ThisIsColossalCategory(id="social-issues", name="Social Issues"),
    ]
    return categories


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
        title = (
            item.find("title").text if item.find("title") is not None else "No Title"
        )
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
            items.append(
                FeedItem(
                    id=slug,
                    title=title,
                    image_url=image_url,
                    link=link,
                    description=description,
                )
            )

    category_name = list(
        filter(
            lambda x: x.id == (category if category else ""),
            get_thisiscolossal_categories(),
        )
    )
    if len(category_name) > 0:
        category_name = category_name[0].name
    else:
        category_name = category

    return Feed(
        items=items,
        category=ThisIsColossalCategory(
            id=category if category else "", name=category_name
        ),
    )
