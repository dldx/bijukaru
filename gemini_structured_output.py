"""
Demonstrates using pydantic-ai with the Gemini API to extract structured
data (BijukaruUrlParams) from a natural language query.

Requires:
  - pydantic-ai library installed (`pip install pydantic-ai`)
  - GEMINI_API_KEY environment variable set with a valid Google Generative Language API key.
    (Get one from https://aistudio.google.com/apikey)
"""

import asyncio
import os
from typing import Optional, List, Dict
from pydantic_ai import Agent, RunContext
import dotenv
from models import get_all_categories, BijukaruUrlParams
from llm_research import perform_research, ResearchResult

dotenv.load_dotenv()


# Define the agent
# Note: We define the agent *before* decorating the tool function
agent = Agent(
    "google-gla:gemini-2.0-flash",  # Using flash for speed/cost, consider 'gemini-1.5-pro'
    output_type=BijukaruUrlParams,
    system_prompt=(
        "Extract the gallery parameters from the user's request "
        "and structure them according to the BijukaruUrlParams model. "
        "Infer the 'media_source' based on the context if not explicitly stated. "
        "Default 'media_source' to 'wikiart' if ambiguous. "
        "Identify specific image IDs, categories (like artists, styles, years, subreddits), "
        "slideshow interval, and other boolean flags or numeric settings mentioned. "
        "If you are unsure about a category, cannot find a specific ID, or if the user asks for suggestions, "
        "use the `perform_research` tool to get category suggestions based on the query. "
        "Once the tool provides suggestions, use the most relevant one to populate the parameters. "
        "You may also infer additional categories based on your own knowledge, returning the category ids in the correct format. You do not need to stick only to the examples in the case of wikiart, reddit or ukiyo-e media sources."
        "For example, if the user asks for 'katsushika hokusai', you should infer the category id as 'artist:katsushika-hokusai'."
        "If the user asks for a subreddit suggestion, you should infer the category id as 'subreddit:<subredditname>', for example 'subreddit:foxes'. The subreddit can be any subreddit, not just the ones in the examples. The subreddit should exist."
        "Make sure you return the correct values for the category_id and image_id. "
        "Explain your reasoning for the category and image_id you chose."
        f"These are some of the categories for the media sources: {get_all_categories()}"
    ),
    instrument=True,  # Optional: Enable instrumentation for logging/debugging
)


# Register perform_research as a tool using the decorator
@agent.tool_plain
async def perform_research_tool(query: str) -> Optional[ResearchResult]:
    """
    Use your own knowledge to find relevant categories for the query.
    """
    print(f"--- Tool: Running research for query: {query} ---")
    result = await perform_research(query)
    print(f"--- Tool: Research result: {result} ---")
    return result


async def get_structured_params(query: str) -> Optional[BijukaruUrlParams]:
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

    # model_name is now defined within the agent instance

    # The agent is already defined above with the tool registered

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


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Extract structured gallery parameters from a natural language query."
    )
    parser.add_argument("query", type=str, help="The natural language query to parse.")
    args = parser.parse_args()

    # --- Run the example ---
    # Use asyncio.run() to execute the async function
    structured_output: Optional[BijukaruUrlParams] = asyncio.run(
        get_structured_params(args.query)
    )

    if structured_output:
        print(f"Generated URL: {structured_output.url}")
    else:
        print("\nFailed to get structured output.")
