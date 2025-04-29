from typing import Any
import requests
from schema import FeedItem, Category, Feed
from reddit_models import RedditResponse
from functools import lru_cache


class RedditCategory(Category):
    def model_post_init(self, context: Any) -> None:
        self.link = f"https://www.reddit.com/r/{self.id}"


@lru_cache(maxsize=1)
def get_reddit_categories() -> list[RedditCategory]:
    return sorted(
        [
            RedditCategory(id="landscapephotography", name="r/LandscapePhotography"),
            RedditCategory(id="art", name="r/Art"),
            RedditCategory(id="analog", name="r/Analog"),
            RedditCategory(id="filmphotography", name="r/FilmPhotography"),
            RedditCategory(id="wildlifephotography", name="r/WildlifePhotography"),
            RedditCategory(id="streetphotography", name="r/StreetPhotography"),
            RedditCategory(id="astrophotography", name="r/Astrophotography"),
            RedditCategory(id="MoviePosterPorn", name="r/MoviePosterPorn"),
            RedditCategory(id="wallpapers", name="r/Wallpapers"),
            RedditCategory(id="minimalistphotography", name="r/MinimalistPhotography"),
            RedditCategory(id="blackandwhite", name="r/BlackAndWhite"),
        ],
        key=lambda x: x.name,
    )


def get_reddit_feed(category: str, hd: bool = False) -> Feed:
    url = f"https://www.reddit.com/r/{category}/top.json?t=month&limit=20&raw_json=1"
    # Spoof a browser request
    response = requests.get(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        },
    )
    if response.status_code != 200:
        raise Exception(f"Failed to fetch Reddit feed for category {category}")
    data = RedditResponse.model_validate_json(response.text)
    items = []

    for post in data.data.children:
        post_data = post.data

        # Handle gallery posts
        if post_data.is_gallery and post_data.gallery_data and post_data.media_metadata:
            for gallery_item in post_data.gallery_data.items:
                media_id = gallery_item.media_id
                if media_id in post_data.media_metadata:
                    image_data = post_data.media_metadata[media_id]
                    if image_data.status == "valid" and image_data.e == "Image":
                        # Get the source image (largest size)
                        if hd:
                            source = image_data.s
                        else:
                            # Get the largest preview image
                            source = max(image_data.p, key=lambda x: x.width)
                        if source:
                            items.append(
                                FeedItem(
                                    id=image_data.id,
                                    title=f"{post_data.title} | {post_data.author}",
                                    description="",
                                    image_url=source.url,
                                    link=f"https://www.reddit.com{post_data.permalink}",
                                )
                            )

        # Handle single image posts
        elif (
            post_data.post_hint == "image"
            and post_data.preview
            and post_data.preview.enabled
        ):
            # Get the source image (largest size)
            if hd:
                source = post_data.preview.images[0].source
            else:
                source = max(
                    post_data.preview.images[0].resolutions, key=lambda x: x.width
                )
            if source:
                items.append(
                    FeedItem(
                        id=post_data.id,
                        title=f"{post_data.title} | {post_data.author}",
                        description="",
                        image_url=source.url,
                        link=f"https://www.reddit.com{post_data.permalink}",
                    )
                )

    category_name = list(
        filter(
            lambda x: x.id == (category if category else ""),
            get_reddit_categories(),
        )
    )
    if len(category_name) > 0:
        category_name = category_name[0].name
    else:
        category_name = "r/" + category.replace("-", " ").title()

    return Feed(items=items, category=RedditCategory(id=category, name=category_name))


if __name__ == "__main__":
    print(get_reddit_feed("landscapephotography"))
