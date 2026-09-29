import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, seed_data, get_db
from dependencies import get_current_user
from routers import auth, products, orders, discounts, favourites, chat

app = FastAPI(
    title="Fashion Dashboard API",
    version="1.0.0",
)

allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()]

if not allowed_origins:
    allowed_origins = [
        "https://fashion-dashboard-two.vercel.app",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()
    seed_data()

# Mount Modular Routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(orders.router)
app.include_router(discounts.router)
app.include_router(favourites.router)
app.include_router(chat.router)
