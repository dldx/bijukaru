from bs4 import BeautifulSoup
import requests
from schema import FeedItem, Category, Feed
from functools import lru_cache
from typing import Any, Optional
from datetime import datetime
import dateparser
import warnings
from bs4 import XMLParsedAsHTMLWarning

warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

class GuardianCategory(Category):
    date: Optional[datetime] = None
    def model_post_init(self, context: Any) -> None:
        self.link = f"https://www.theguardian.com/{self.id}"


def get_guardian_categories() -> list[GuardianCategory]:
    rss_urls = [
        "https://www.theguardian.com/news/series/ten-best-photographs-of-the-day/rss",
        "https://www.theguardian.com/artanddesign/artanddesign+content/gallery/rss",
    ]
    categories = []
    for url in rss_urls:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, "lxml")
        for item in soup.find_all("item"):
            if (item.find("guid") is not None) and (
                id := item.find("guid")
                .text.strip()
                .removeprefix("https://www.theguardian.com/")
                .replace("/", "__")
            ) not in [c.id for c in categories]:
                date = dateparser.parse(item.find("dc:date").text.strip())
                categories.append(
                    GuardianCategory(
                        id=id,
                        name=item.find("title").text.strip(),
                        date=date,
                    )
                )
    # Sort categories by date
    categories.sort(key=lambda x: x.date, reverse=True)
    categories += [
        GuardianCategory(
            id="artanddesign__gallery__2022__feb__17__ansel-adams-rare-photographs-in-stunning-hi-definition",
            name="Ansel Adams: rare photographs in stunning hi-definition",
            date=datetime(2022, 2, 17),
        )
    ]
    return categories


@lru_cache(maxsize=1024)
def get_guardian_photos_feed(category: str) -> Feed:
    url = f"https://www.theguardian.com/{category}"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")
    # Get all the images
    images = []
    titles = []
    links = []
    for image_container in soup.find_all("div", {"class":"gallery__img-container"}):
        if image_container.find("div", class_="ad-slot-container") is not None:
            continue
        # Get the largest image
        try:
            images.append(sorted([img.get("srcset").split(" ") for img in image_container.find_all("source")], key=lambda x: int(x[1].removesuffix("w")))[-1][0])
        except IndexError:
            images.append(image_container.find("img").get("src"))
        titles.append(image_container.find("img").get("alt"))
        links.append(image_container.find("a").get("href"))
    # Get all the captions
    captions = []
    for caption in soup.find_all("div", {"class":"gallery__caption"}):
        h2 = caption.find("h2").extract()
        captions.append(f'<strong>{h2.text.strip()}</strong>: {caption.text.strip()}')

    # Get all the photo credits
    photo_credits = []
    for photo_credit in soup.find_all("p", {"class":"gallery__credit"}):
        photo_credits.append(photo_credit.text.strip())

    items = []
    # Put all the items together
    for i in range(len(images)):
        items.append(FeedItem(id=links[i].split("#")[-1], title=titles[i], description=captions[i], image_url=images[i], link=links[i]))
    category_name = list(
        filter(
            lambda x: x.id == (category.replace("/", "__") if category else ""),
            get_guardian_categories(),
        )
    )
    if len(category_name) > 0:
        category_name = category_name[0].name
    else:
        category_name = category.replace("__", " ").title()

    return Feed(items=items, category=GuardianCategory(id=category, name=category_name))


if __name__ == "__main__":
    items = get_guardian_photos_feed("news/gallery/2025/apr/25/black-grouse-courtship-and-first-pick-of-the-nfl-draft-photos-of-the-day-friday")
    print(items)
