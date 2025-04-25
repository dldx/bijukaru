from bs4 import BeautifulSoup
import requests
from schema import FeedItem, Category
import orjson
import re


def get_ukiyo_e_categories() -> list[Category]:
    categories = orjson.loads(open("data/ukiyoe_sources.json").read())
    # Sort categories by number of images
    categories = sorted(categories, key=lambda x: int(re.search(r'[\d,]+', x["Image Count"]).group().replace(",", "")), reverse=True)
    categories = [Category(id=category["Browse Link"].split("/")[-1], name=category["Museum Name"]) for category in categories]
    return categories

def cluster_items(data_array: list[any], category: str) -> list[FeedItem]:
    clusters = []
    current_cluster = None

    for item in data_array:
        # Check if this is a string that starts with 'met/'
        if isinstance(item, str) and item.startswith(category + '/'):
            # Start a new cluster
            if current_cluster is not None:
                clusters.append(current_cluster)
            current_cluster = [item]
        # If we're in a cluster and this is not a dictionary (JavaScript object)
        elif current_cluster is not None and not isinstance(item, dict) and (item not in ["title", "author"]):
            current_cluster.append(item)
        # If we encounter a dictionary and we're in a cluster, end the cluster
        elif isinstance(item, dict) and current_cluster is not None:
            clusters.append(current_cluster)
            current_cluster = None

    # Don't forget to add the last cluster if it exists
    if current_cluster is not None:
        clusters.append(current_cluster)

    # Turn lists into FeedItems
    items = []
    for cluster in clusters:
        id, title, description, *_ = cluster + [""] * (4 - len(cluster))
        category, id = id.split("/")
        items.append(FeedItem(id=id, title=title, description=description, image_url=f"https://data.ukiyo-e.org/{category}/images/{id}.jpg", link=f"https://ukiyo-e.org/image/{category}/{id}"))

    return items

def get_ukiyo_e_feed(category: str) -> list[FeedItem]:
    url = f"https://ukiyo-e.org/source/{category}.data"#?start=100"
    response = requests.get(url, allow_redirects=True)
    json_data = orjson.loads(response.content.decode("utf-8"))

    items = cluster_items(json_data, category)

    return items


if __name__ == "__main__":
    items = get_ukiyo_e_feed("mfa")
    print(items)
