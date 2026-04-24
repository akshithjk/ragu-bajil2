from fastapi import APIRouter, Depends
from core.auth import get_current_user
from db.seed import seed_db

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/reset")
async def reset_database(user: dict = Depends(get_current_user)):
    """
    Resets the database to its initial seeded state.
    WARNING: This will drop all data and recreate the mock data.
    """
    await seed_db()
    return {"status": "success", "message": "Database has been reset to initial seeded state."}
