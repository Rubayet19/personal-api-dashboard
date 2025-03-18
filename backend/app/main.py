from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from .routers import auth

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Personal API Dashboard",
    description="A centralized web dashboard for managing and testing various APIs",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)

@app.get("/")
async def root():
    return {"message": "Welcome to Personal API Dashboard"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"} 