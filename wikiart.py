import requests
from pydantic import BaseModel, Field, AliasPath, AliasChoices
from typing import Any, Optional
from schema import FeedItem, Category, Feed
import re
from functools import lru_cache

class WikiArtArtwork(BaseModel):
    title: str
    contentId: str | int = Field(
        validation_alias=AliasChoices("id", "contentId"),
        serialization_alias="contentId",
    )
    artistName: str
    yearAsString: Optional[str] = Field(
        validation_alias=AliasChoices("year", "yearAsString"),
        serialization_alias="yearAsString",
    )
    width: int
    image: str
    height: int
    paintingUrl: Optional[str] = None

    @property
    def image_url(self) -> str:
        """Get the image URL, removing the size suffix if it exists."""
        return self.image.split("!")[0]

    @property
    def artist_slug(self) -> str:
        """Extract the artist slug from the image URL."""
        # Example: "https://uploads7.wikiart.org/00215/images/marina-abramovic/marina-rest-energy-290.jpg!Large.jpg"
        # We want to extract "marina-abramovic"
        match = re.search(r"images/([^/]+)/", self.image)
        if match:
            return match.group(1)
        return self.artistName.lower().replace(" ", "-")

    @property
    def link(self) -> str:
        """Get the artwork page URL."""
        if self.paintingUrl:
            return f"https://www.wikiart.org{self.paintingUrl}"

        url = f"https://www.wikiart.org/en/{self.artist_slug}/{self.title.lower().replace(' ', '-').replace(',', '')}"
        if self.yearAsString:
            url += f"-{self.yearAsString}"
        return url


class WikiArtCategory(Category):
    def model_post_init(self, __context: Any) -> None:
        if self.id.startswith("artist:"):
            self.link = f"https://www.wikiart.org/en/{self.id.replace('artist:', '')}"
        elif self.id.startswith("style:"):
            self.link = f"https://www.wikiart.org/en/paintings-by-style/{self.id.replace('style:', '')}"
        elif self.id == "most-viewed":
            self.link = "https://www.wikiart.org/en/popular-paintings/alltime"


@lru_cache(maxsize=1)
def get_wikiart_categories() -> list[WikiArtCategory]:
    """Get a list of popular artists as categories."""
    return (
        [
            WikiArtCategory(id="most-viewed", name="Most viewed"),
            WikiArtCategory(id="random-artist", name="Random artist"),
            WikiArtCategory(id="artist:ansel-adams", name="Ansel Adams"),
        ]
        + sorted(
            [
                WikiArtCategory(id="artist:rene-magritte", name="René Magritte"),
                WikiArtCategory(id="artist:pablo-picasso", name="Pablo Picasso"),
                WikiArtCategory(id="artist:vincent-van-gogh", name="Vincent van Gogh"),
                WikiArtCategory(id="artist:claude-monet", name="Claude Monet"),
                WikiArtCategory(id="artist:salvador-dali", name="Salvador Dalí"),
                WikiArtCategory(id="artist:edvard-munch", name="Edvard Munch"),
                WikiArtCategory(id="artist:gustav-klimt", name="Gustav Klimt"),
                WikiArtCategory(
                    id="artist:pierre-auguste-renoir", name="Pierre-Auguste Renoir"
                ),
                WikiArtCategory(id="artist:paul-cezanne", name="Paul Cézanne"),
                WikiArtCategory(id="artist:henri-matisse", name="Henri Matisse"),
                WikiArtCategory(id="artist:edward-hopper", name="Edward Hopper"),
                WikiArtCategory(id="artist:frida-kahlo", name="Frida Kahlo"),
                WikiArtCategory(id="artist:georgia-o-keeffe", name="Georgia O'Keeffe"),
                WikiArtCategory(id="artist:mary-cassatt", name="Mary Cassatt"),
                WikiArtCategory(
                    id="artist:tamara-de-lempicka", name="Tamara de Lempicka"
                ),
                WikiArtCategory(id="artist:berthe-morisot", name="Berthe Morisot"),
                WikiArtCategory(id="artist:suzanne-valadon", name="Suzanne Valadon"),
                WikiArtCategory(
                    id="artist:helen-frankenthaler", name="Helen Frankenthaler"
                ),
                WikiArtCategory(id="artist:agnes-martin", name="Agnes Martin"),
                WikiArtCategory(id="artist:joan-mitchell", name="Joan Mitchell"),
                WikiArtCategory(id="artist:lee-krasner", name="Lee Krasner"),
                WikiArtCategory(id="artist:yayoi-kusama", name="Yayoi Kusama"),
                WikiArtCategory(id="artist:banksy", name="Banksy"),
                WikiArtCategory(
                    id="artist:jean-michel-basquiat", name="Jean-Michel Basquiat"
                ),
                WikiArtCategory(id="artist:keith-haring", name="Keith Haring"),
                WikiArtCategory(id="artist:cindy-sherman", name="Cindy Sherman"),
                WikiArtCategory(id="artist:gerhard-richter", name="Gerhard Richter"),
                WikiArtCategory(id="artist:ai-weiwei", name="Ai Weiwei"),
                WikiArtCategory(id="artist:marina-abramovic", name="Marina Abramović"),
                WikiArtCategory(id="artist:jenny-saville", name="Jenny Saville"),
            ],
            key=lambda x: x.name.split(" ")[-1],
        )
        + [
            WikiArtCategory(id="style:feminist-art", name="Style: Feminist Art"),
            WikiArtCategory(id="style:naturalism", name="Style: Naturalism"),
            WikiArtCategory(id="style:suiboku-ga-0", name="Style: Sumi-e"),
            WikiArtCategory(id="style:ukiyo-e", name="Style: Ukiyo-e"),
        ]
    )


@lru_cache(maxsize=1)
def get_popular_artists() -> list[str]:
    """Get a list of popular artists."""
    url = "https://www.wikiart.org/en/app/api/popularartists?json=1"
    response = requests.get(url)
    return [artist["url"] for artist in response.json()]


@lru_cache(maxsize=1024)
def get_wikiart_feed(category: str, hd: bool = False) -> Feed:
    """Fetch artworks for a specific artist from WikiArt."""
    import random

    url = "https://www.wikiart.org"
    if category == "most-viewed":
        url = f"https://www.wikiart.org/en/App/Painting/MostViewedPaintings?offset=0&quantity=50&limit=100&randomSeed={random.randint(0, 1000)}&json=2"
    if category.startswith("artist:"):
        url = f"https://www.wikiart.org/en/App/Painting/PaintingsByArtist?artistUrl={category.replace('artist:', '')}&json=2"
    elif category.startswith("style:"):
        url = f"https://www.wikiart.org/en/paintings-by-style/{category.replace('style:', '')}?select=featured&json=2&quantity=50"

    # Spoof a browser request
    response = requests.get(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
    )

    if response.status_code != 200:
        raise Exception(
            f"Failed to fetch WikiArt feed for artist {category}. Status code: {response.status_code}"
        )

    try:
        response_data = response.json()
    except requests.exceptions.JSONDecodeError as e:
        print(
            f"Error decoding JSON from WikiArt API. Response text: {response.text[:200]}..."
        )
        raise Exception(f"Invalid JSON response from WikiArt API: {str(e)}")

    # Parse the JSON response into WikiArtArtwork objects
    if category.startswith("style:"):
        if "Paintings" not in response_data:
            raise Exception(
                f"Expected 'Paintings' key in response for style category {category}"
            )
        artworks = [
            WikiArtArtwork.model_validate(artwork)
            for artwork in response_data["Paintings"]
        ]
    else:
        if not isinstance(response_data, list):
            raise Exception(
                f"Expected list response for category {category}, got {type(response_data)}"
            )
        artworks = [WikiArtArtwork.model_validate(artwork) for artwork in response_data]

    # Convert to FeedItem format
    items = []
    for artwork in artworks:
        items.append(
            FeedItem(
                id=str(artwork.contentId),
                title=(
                    f"{artwork.title} ({artwork.yearAsString}) | {artwork.artistName}"
                    if category in ["most-viewed", "random-artist"]
                    or category.startswith("style:")
                    else (
                        f"{artwork.title} ({artwork.yearAsString})"
                        if artwork.yearAsString
                        else artwork.title
                    )
                ),
                description="",
                image_url=artwork.image_url,
                link=artwork.link,
                artist_name=artwork.artistName,
            )
        )

    category_name = list(filter(lambda x: x.id == category, get_wikiart_categories()))
    if len(category_name) > 0:
        category_name = category_name[0].name
    else:
        if category.startswith("artist:"):
            category_name = items[0].artist_name
        else:
            category_name = category

    return Feed(
        items=items,
        category=WikiArtCategory(id=category, name=category_name),
    )


if __name__ == "__main__":
    print(get_wikiart_feed("rene-magritte"))
