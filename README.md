# AI API Tester

A small, dependency-free web page for testing OpenAI-compatible AI APIs from the browser.

It lets you enter a base URL, API key, model, temperature, and prompt, then shows the API response and raw JSON in one compact interface.

## Features

- Test OpenAI-compatible `/chat/completions` endpoints
- Save, load, and delete API presets in browser LocalStorage
- View response text, raw JSON, timing, and errors without opening DevTools
- Run as plain HTML, CSS, and JavaScript

## Quick start

1. Open `index.html`.
2. Fill Base URL, API Key, Model, and Temperature.
3. Enter a prompt and click `Send Test`.
4. Read the response and raw JSON on the right.

## Saved configs

- `Save`, `Load`, and `Delete` use browser LocalStorage.
- Configs stay in the current browser profile.
- Saving a config with the same name replaces the previous one.

## Notes

- The page calls `{Base URL}/chat/completions` by default.
- If Base URL already ends with `/chat/completions`, that exact URL is used.
- Some API services block browser requests with CORS. In that case, use a local proxy.
- API keys are stored in browser LocalStorage. Do not save real keys on shared computers.
