from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, seed_data, get_db
from dependencies import get_current_user
from routers import auth, products, orders, discounts, favourites, chat

app = FastAPI(
    title="Fashion Dashboard API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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