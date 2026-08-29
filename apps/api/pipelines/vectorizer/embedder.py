import time
import openai
from typing import List

def get_embedding(text: str, api_key: str, model: str = "text-embedding-3-small") -> List[float]:
    """
    Generates a 1536-dimensional embedding for the given text using OpenAI API.
    Implements simple exponential backoff for handling rate limit errors.
    
    Args:
        text: The input text to embed.
        api_key: OpenAI API key.
        model: OpenAI embedding model name.
        
    Returns:
        List[float]: The 1536-dimensional embedding vector.
    """
    if not api_key:
        raise ValueError("OpenAI API key must be provided to generate embeddings.")
        
    client = openai.OpenAI(api_key=api_key)
    max_retries = 5
    retry_delay = 2.0

    for attempt in range(max_retries):
        try:
            response = client.embeddings.create(
                model=model,
                input=[text]
            )
            return response.data[0].embedding
        except openai.RateLimitError as e:
            if attempt == max_retries - 1:
                print("Max retries reached for OpenAI rate limits.")
                raise e
            print(f"Rate limit hit. Retrying in {retry_delay}s...")
            time.sleep(retry_delay)
            retry_delay *= 2
        except Exception as e:
            print(f"OpenAI embedding error: {e}")
            raise e

# Compatibility wrapper class
class DataEmbedder:
    @staticmethod
    def get_embedding(text: str, api_key: str, model: str = "text-embedding-3-small") -> List[float]:
        return get_embedding(text, api_key, model)
