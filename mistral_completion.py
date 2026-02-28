import os
from mistralai import Mistral
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ.get("MISTRAL_API_KEY")
if not API_KEY:
    raise ValueError("Please set MISTRAL_API_KEY in your .env file")

client = Mistral(api_key=API_KEY)

def _load_cv_context():
    path = os.environ.get(
        "CV_CONTEXT_PATH",
        os.path.join(os.path.dirname(__file__), "cv_context.txt"),
    )
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception:
        return ""

def get_mistral_reply(
    transcribed_text,
    model="mistral-large-latest",
    system_prompt=None,
    max_sentences=None,
    max_tokens=None,
):
    """
    Get a reply from Mistral completion/chat model.
    Args:
        transcribed_text (str): User's transcribed speech.
        model (str): Mistral model name.
        system_prompt (str, optional): System prompt for context/personality.
        max_sentences (int, optional): Max sentences in reply.
        max_tokens (int, optional): Max tokens in reply.
    Returns:
        str: Model's reply text.
    """
    if max_sentences is None:
        try:
            max_sentences = int(os.environ.get("MISTRAL_MAX_SENTENCES", "3"))
        except ValueError:
            max_sentences = 3
    if max_tokens is None:
        try:
            max_tokens = int(os.environ.get("MISTRAL_MAX_TOKENS", "160"))
        except ValueError:
            max_tokens = 160

    constraint = f"Reply in at most {max_sentences} sentences. Be concise."
    cv_context = _load_cv_context()
    if cv_context:
        constraint = f"{constraint}\n\nUser CV Context:\n{cv_context}"
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": f"{system_prompt}\n\n{constraint}"})
    else:
        messages.append({"role": "system", "content": constraint})
    messages.append({"role": "user", "content": transcribed_text})
    response = client.chat.complete(model=model, messages=messages, max_tokens=max_tokens)
    return response.choices[0].message.content.strip()
