from fastapi import APIRouter
from pydantic import BaseModel

from app.internal.agent_builder.mcp import ALL_TOOLS

router = APIRouter(prefix="/tools", tags=["tools"])


class ToolInfo(BaseModel):
    name: str
    description: str
    input_schema: dict


@router.get("")
def list_tools() -> list[ToolInfo]:
    """List all tools available to the agent, with their names, descriptions, and input schemas."""
    return [
        ToolInfo(
            name=tool.name,
            description=tool.description,
            input_schema={
                k: v.__name__ if hasattr(v, "__name__") else str(v)
                for k, v in tool.input_schema.items()
            },
        )
        for tool in ALL_TOOLS
    ]
