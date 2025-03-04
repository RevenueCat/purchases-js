import json
import os
import requests
import sys


def get_api_key():
    api_key = os.getenv("GEMINI_API_KEY", None)
    if api_key is None:
        raise ValueError("Env var GEMINI_API_KEY is not set")
    return api_key


def load_keys_context(directory):
    """Load the keys context file if it exists."""
    context_file_path = os.path.join(directory, "keys_context.json")
    if not os.path.exists(context_file_path):
        # Try looking in the localization directory
        context_file_path = os.path.join(directory, "..", "keys_context.json")
        if not os.path.exists(context_file_path):
            return {}

    try:
        with open(context_file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(
            f"Warning: keys_context.json contains invalid JSON. Proceeding without context."
        )
        return {}


def translate_text(text, target_language, keys_context=None):
    headers = {
        "Authorization": f"Bearer {get_api_key()}",
        "Content-Type": "application/json",
    }

    # Create a system prompt that includes context for each key if available
    system_prompt = f"Translate the following JSON into the language with the ISO 639-1 code {target_language.upper()}. "
    system_prompt += 'Return a valid JSON object using double quotes (`"`) for keys and string values. '
    system_prompt += (
        "Do *not* wrap the JSON in any formatting markers like ```json or ```. "
    )
    system_prompt += "Maintain the context of a subscription app payment flow. "
    system_prompt += (
        "Keep the JSON keys and variables between braces {{{{ and }}}} unchanged. "
    )
    system_prompt += (
        "Do *not* prepend or append any explanatory text to the JSON output. "
    )
    system_prompt += "The response should be **valid JSON** that can be parsed using `json.loads()`. "

    # Add context information if available
    if keys_context:
        system_prompt += "\n\nHere is additional context for some of the keys to help with translation:\n"
        for key, context in keys_context.items():
            if (
                key in text
            ):  # Only include context for keys that are in the text to translate
                system_prompt += f"- {key}: {context}\n"

    data = {
        "model": "gemini-2.0-flash",
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {"role": "user", "content": text},
        ],
        "max_tokens": 8192,
        "temperature": 0.3,
    }

    try:
        response = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/chat/completions",
            headers=headers,
            json=data,
            timeout=120,
        )
        response.raise_for_status()
        result = response.json()

        translated_text = (
            result.get("choices", [{}])[0].get("message", {}).get("content", "")
        )

        # Remove the ```json and ``` from the beginning and end of the translated text if they still exist
        translated_text = translated_text.strip("```json").strip("```")

        if not translated_text:
            raise ValueError(
                f"Unexpected response format: {json.dumps(result, indent=2)}"
            )

        return translated_text

    except requests.exceptions.RequestException as e:
        print(f"Error during translation: {e}")
        return None
    except (KeyError, IndexError, ValueError) as e:
        print(f"Error parsing Gemini response: {e}. Response: {response.text}")
        return None


def process_json_files(directory, target_language, keys_to_update=None):
    en_data = None
    for filename in os.listdir(directory):
        if filename == "en.json":
            filepath = os.path.join(directory, filename)
            with open(filepath, "r", encoding="utf-8") as f:
                en_data = json.load(f)
            break

    if en_data is None:
        print("en.json not found in the directory.")
        return

    # Load keys context
    keys_context = load_keys_context(directory)
    if keys_context:
        print(f"Loaded context for {len(keys_context)} keys")
    else:
        print("No keys context found or loaded")

    # If keys_to_update is provided, filter the English data to only include those keys
    if keys_to_update:
        filtered_en_data = {k: v for k, v in en_data.items() if k in keys_to_update}
        if not filtered_en_data:
            print("None of the specified keys found in en.json.")
            return
        en_data_to_translate = filtered_en_data
    else:
        en_data_to_translate = en_data

    if target_language is not None:
        process_json_file(
            en_data_to_translate,
            directory,
            f"{target_language}.json",
            target_language,
            keys_to_update,
            keys_context,
        )
        return

    for filename in os.listdir(directory):
        if (
            filename.endswith(".json")
            and filename != "en.json"
            and filename != "keys_context.json"
        ):
            target_language = filename[:-5]
            process_json_file(
                en_data_to_translate,
                directory,
                filename,
                target_language,
                keys_to_update,
                keys_context,
            )


def process_json_file(
    en_data_to_translate,
    directory,
    filename,
    target_language,
    keys_to_update=None,
    keys_context=None,
):
    filepath = os.path.join(directory, filename)
    existing_data = {}

    # Load existing translation file if it exists
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
        except json.JSONDecodeError:
            print(f"Warning: {filename} contains invalid JSON. Creating a new file.")

    print(f"Translating JSON file {filename}...")

    translated_values = translate_text(
        json.dumps(en_data_to_translate, ensure_ascii=False),
        target_language,
        keys_context,
    )

    if not translated_values:
        print(f"Translation failed for {filename}. Skipping.")
        return

    try:
        translated_data = json.loads(translated_values)
    except json.JSONDecodeError as e:
        print(f"Error: Could not parse translated JSON for {filename}: {e}")
        print(f"Raw translated text: {translated_values[:200]}...")
        return

    # If we're only updating specific keys, merge with existing data
    if keys_to_update:
        # Update only the specified keys in the existing data
        for key in keys_to_update:
            if key in translated_data:
                existing_data[key] = translated_data[key]
        output_data = existing_data
    else:
        output_data = translated_data

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    print(f"Updated {filename}")


if __name__ == "__main__":
    directory_path = sys.argv[1] if len(sys.argv) > 1 else "."
    target_language = sys.argv[2] if len(sys.argv) > 2 else None

    # Parse target languages
    target_languages = None
    if target_language == "all":
        target_language = None
    elif target_language and "," in target_language:
        target_languages = target_language.split(",")
        print(f"Translating to languages: {', '.join(target_languages)}")
        target_language = None

    # Parse keys to update if provided
    keys_to_update = None
    if len(sys.argv) > 3:
        keys_to_update = set(sys.argv[3].split(","))
        print(f"Only updating keys: {', '.join(keys_to_update)}")
    # Allow specifying keys_to_update as the third argument when no target language is specified
    elif len(sys.argv) == 3 and (
        target_language == "all"
        or
        # Check if the argument doesn't look like a language code (typically 2-3 chars)
        (target_language and (len(target_language) > 3 or "," in target_language))
    ):
        keys_to_update = set(target_language.split(","))
        target_language = None
        print(f"Only updating keys: {', '.join(keys_to_update)}")

    if target_languages:
        for lang in target_languages:
            print(f"\nProcessing language: {lang}")
            process_json_files(directory_path, lang, keys_to_update)
    else:
        process_json_files(directory_path, target_language, keys_to_update)
