from typing import Optional, Literal, Dict, List, ClassVar, get_args, Any

from pydantic import BaseModel, Field

# Assuming Category lives in schema.py based on other files
from schema import Category

# Import category fetching functions
from apod import get_apod_categories
from guardian_photos import get_guardian_categories
from reddit import get_reddit_categories
from thisiscolossal import get_thisiscolossal_categories
from ukiyoe import get_ukiyo_e_categories
from wikiart import get_wikiart_categories

# Define the Literal type alias outside the class
MEDIA_SOURCE_LITERAL = Literal[
    "apod", "thisiscolossal", "guardian", "reddit", "ukiyo-e", "wikiart"
]


class BijukaruUrlParams(BaseModel):
    """Represents the parameters for generating or parsing a Bijukaru gallery URL. This model defines the structure for specifying the media source, content filtering, and display options for the gallery."""

    # Remove ClassVar definition
    # MEDIA_SOURCE_TYPE: ClassVar[type] = MEDIA_SOURCE_LITERAL

    llm_thinking: str = Field(
        description="Explain your reasoning for the category and image_id you chose. This will be shown to the user.",
    )
    media_source: MEDIA_SOURCE_LITERAL = Field(
        ...,
        description="The primary source of the media content. Select one of the available predefined source IDs.",
        examples=["apod", "wikiart"],
    )
    image_id: Optional[str] = Field(
        None,
        description="An optional identifier for a specific image within the source/category to display initially. The format varies by source (e.g., 'YYYY-MM-DD' for APOD, numerical ID for WikiArt). If omitted, the gallery usually starts at the first or a random image.",
        examples=["2023-10-26", "12345"],
    )
    category: Optional[str] = Field(
        None,
        description="An optional filter to narrow down content within the selected media source. Valid categories depend heavily on the 'media_source'. Examples: Year for APOD ('2023'), subreddit for Reddit ('landscapephotography' - no prefixes), artist/style for WikiArt ('artist:van-gogh', 'style:impressionism'), specific gallery ID for Guardian (category='news__gallery__2025__may__01__workers-dancers-and-pagans-thursdays-photos-of-the-day' - all / have been replaced with __ and the guardian domain has been removed), museum code ('mfa') or artist ('artist:katsushika-hokusai') for Ukiyo-e. For WikiArt and Reddit, you may use your own knowledge to infer the category as long as you conform to the format of the categories. If omitted, usually shows the default or 'all' content for the source.",
        examples=["2024", "landscapephotography", "artist:claude-monet", "mfa"],
    )
    interval: Optional[int] = Field(
        None,
        description="An optional duration (in seconds) for the automatic slideshow progression between images. Set to 0 to disable automatic sliding. If omitted, a default interval (e.g., 10 seconds) is typically used.",
        examples=[5, 10, 0],
    )
    paused: Optional[bool] = Field(
        None,
        description="An optional flag to start the slideshow in a paused state. Set to 'true' if the slideshow should not automatically advance initially. Defaults to 'false' (playing).",
        examples=[True],
    )
    hd: Optional[bool] = Field(
        None,
        description="An optional flag to request high-definition images from sources that support it (e.g., APOD, Reddit). Set to 'true' to prefer HD URLs. Has no effect if the source doesn't offer HD variants. Defaults to 'false'.",
        examples=[True],
    )
    prefetch: Optional[int] = Field(
        None,
        description="An optional number specifying how many subsequent images should be prefetched in the background to improve loading speed. Defaults to a small number (e.g., 2).",
        examples=[5],
    )
    fullscreen: Optional[bool] = Field(
        None,
        description="An optional flag to request the gallery UI to start with the control toolbar hidden, mimicking a fullscreen experience. Set to 'true' to hide the toolbar initially. Defaults to 'false'.",
        examples=[True],
    )
    show_description: Optional[bool] = Field(
        None,
        alias="showDescription",
        description="An optional flag to make the image description overlay visible by default when the gallery loads. Set to 'true' to show descriptions initially. Defaults to 'false'.",
        examples=[True],
    )

    class Config:
        validate_by_name = True

    @property
    def url(self) -> str:
        params = self.model_dump(exclude_none=True)
        # Remove media_source since it's in the path
        params.pop("media_source", None)
        # Remove the llm_thinking since it's not a valid URL param
        params.pop("llm_thinking", None)
        # Convert to URL params
        param_strings = []
        for key, value in params.items():
            # Convert booleans to lowercase strings
            if isinstance(value, bool):
                value = str(value).lower()
            param_strings.append(f"{key}={value}")
        query_string = "&".join(param_strings)
        return f"/{self.media_source}{'?' + query_string if query_string else ''}"


# Mapping from media_source literal to its category function
CATEGORY_FETCHERS: Dict[MEDIA_SOURCE_LITERAL, Any] = {  # Use Any for value type
    "apod": get_apod_categories,
    "thisiscolossal": get_thisiscolossal_categories,
    "guardian": get_guardian_categories,
    "reddit": get_reddit_categories,
    "ukiyo-e": get_ukiyo_e_categories,
    "wikiart": get_wikiart_categories,
}


def get_all_categories() -> (
    Dict[MEDIA_SOURCE_LITERAL, List[dict]]
):  # Use alias for key type
    """
    Fetches categories for all defined media sources by calling their respective
    category-fetching functions.

    Returns:
        A dictionary mapping each media source ID (as a string) to its list of Category objects.
        Returns an empty list for a source if fetching fails.
    """
    all_categories: Dict[MEDIA_SOURCE_LITERAL, List[dict]] = {}
    # Get the literal values using get_args on the alias
    media_sources = get_args(MEDIA_SOURCE_LITERAL)

    for source in media_sources:
        try:
            fetcher = CATEGORY_FETCHERS.get(source)
            if fetcher:
                # Call the synchronous category function
                categories = fetcher()
                all_categories[source] = [
                    {"id": cat.id, "name": cat.name} for cat in categories
                ]
            else:
                # This case should ideally not happen if CATEGORY_FETCHERS is kept in sync
                print(f"Warning: No category fetcher found for media source: {source}")
                all_categories[source] = []
        except Exception as e:
            # Handle potential errors during fetching (e.g., network, parsing)
            print(f"Error fetching categories for {source}: {e}")
            all_categories[source] = []  # Return empty list on error

    return all_categories


# Example of how to use it (can be run directly if needed)
if __name__ == "__main__":
    import json

    categories_dict = get_all_categories()
    # Convert Category objects to dicts for JSON serialization
    serializable_dict = {
        source: [cat.model_dump() for cat in cats]
        for source, cats in categories_dict.items()
    }
    print("Fetched Categories:")
    print(json.dumps(serializable_dict, indent=2))
    print(BijukaruUrlParams.model_json_schema())
