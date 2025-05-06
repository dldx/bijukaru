"""
Provides functions for open-ended research using LLM when the user's query requires
information not directly available in the predefined categories.

For example, if a user asks for "Australian artists" but we don't have that
category directly, we can use this module to research and suggest appropriate
artists that match the criteria.

Requires:
  - pydantic-ai library installed (`pip install pydantic-ai`)
  - GEMINI_API_KEY environment variable set with a valid Google Generative Language API key.
    (Get one from https://aistudio.google.com/apikey)
"""

import asyncio
import os
from typing import Optional
from pydantic_ai import Agent
from pydantic import BaseModel, Field
import dotenv
from models import get_all_categories, BijukaruUrlParams
from wikiart import WikiArtCategory, search_wikiart_for_artists

dotenv.load_dotenv()


class LLMResearchResult(BaseModel):
    """
    Represents the result of an open-ended research query to help determine appropriate
    gallery parameters for user requests that don't directly match existing categories.
    """

    research_query: str = Field(
        ...,
        description="The research query from the user.",
        examples=["Show me Ukiyo-e artists from the 20th century"],
    )
    research_result: str = Field(
        ...,
        description="A concise research result from the LLM.",
        examples=[
            """Here is a concise list of some prominent artists associated with the Shin-hanga movement in the 20th century:

Kawase Hasui (1883-1957)
Yoshida Hiroshi (1876-1950)
Ito Shinsui (1898-1972)
Hashiguchi Goyō (1880-1921)
Ohara Koson (Shōson) (1877-1945)
Tsuchiya Koitsu (1870-1949)
Natori Shunsen (1886-1960)"""
        ],
    )


class SuggestedBijukaruUrlParams(BijukaruUrlParams):
    """
    Represents a suggested gallery parameters from the LLM.
    """

    llm_thinking: str = Field(
        description="Explain your reasoning for the category and image_id you chose. This will be shown to the user.",
    )
    userfriendly_message: str = Field(
        description="A user-friendly message to the user explaining the gallery parameters you chose.",
    )


# Define the agent
# Note: We define the agent *before* decorating the tool function
agent = Agent(
    "google-gla:gemini-2.0-flash",  # Using flash for speed/cost, consider 'gemini-1.5-pro'
    output_type=SuggestedBijukaruUrlParams,
    system_prompt=(
        "Extract the gallery parameters from the user's request "
        "and structure them according to the BijukaruUrlParams model. "
        "Infer the 'media_source' based on the context if not explicitly stated. "
        "If the user asks for ukiyo-e artists, you should infer the category id as 'artist:artist-name-slug' and the media_source as 'ukiyo-e'. "
        "Default 'media_source' to 'wikiart' if ambiguous. "
        "Identify specific image IDs, categories (like artists, styles, years, subreddits), "
        "slideshow interval, and other boolean flags or numeric settings mentioned. "
        "If you are unsure about a category, cannot find a specific ID, or if the user asks for suggestions, "
        "use the `perform_research` tool to get category suggestions based on the query. "
        "Once the tool provides suggestions, use the most relevant one to populate the parameters. "
        "You may also infer additional categories based on your own knowledge, returning the category ids in the correct format. You do not need to stick only to the examples in the case of wikiart, reddit or ukiyo-e media sources."
        "For example, if the user asks for 'katsushika hokusai', you should infer the category id as 'artist:katsushika-hokusai'."
        "If the user asks for a subreddit suggestion, you should infer the category id as 'subreddit:<subredditname>', for example 'subreddit:foxes'. The subreddit can be any subreddit, not just the ones in the examples. The subreddit should exist."
        "Make sure the category_id and image_id are in the correct format for the media source. "
        "For example:"
        "\n- WikiArt artists: 'artist:artist-name-slug'"
        "\n- WikiArt styles: 'style:style-name-slug'"
        "\n- Reddit: 'subreddit-name' (without 'r/')"
        "\n- Ukiyo-e artists: 'artist:artist-name-slug'"
        "Make sure you return the correct values for the category_id and image_id. If an image_id is specified, you must also return a category_id and media_source. Check that the image_id exists with the relevant search tool."
        "If you are unsure about the artist, use the `_search_wikiart_for_artists` tool to check whether the artist exists on WikiArt. If the artist is not found, don't return any categories."
        "If the user asks for a specific artist, try to point directly to 'artist:artist-name-slug' category instead of using the search_wikiart tool. If you cannot find the artist, use the `_search_wikiart_for_artists` tool to check whether the artist exists on WikiArt. If the artist is not found, don't return any categories."
        "Explain your reasoning for the category and image_id you chose."
        "Make sure the userfriendly_message is a user-friendly message to the user explaining the gallery parameters you chose, particularly the choice of category_id and image_id."
        f"These are some of the categories for the media sources: {get_all_categories()}"
    ),
    instrument=True,  # Optional: Enable instrumentation for logging/debugging
)


# Register perform_research as a tool using the decorator
@agent.tool_plain
async def perform_research_tool(query: str) -> Optional[LLMResearchResult]:
    """
    Use your own knowledge to find relevant categories for the query.

    Args:
        query: The user's research query, e.g., "Show me Australian artists"

    Returns:
        ResearchResult with research result, or None if an error occurs
    """
    print(f"--- Tool: Running research for query: {query} ---")
    result = await perform_research(query)
    print(f"--- Tool: Research result: {result} ---")
    return result


@agent.tool_plain
async def search_astronomy_images(query: str) -> Optional[SuggestedBijukaruUrlParams]:
    """
    If the user asks for astronomy images with specific search criteria, use this tool to search for relevant images.

    Args:
        query: A query to search for astronomy images, e.g. "galaxies" or "nebulae" or "star clusters"

    Returns:
        A SuggestedBijukaruUrlParams instance containing the search results, or None if an error occurs
    """
    return SuggestedBijukaruUrlParams(
        media_source="apod",
        category=f"search:{query}",
        image_id=None,
        interval=None,
        paused=None,
        hd=None,
        prefetch=None,
        fullscreen=None,
        showDescription=None,
        llm_thinking=f"Searching for astronomy images with the query: {query}",
        userfriendly_message=f"Showing results for '{query}' in Astronomy Picture of the Day",
    )


@agent.tool_plain
async def search_wikiart(query: str) -> Optional[SuggestedBijukaruUrlParams]:
    """
    Search for artworks on WikiArt using a specific query.

    Args:
        query: The query to search for. This should be a specific artist name, style, or a couple of words that describe the artwork. The query should be concise and to the point. Instead of "paintings of London", use "london" as the query.
               If the user asks for a specific artist, try to point directly to 'artist:artist-name-slug' category instead of using the search_wikiart tool. If you cannot find the artist, use the `_search_wikiart_for_artists` tool to check whether the artist exists on WikiArt. If the artist is not found, don't return any categories.
               If you want to search for multiple artists, separate the artist names with | in the query.

    Returns:
        A SuggestedBijukaruUrlParams instance containing the search results, or None if an error occurs
    """
    return SuggestedBijukaruUrlParams(
        media_source="wikiart",
        category=f"search:{query}",
        image_id=None,
        interval=None,
        paused=None,
        hd=None,
        prefetch=None,
        fullscreen=None,
        showDescription=None,
        llm_thinking=f"Searching for artworks on WikiArt with the query: {query}",
        userfriendly_message=f"Showing results for '{query}' on WikiArt",
    )


@agent.tool_plain
async def _search_wikiart_for_artists(artists: list[str]) -> list[WikiArtCategory]:
    """
    Check whether the artists exist on WikiArt. If so, return the relevant categories. If not, return an empty list.
    """
    return search_wikiart_for_artists(artists)


async def get_structured_params(query: str) -> Optional[SuggestedBijukaruUrlParams]:
    """
    Uses pydantic-ai Agent with Gemini to parse a query into BijukaruUrlParams.
    The agent can use the 'perform_research_tool' if needed.

    Args:
        query: The natural language query describing the desired gallery parameters.

    Returns:
        A BijukaruUrlParams instance populated from the query, or None if an error occurs.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
        print(
            "Please get an API key from https://aistudio.google.com/apikey and set the variable."
        )
        return None

    print(f"Query: {query}")

    try:
        # Use agent.run() for async execution
        # The agent will automatically use the 'perform_research_tool' if its logic determines it's necessary based on the prompt.
        result = await agent.run(query)
        print("--- Agent Result ---")
        if result.output:
            print("Structured Output:")
            print(result.output.model_dump_json(indent=2))
            print("\nUsage:")
            print(result.usage())
            return result.output
        else:
            print("Agent did not produce valid structured output.")
            print("Messages:", result.all_messages())
            return None
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        import traceback

        traceback.print_exc()
        return None


async def perform_research(query: str) -> Optional[LLMResearchResult]:
    """
    Uses LLM knowledge to perform open-ended research on queries that don't directly match existing categories.

    Args:
        query: The user's research query, e.g., "Show me Australian artists"

    Returns:
        ResearchResult with research result, or None if an error occurs
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
        print(
            "Please get an API key from https://aistudio.google.com/apikey and set the variable."
        )
        return None

    # Using google-gla provider with Gemini model
    model_name = "google-gla:gemini-2.0-flash"

    # Define the agent
    agent = Agent(
        model_name,
        output_type=LLMResearchResult,
        system_prompt=(
            "You are a research assistant specializing in art, photography, and other visual media. "
            "Your task is to analyze the user's query and provide a concise research result. "
            "\n\n"
            "For example:"
            "\n- If they ask for 'Australian artists', provide a concise list of Australian artists "
            "\n- If they ask for a specific photography style or requests that don't fit into the other categories, provide a concise list of subreddits "
            "that might contain that style"
            "\n- If they ask about Japanese woodblock print artists, provide a concise list of Ukiyo-e artists "
            "\n\n"
            "Focus on providing accurate research."
        ),
        instrument=True,  # Enable instrumentation for logging
    )

    print(f"--- Running Research Agent ({model_name}) ---")
    print(f"Query: {query}")

    try:
        # Use agent.run() for async execution
        result = await agent.run(query)
        print("--- Research Agent Result ---")
        if result.output:
            print("Structured Output:")
            print(result.output.model_dump_json(indent=2))
            print("\nUsage:")
            print(result.usage())
            return result.output
        else:
            print("Agent did not produce valid research output.")
            print("Messages:", result.all_messages())
            return None
    except Exception as e:
        print(f"An unexpected error occurred during research: {e}")
        return None


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Extract structured gallery parameters from a natural language query."
    )
    parser.add_argument("query", type=str, help="The natural language query to parse.")
    args = parser.parse_args()

    # --- Run the example ---
    # Use asyncio.run() to execute the async function
    structured_output: Optional[SuggestedBijukaruUrlParams] = asyncio.run(
        get_structured_params(args.query)
    )

    if structured_output:
        print(f"Generated URL: {structured_output.url}")
    else:
        print("\nFailed to get structured output.")
