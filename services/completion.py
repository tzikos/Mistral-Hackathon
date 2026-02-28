import os
import logging

logger = logging.getLogger(__name__)


def get_chat_reply(client, system_prompt: str, user_text: str) -> str:
    """Get a chat completion from Mistral given a system prompt and user message."""
    max_sentences = int(os.environ.get("MISTRAL_MAX_SENTENCES", "3"))
    max_tokens = int(os.environ.get("MISTRAL_MAX_TOKENS", "160"))
    constraint = f"Reply in at most {max_sentences} sentences. Be concise."

    response = client.chat.complete(
        model="mistral-large-latest",
        messages=[
            {"role": "system", "content": f"{system_prompt}\n\n{constraint}"},
            {"role": "user", "content": user_text},
        ],
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content.strip()
