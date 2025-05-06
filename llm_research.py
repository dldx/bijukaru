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
from typing import List, Dict, Optional
from pydantic_ai import Agent
from pydantic import BaseModel, Field
import dotenv

dotenv.load_dotenv()


class ResearchResult(BaseModel):
    """
    Represents the result of an open-ended research query to help determine appropriate
    gallery parameters for user requests that don't directly match existing categories.
    """

    category_suggestions: List[Dict[str, str]] = Field(
        ...,
        description="List of suggested categories in the format {id: 'category_id', name: 'Display Name'}. "
        "The id should follow the format required by the media source, such as 'artist:sidney-nolan' for WikiArt artists.",
        examples=[
            [
                {"id": "artist:sidney-nolan", "name": "Sidney Nolan"},
                {"id": "artist:brett-whiteley", "name": "Brett Whiteley"},
            ]
        ],
    )

    explanation: str = Field(
        ...,
        description="Brief explanation of why these categories were suggested based on the user's query.",
        examples=[
            "These are prominent Australian artists known for their contributions to modern art."
        ],
    )


async def perform_research(query: str) -> Optional[ResearchResult]:
    """
    Uses pydantic-ai Agent with Gemini to perform open-ended research on queries
    that don't directly match existing categories.

    Args:
        query: The user's research query, e.g., "Show me Australian artists"

    Returns:
        ResearchResult with category suggestions, or None if an error occurs
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
        print(
            "Please get an API key from https://aistudio.google.com/apikey and set the variable."
        )
        return None

    # Using google-gla provider with Gemini model
    model_name = (
        "google-gla:gemini-2.0-flash"  # Using Pro for better research capabilities
    )

    # Define the agent
    agent = Agent(
        model_name,
        output_type=ResearchResult,
        system_prompt=(
            "You are a research assistant specializing in art, photography, and other visual media. "
            "Your task is to analyze the user's query and suggest appropriate categories or specific "
            "content that would match what they're looking for. "
            "\n\n"
            "For example:"
            "\n- If they ask for 'Australian artists', suggest specific Australian artists "
            "formatted for WikiArt (e.g., 'artist:sidney-nolan')"
            "\n- If they ask for a specific photography style or requests that don't fit into the other categories, suggest subreddits "
            "that might contain that style"
            "\n- If they ask about Japanese woodblock print artists, suggest Ukiyo-e artists "
            "formatted appropriately (e.g., 'artist:katsushika-hokusai')"
            "\n\n"
            "Focus on providing accurate category IDs that match the expected format for the "
            "most appropriate media source. Prefer WikiArt for fine art queries, Reddit for "
            "photography, games, or niche art queries, and Ukiyo-e for Japanese woodblock prints."
            "\n\n"
            "Provide a brief explanation of why you suggested these categories."
            "\n\n"
            "Make sure the category_id values follow the expected format:"
            "\n- WikiArt artists: 'artist:artist-name-slug'"
            "\n- WikiArt styles: 'style:style-name-slug'"
            "\n- Reddit: 'subreddit-name' (without 'r/')"
            "\n- Ukiyo-e artists: 'artist:artist-name-slug'"
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
        description="Perform open-ended research on visual media queries."
    )
    parser.add_argument("query", type=str, help="The research query to process.")
    args = parser.parse_args()

    # Run the example
    research_result = asyncio.run(perform_research(args.query))

    if research_result:
        print("\nSuggested categories:")
        for category in research_result.category_suggestions:
            print(f"- {category['name']} (ID: {category['id']})")
        print(f"\nExplanation: {research_result.explanation}")
    else:
        print("\nFailed to get research results.")
