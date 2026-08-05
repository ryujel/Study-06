# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository contents

- `shopping-list.html` — a single-file, dependency-free shopping list web app (the only source code in this repo)
- `AI_기술_트렌드_요약.pptx` — a slide deck; not source code
- `이미지/` — reference images used alongside the deck

There is no `package.json`, build tool, linter, or test suite. There is nothing to install or build.

## Running

`shopping-list.html` is fully self-contained (inline `<style>` and `<script>`, no external dependencies). Open it directly in a browser, or serve it with any static file server, e.g.:

```
npx serve .
```

## Architecture of shopping-list.html

- All state lives in a single in-memory array of `{ id, text, checked }` items, persisted as JSON to `localStorage` under the key `shopping-list-items` (`loadItems` / `saveItems`).
- `render()` does a full re-render of `<ul id="list">` from the `items` array on every mutation — there is no diffing, so any state change is followed by a `render()` call to stay in sync.
- List interactions (checkbox toggle, delete) use a single delegated click listener on `#list` rather than per-item listeners; `li.dataset.id` maps a DOM node back to its item.
- Item removal plays a CSS `fadeOut` animation before the item is actually spliced out of `items` (`removeItem` waits on `animationend`), so the array mutation is deferred relative to the click.
