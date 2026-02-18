from fastapi import APIRouter, Depends

from app.api.deps import AuthenticatedUser, get_current_user

router = APIRouter(prefix="/protected")


@router.get("/me", summary="Get authenticated Clerk user")
async def read_current_user(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict[str, object]:
    return {"data": current_user.model_dump()}
