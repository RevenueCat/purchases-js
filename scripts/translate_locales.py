import json
import os
import sys
import argparse

import requests
from requests.exceptions import RequestException


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
            "Warning: keys_context.json contains invalid JSON. Proceeding without context."
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

    except RequestException as e:
        print(f"Error during translation: {e} {e.response.text}")
        return None
    except (KeyError, IndexError, ValueError) as e:
        print(f"Error parsing Gemini response: {e}. Response: {response.text}")
        return None


def process_json_files(
    directory,
    target_language,
    keys_to_update=None,
    delete_missing_keys=False,
    dry_run=False,
):
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

    keys_context = load_keys_context(os.path.dirname(directory))
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
            en_data,  # Pass full source data for deletion logic
            directory,
            f"{target_language}.json",
            target_language,
            keys_to_update,
            keys_context,
            delete_missing_keys,
            dry_run,
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
                en_data,  # Pass full source data for deletion logic
                directory,
                filename,
                target_language,
                keys_to_update,
                keys_context,
                delete_missing_keys,
                dry_run,
            )


def process_json_file(
    en_data_to_translate,
    full_source_data,
    directory,
    filename,
    target_language,
    keys_to_update=None,
    keys_context=None,
    delete_missing_keys=False,
    dry_run=False,
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

    # If we're only deleting missing keys and not translating, skip translation
    if delete_missing_keys and not keys_to_update and not dry_run:
        print(f"Deleting missing keys from {filename}...")
        output_data = existing_data.copy()
    elif dry_run:
        print(f"Dry run: Analyzing {filename}...")
        output_data = existing_data.copy()
    else:
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

    # Handle deletion of missing keys
    if delete_missing_keys and existing_data:
        source_keys = set(full_source_data.keys())
        existing_keys = set(existing_data.keys())
        keys_to_delete = existing_keys - source_keys

        if keys_to_delete:
            print(
                f"Deleting {len(keys_to_delete)} missing keys from {filename}: {', '.join(sorted(keys_to_delete))}"
            )
            for key in keys_to_delete:
                if key in output_data:
                    del output_data[key]
        else:
            print(f"No missing keys to delete in {filename}")

    if not dry_run:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        print(f"Updated {filename}")
    else:
        print(f"Dry run: Would update {filename}")
        if delete_missing_keys and existing_data:
            source_keys = set(full_source_data.keys())
            existing_keys = set(existing_data.keys())
            keys_to_delete = existing_keys - source_keys
            if keys_to_delete:
                print(f"  Would delete keys: {', '.join(sorted(keys_to_delete))}")
            else:
                print(f"  No keys would be deleted")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Translate locale files using Gemini API"
    )
    parser.add_argument(
        "directory", nargs="?", default=".", help="Directory containing locale files"
    )
    parser.add_argument(
        "target_language",
        nargs="?",
        help="Target language code (e.g., 'es', 'fr') or 'all' for all languages",
    )
    parser.add_argument(
        "keys_to_update",
        nargs="?",
        help="Comma-separated list of specific keys to update",
    )
    parser.add_argument(
        "--delete-missing-keys",
        action="store_true",
        help="Delete keys that are no longer present in the source language",
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Perform a dry run (no changes to files)"
    )

    args = parser.parse_args()

    directory_path = args.directory
    target_language = args.target_language
    keys_to_update = None
    delete_missing_keys = args.delete_missing_keys
    dry_run = args.dry_run

    # Parse target languages
    target_languages = None
    if target_language == "all":
        target_language = None
    elif target_language and "," in target_language:
        target_languages = target_language.split(",")
        print(f"Translating to languages: {', '.join(target_languages)}")
        target_language = None

    # Parse keys to update if provided
    if args.keys_to_update:
        keys_to_update = set(args.keys_to_update.split(","))
        print(f"Only updating keys: {', '.join(keys_to_update)}")
    # Allow specifying keys_to_update as the third argument when no target language is specified
    # Only treat as keys if it contains dots (typical for JSON keys) or commas
    elif target_language and ("." in target_language or "," in target_language):
        keys_to_update = set(target_language.split(","))
        target_language = None
        print(f"Only updating keys: {', '.join(keys_to_update)}")

    if delete_missing_keys:
        print("Deleting missing keys from translation files.")

    if target_languages:
        for lang in target_languages:
            print(f"\nProcessing language: {lang}")
            process_json_files(
                directory_path, lang, keys_to_update, delete_missing_keys, dry_run
            )
    else:
        process_json_files(
            directory_path,
            target_language,
            keys_to_update,
            delete_missing_keys,
            dry_run,
        )
