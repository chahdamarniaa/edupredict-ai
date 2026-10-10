# Student Performance Predictor AI — Frontend

React + TypeScript + Tailwind + shadcn/ui dashboard for an existing FastAPI / scikit-learn backend.
(Routing uses TanStack Router, the framework this project is built on.)

## Configure

```bash
cp .env.example .env
# edit VITE_API_BASE_URL if the backend is elsewhere
```

`VITE_API_BASE_URL` defaults to `http://127.0.0.1:8000`. When you deploy the backend, set it to the public
URL (e.g. `https://api.example.com`) and rebuild.

## Run

```bash
bun install
bun run dev
```

## How backend integration works

On load the app reads `${VITE_API_BASE_URL}/openapi.json` and discovers:

- health route (`/health`, `/status`…) → model status indicator
- metrics route (`/metrics`…) → evaluation cards and comparison chart
- analytics/summary route (optional)
- POST prediction route (`/predict`…) → the form is generated from its exact request schema
  (field names, enums, min/max, required)

Nothing is mocked: if a route is missing or unreachable, a clear unavailable state is shown.
Validation errors (422) are mapped back onto the matching form fields.

## Error types shown in the UI

| Label | Meaning |
|---|---|
| Network error | Nothing answered at `VITE_API_BASE_URL` (uvicorn down, wrong port/host). |
| CORS blocked | The server answered, but the browser blocked the response — the page origin is not in `allow_origins`. |
| Mixed content | An https page tried to call a non-local `http://` backend. |
| Model unavailable | Backend returned 503 (model not loaded). |
| Validation error | Backend returned 422; messages are attached to the matching form fields. |
| Bad request / Server error | 400 / 5xx with the backend's `detail` text. |

## CORS: origins to allow

The frontend origin is scheme + host + port of the page in the browser — not the backend URL.

- Local dev (`bun run dev`): `http://localhost:8080` (and `http://127.0.0.1:8080` if you open it that way).
- Hosted Lovable preview: `https://id-preview--ae9de8d5-90bf-543b-83a9-5727eab1ac64.lovable.app`
- Published site / custom domain: its exact `https://` origin.

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept"],
)
```

## Hosted preview vs. local backend

`127.0.0.1` always means the computer running the browser. The hosted preview can only reach your WSL2 backend
from your own machine, and modern browsers may still block a public https page from calling a local address
(Private Network Access rules). For reliable testing run the frontend locally. To test from anywhere, deploy the
backend at a public **https** URL, set `VITE_API_BASE_URL` to it, and add the hosted origin to `allow_origins`.

## Local test steps (WSL2)

1. In WSL: `uvicorn app.main:app --host 0.0.0.0 --port 8000` (adjust module path). `--host 0.0.0.0` lets Windows reach WSL.
2. In a Windows browser, open `http://127.0.0.1:8000/docs` — it must load.
3. Open `http://127.0.0.1:8000/openapi.json` and confirm health, metrics and a POST predict route are listed.
4. Add `http://localhost:8080` to FastAPI `allow_origins`, restart uvicorn.
5. In the frontend folder: `cp .env.example .env`, `bun install`, `bun run dev`, open `http://localhost:8080`.
6. Sidebar should show **Model ready**; Dashboard/Insights show your real metrics.
7. Predict page: the form fields should match your request schema exactly. Fill it in and click **Predict grade**.
8. In DevTools → Network, check the `POST` request body matches `/docs` and the response is 200.
