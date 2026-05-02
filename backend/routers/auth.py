from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    username: str


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest):
    """
    Demo login endpoint.
    Replace this with real JWT + database authentication.
    """
    # TODO: validate credentials against DB and issue a real JWT
    if payload.username == "admin" and payload.password == "admin":
        return LoginResponse(
            access_token="demo-token-replace-with-jwt",
            token_type="bearer",
            username=payload.username,
        )
    from fastapi import HTTPException
    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.get("/me")
async def get_me():
    """Return current authenticated user info (stub)."""
    return {"username": "admin", "role": "superuser"}
