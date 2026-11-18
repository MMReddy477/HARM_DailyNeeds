import asyncio
from contextlib import asynccontextmanager, suppress
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
from lib.db import client, db, ensure_indexes, ensure_initial_owner, verify_connection
from lib.storage import init_storage


# Startup runs before the yield, shutdown after it. Add your own setup/teardown here.
@asynccontextmanager
async def lifespan(app: FastAPI):
    await verify_connection()
    await ensure_initial_owner()
    app.state.index_task = asyncio.create_task(ensure_indexes())  # background: a big index build must not block boot
    asyncio.create_task(init_storage())
    yield
    app.state.index_task.cancel()  # stop a build still running before its client closes
    with suppress(asyncio.CancelledError):
        await app.state.index_task
    client.close()


# Create the main app without a prefix
app = FastAPI(lifespan=lifespan)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.model_dump())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]


# Feature routers (each exports its own APIRouter, all mounted under /api)
from routers.auth import router as auth_router
from routers.products import router as products_router
from routers.reviews import router as reviews_router
from routers.revenue import router as revenue_router
from routers.ai import router as ai_router
from routers.uploads import router as uploads_router
from routers.print_orders import router as print_orders_router
from routers.kits import router as kits_router
from routers.reports import router as reports_router
from routers.admin_ops import router as admin_ops_router
from routers.growth import router as growth_router
from routers.milk import router as milk_router

api_router.include_router(auth_router)
api_router.include_router(admin_ops_router)  # before products: /products/bulk must win over /products/{id}
api_router.include_router(products_router)
api_router.include_router(reviews_router)
api_router.include_router(revenue_router)
api_router.include_router(ai_router)
api_router.include_router(uploads_router)
api_router.include_router(print_orders_router)
api_router.include_router(kits_router)
api_router.include_router(reports_router)
api_router.include_router(growth_router)
api_router.include_router(milk_router)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
