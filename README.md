# RasoiMitra

A mobile-friendly Hindi/English recipe and general nutrition assistant. It supports typed questions, microphone input, spoken answers, and saved recipe favorites. Chats are temporary for the current page session and are not saved or shown as past chats.

## Run it in Replit

1. Add `GROQ_API_KEY` in the Replit **Secrets** tool. The key stays on the server and is never sent to the browser.
2. Click **Run**. Replit starts the web app and shared API server together.
3. Open the app preview. Ask a cooking or nutrition question, or use a quick prompt. Allow microphone access to speak.
4. Use the language control for Hindi or English. The microphone uses the selected locale; the answer follows the language of your message.
5. Star an assistant recipe to save it. Favorites and app preferences remain in this browser's localStorage; chats do not.

If you run the services manually, use two terminals:

```sh
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/rasoi-mitra run dev
```

The browser uses Web Speech API for both microphone input and spoken replies. Spoken replies use the selected Hindi (`hi-IN`) or Indian English (`en-IN`) locale and do not need a separate TTS key. The API server sends recipe and nutrition questions to Groq through its OpenAI-compatible endpoint. Groq usage is billed under the account associated with your key.

## Publish it

1. Add and test `GROQ_API_KEY` in Replit Secrets first.
2. Open **Publishing** and choose **Publish**. The web app and API server are published together as project artifacts.
3. In Publishing, open **Adjust settings** and confirm `GROQ_API_KEY` is available under **Deployment secrets**. Add it there if it is not already present.
4. Keep the default web-app deployment settings unless you have a specific need to change them, then publish.
5. Open the published URL and test one text question, one microphone question, and a reply's play button.

## Useful checks

```sh
pnpm --filter @workspace/rasoi-mitra run typecheck
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/api-spec run codegen
```