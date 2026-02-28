import os
import logging

logger = logging.getLogger(__name__)


def get_chat_reply(client, system_prompt: str, history: list[dict]) -> str:
    """Get a chat completion from Mistral.

    Args:
        client: Mistral client instance.
        system_prompt: The system prompt to prepend.
        history: Full conversation history as a list of
                 {"role": "user"|"assistant", "content": str} dicts.
    """
    max_sentences = int(os.environ.get("MISTRAL_MAX_SENTENCES", "3"))
    max_tokens = int(os.environ.get("MISTRAL_MAX_TOKENS", "160"))
    constraint = f"Reply in at most {max_sentences} sentences. Be concise."

    messages = [
        {"role": "system", "content": f"{system_prompt}\n\n{constraint}"},
        *history,
    ]

    response = client.chat.complete(
        model="mistral-large-latest",
        messages=messages,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()
