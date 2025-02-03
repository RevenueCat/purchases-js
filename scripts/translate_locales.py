import json
import os
import requests
import sys


def get_api_key():
    api_key = os.getenv("GEMINI_API_KEY", None)
    if api_key is None:
        raise ValueError("Env var GEMINI_API_KEY is not set")
    return api_key


def translate_text(text, target_language):
    headers = {
        "Authorization": f"Bearer {get_api_key()}",
        "Content-Type": "application/json",
    }

    data = {
        "model": "gemini-1.5-flash-latest",
        "messages": [
            {
                "role": "system",
                "content": f"Translate the following JSON into the language with the ISO 639-1 code {target_language.upper()}. "
                'Return a valid JSON object using double quotes (`"`) for keys and string values. '
                "Do *not* wrap the JSON in any formatting markers like ```json or ```. "
                "Maintain the context of a subscription app payment flow. "
                "Keep the JSON keys and variables between braces {{{{ and }}}} unchanged. "
                "Do *not* prepend or append any explanatory text to the JSON output. "
                "The response should be **valid JSON** that can be parsed using `json.loads()`. ",
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


def process_json_files(directory, target_language):
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

    if target_language is not None:
        process_json_file(
            en_data, directory, f"{target_language}.json", target_language
        )
        return

    for filename in os.listdir(directory):
        if filename.endswith(".json") and filename != "en.json":
            target_language = filename[:-5]
            process_json_file(en_data, directory, filename, target_language)


def process_json_file(en_data, directory, filename, target_language):
    filepath = os.path.join(directory, filename)

    print(f"Translating JSON file {filename}...")

    translated_values = translate_text(str(en_data), target_language)
    translated_data = json.loads(translated_values)

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(translated_data, f, indent=2, ensure_ascii=False)
    print(f"Updated {filename}")


if __name__ == "__main__":
    directory_path = sys.argv[1] if len(sys.argv) > 1 else "."
    target_language = sys.argv[2] if len(sys.argv) > 2 else None
    process_json_files(directory_path, target_language)
