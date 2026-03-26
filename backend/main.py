import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.analyze import router as analyze_router
from routers.email import router as email_router


load_dotenv()
load_dotenv(Path(__file__).resolve().parents[1] / ".env.local")

app = FastAPI(title="InternIQ API")

origins = ["http://localhost:3000"]
frontend_url = os.getenv("FRONTEND_URL", "").strip()
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze_router)
app.include_router(email_router)


@app.get("/")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
