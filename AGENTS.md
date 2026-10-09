<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Backend integration is schema-driven: endpoints and the prediction form are derived at runtime from the FastAPI `/openapi.json` (src/lib/openapi.ts). Why: field names/enums must match the real backend exactly and are never hardcoded.
- All HTTP goes through src/lib/api.ts using `VITE_API_BASE_URL`. Why: one place for base URL, error mapping (400/422/500/503) and messages.
- Never render fabricated metrics or predictions; show unavailable/empty states instead. Why: product accuracy requirement.
- Prediction history is stored in browser localStorage (src/lib/history.ts) since the backend has no history store. Why: no persistent backend storage.
