from bs4 import BeautifulSoup
import requests
from schema import FeedItem, Category
import re
from functools import lru_cache

def get_guardian_categories() -> list[Category]:
    url = "https://www.theguardian.com/news/series/ten-best-photographs-of-the-day/rss"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")
    categories = []
    for item in soup.find_all("item"):
        categories.append(Category(id=item.find("guid").text.strip().removeprefix("https://www.theguardian.com/").replace("/", "__"), name=item.find("title").text.strip()))
    return categories


def get_guardian_photos_feed(category: str) -> list[FeedItem]:
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
            breakpoint()
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
        items.append(FeedItem(id=links[i], title=titles[i], description=captions[i], image_url=images[i], link=links[i]))
    return items

if __name__ == "__main__":
    items = get_guardian_photos_feed("news/gallery/2025/apr/25/black-grouse-courtship-and-first-pick-of-the-nfl-draft-photos-of-the-day-friday")
    print(items)
