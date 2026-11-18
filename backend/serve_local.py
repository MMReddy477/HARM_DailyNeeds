from pathlib import Path
import os

from fastapi import HTTPException
from fastapi.responses import FileResponse

from server import app

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"
INDEX_FILE = FRONTEND_DIR / "index.html"


if not INDEX_FILE.is_file():
    raise FileNotFoundError("Build the frontend first with `npm run build` in the frontend directory.")


@app.get("/{path:path}", include_in_schema=False)
async def serve_frontend(path: str):
    if path == "api" or path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Not found")

    candidate = (FRONTEND_DIR / path).resolve()
    try:
        candidate.relative_to(FRONTEND_DIR)
    except ValueError:
        raise HTTPException(status_code=404, detail="Not found")

    if candidate.is_file():
        return FileResponse(candidate)
    return FileResponse(INDEX_FILE)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=os.environ.get("HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", "3000")),
    )
