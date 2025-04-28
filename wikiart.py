from bs4 import BeautifulSoup
import requests
from pydantic import BaseModel
from typing import Optional
from schema import FeedItem, Category


class WikiArtArtwork(BaseModel):
    title: str
    contentId: int
    artistContentId: int
    artistName: str
    completitionYear: Optional[int]
    yearAsString: Optional[str]
    width: int
    image: str
    height: int

    @property
    def image_url(self) -> str:
        """Get the image URL, removing the size suffix if it exists."""
        return self.image.split("!")[0]

    @property
    def link(self) -> str:
        """Get the artwork page URL."""
        return f"https://www.wikiart.org/en/{self.artistName.lower().replace(' ', '-')}/{self.title.lower().replace(' ', '-')}"


def get_wikiart_categories() -> list[Category]:
    """Get a list of popular artists as categories."""
    return [
        Category(id="ansel-adams", name="Ansel Adams"),
    ] + sorted(
        [
            Category(id="rene-magritte", name="René Magritte"),
            Category(id="pablo-picasso", name="Pablo Picasso"),
            Category(id="vincent-van-gogh", name="Vincent van Gogh"),
            Category(id="claude-monet", name="Claude Monet"),
            Category(id="salvador-dali", name="Salvador Dalí"),
            Category(id="edvard-munch", name="Edvard Munch"),
            Category(id="gustav-klimt", name="Gustav Klimt"),
            Category(id="pierre-auguste-renoir", name="Pierre-Auguste Renoir"),
            Category(id="paul-cezanne", name="Paul Cézanne"),
            Category(id="henri-matisse", name="Henri Matisse"),
            Category(id="edward-hopper", name="Edward Hopper"),
            Category(id="frida-kahlo", name="Frida Kahlo"),
            Category(id="georgia-o-keeffe", name="Georgia O'Keeffe"),
            Category(id="mary-cassatt", name="Mary Cassatt"),
            Category(id="tamara-de-lempicka", name="Tamara de Lempicka"),
            Category(id="berthe-morisot", name="Berthe Morisot"),
            Category(id="suzanne-valadon", name="Suzanne Valadon"),
            Category(id="helen-frankenthaler", name="Helen Frankenthaler"),
            Category(id="agnes-martin", name="Agnes Martin"),
            Category(id="joan-mitchell", name="Joan Mitchell"),
            Category(id="lee-krasner", name="Lee Krasner"),
            Category(id="yayoi-kusama", name="Yayoi Kusama"),
            Category(id="banksy", name="Banksy"),
            Category(id="jean-michel-basquiat", name="Jean-Michel Basquiat"),
            Category(id="keith-haring", name="Keith Haring"),
            Category(id="cindy-sherman", name="Cindy Sherman"),
            Category(id="gerhard-richter", name="Gerhard Richter"),
            Category(id="ai-weiwei", name="Ai Weiwei"),
            Category(id="marina-abramovic", name="Marina Abramović"),
            Category(id="jenny-saville", name="Jenny Saville"),
        ],
        key=lambda x: x.name.split(" ")[-1],
    )


def get_wikiart_feed(category: str, hd: bool = False) -> list[FeedItem]:
    """Fetch artworks for a specific artist from WikiArt."""
    url = f"https://www.wikiart.org/en/App/Painting/PaintingsByArtist?artistUrl={category}&json=2"

    # Spoof a browser request
    response = requests.get(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
    )

    if response.status_code != 200:
        raise Exception(f"Failed to fetch WikiArt feed for artist {category}")

    # Parse the JSON response into WikiArtArtwork objects
    artworks = [WikiArtArtwork.model_validate(artwork) for artwork in response.json()]

    # Convert to FeedItem format
    items = []
    for artwork in artworks:
        items.append(
            FeedItem(
                id=str(artwork.contentId),
                title=f"{artwork.title} ({artwork.yearAsString})",
                description="",
                image_url=artwork.image_url,
                link=artwork.link,
            )
        )

    return items


if __name__ == "__main__":
    print(get_wikiart_feed("rene-magritte"))
