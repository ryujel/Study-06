# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository contents

- `index.html` — a single-file shopping list web app (the only source code in this repo), backed by a Supabase Postgres database
- `AI_기술_트렌드_요약.pptx` — a slide deck; not source code
- `이미지/` — reference images used alongside the deck

There is no `package.json`, build tool, linter, or test suite. There is nothing to install or build.

## Running

`index.html` is fully self-contained (inline `<style>` and `<script>`), with a single external dependency loaded from a CDN: the `@supabase/supabase-js` UMD build (`<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2">`). Open it directly in a browser, or serve it with any static file server, e.g.:

```
npx serve .
```

An internet connection is required both to load the Supabase client script and to reach the Supabase project itself.

## Supabase backend

- Project: `ryujel's Project` (ref `cwzkfcpgodxtmosunzwg`, region `ap-northeast-2`).
- Table: `public.shopping_items` — `id bigint generated always as identity primary key`, `text text not null`, `checked boolean not null default false`, `created_at timestamptz not null default now()`.
- RLS is enabled with a permissive `for all` policy granted to the `anon` role, since the app has no authentication and the `SUPABASE_URL/SUPABASE_KEY` constants at the top of `index.html`'s script are the public publishable (anon) key — safe to expose client-side because access is scoped entirely by that RLS policy, not by key secrecy.
- Managed via the Supabase MCP server (`mcp__supabase__*` tools) rather than a local migrations folder.

## Architecture of index.html

- All state lives in a single in-memory array of `{ id, text, checked }` items (`id` is the DB row's bigint id). The array is a client-side cache of `public.shopping_items`; every mutation writes through to Supabase via the `db` client (`createClient` from supabase-js) and every load (`loadItems`, called once on startup) reads from it — there is no `localStorage` persistence.
- `render()` does a full re-render of `<ul id="list">` from the `items` array on every mutation — there is no diffing, so any state change is followed by a `render()` call to stay in sync.
- Mutations (`addItem`, `toggleItem`, `removeItem`, `clearChecked`) are `async` and await the corresponding Supabase call (`insert`/`update`/`delete`); `toggleItem` updates local state optimistically and reverts + re-renders if the Supabase call fails, and the others log to `console.error` on failure without rolling back.
- List interactions (checkbox toggle, delete) use a single delegated click listener on `#list` rather than per-item listeners; `li.dataset.id` (coerced with `Number(...)`, since Supabase returns numeric ids) maps a DOM node back to its item.
- Item removal plays a CSS `fadeOut` animation before the item is actually spliced out of `items` (`removeItem` waits on `animationend`), so the array mutation — and the Supabase `delete` — is deferred relative to the click.

## 이미지 생성 제외 단어 (2부류)

새 단어가 나오면 아래 두 부류 중 하나에 해당할 때 이미지 생성 단어에서 제외한다.

1. **기존 이미지가 있는 단어** — Supabase `word_images`에 이미 있는 단어(뜻이 다른 동음이의어·(레시피) 식자재 행은 별개). 매번 DB와 대조한다.
2. **단어로 추출됐지만 불필요해 삭제한 단어** — `docs/삭제단어_기억.md`(= 엑셀 `예외단어` 시트)에 기록. 새로 지우면 두 곳에 함께 기록한다.

GPT가 제외·통합한 단어는 클로드가 다시 추가하지 않는다(충돌하면 GPT 의견 우선).
