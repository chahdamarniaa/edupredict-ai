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

## Important: reachability & CORS

`127.0.0.1` means *the machine running the browser*. The backend must be reachable from the user's
browser, and FastAPI must allow the frontend origin:

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:8080", "https://your-frontend.app"],
                   allow_methods=["*"], allow_headers=["*"])
```

A hosted (https) frontend cannot call a plain `http://127.0.0.1` backend from most browsers — deploy the
backend behind https or run the frontend locally.
