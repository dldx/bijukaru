from bs4 import BeautifulSoup
import requests
from schema import Feed, FeedItem, Category
import orjson
import re
from functools import lru_cache

@lru_cache(maxsize=1)
def get_ukiyo_e_categories() -> list[Category]:
    categories = orjson.loads(open("data/ukiyoe_sources.json").read())
    # Sort categories by number of images
    categories = sorted(categories, key=lambda x: int(re.search(r'[\d,]+', x["Image Count"]).group().replace(",", "")), reverse=True)
    categories = [Category(id=category["Browse Link"].split("/")[-1], name=category["Museum Name"]) for category in categories]
    return categories

def cluster_items(data_array: list[any], category: str | None) -> list[FeedItem]:
    """
    Clusters items into a list of FeedItems, based on the patterns in the data_array.

    If category is None, it assumes the items are artist items, which means that the category could be anything.
    """
    clusters = []
    current_cluster = None
    all_category_ids = "|".join([cat.id for cat in get_ukiyo_e_categories()])

    for item in data_array:
        # Check if this is a string that starts with 'met/'
        if isinstance(item, str) and (item.startswith(category + '/') if category else re.match(rf"^{all_category_ids}/", item)):
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
        try:
            _category, id = id.split("/")
            items.append(FeedItem(id=id, title=title, description=description, image_url=f"https://data.ukiyo-e.org/{_category}/images/{id}.jpg", link=f"https://ukiyo-e.org/image/{_category}/{id}"))
        except ValueError:
            pass

    return items


def get_ukiyo_e_feed(category: str, start: int = 1) -> Feed:
    if category in [cat.id for cat in get_ukiyo_e_categories()]:
        url = f"https://ukiyo-e.org/source/{category}.data?start={start}"
        cluster_category = category
    else:
        ## Asume category is actually an artist name
        url = f"https://ukiyo-e.org/artist/{category}.data?start={start}"
        cluster_category = None
    response = requests.get(url, allow_redirects=True)
    json_data = orjson.loads(response.content.decode("utf-8"))

    items = cluster_items(json_data, cluster_category)

    category_name = list(
        filter(
            lambda x: x.id == (category if category else ""),
            get_ukiyo_e_categories(),
        )
    )
    if len(category_name) > 0:
        category_name = category_name[0].name
    else:
        category_name = category.replace("-", " ").title()

    return Feed(items=items, category=Category(id=category, name=category_name))


if __name__ == "__main__":
    items = get_ukiyo_e_feed("mfa")
    print(items)
