from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.internal.agent_builder import kanban

router = APIRouter(prefix="/board", tags=["board"])


class TaskItem(BaseModel):
    task_id: str
    column_id: str
    title: str
    description: str | None
    created_at: str
    updated_at: str


class ColumnWithTasks(BaseModel):
    column_id: str
    name: str
    position: int
    tasks: list[TaskItem]


class BoardResponse(BaseModel):
    board_id: str
    columns: list[ColumnWithTasks]


class CreateTaskRequest(BaseModel):
    column_id: str
    title: str
    description: str | None = None


class MoveTaskRequest(BaseModel):
    column_id: str | None = None
    title: str | None = None
    description: str | None = None


@router.get("")
async def get_board() -> BoardResponse:
    """Init the board (idempotent) and return all columns with their tasks."""
    import os

    if not os.environ.get("AGENT_POC_API_KEY"):
        raise HTTPException(
            status_code=503, detail="AGENT_POC_API_KEY secret is not set"
        )
    board = kanban.init_board()
    if not board:
        raise HTTPException(
            status_code=503,
            detail="Kanban API call failed — check AGENT_POC_API_KEY and AGENT_POC_API_URL",
        )

    tasks = kanban.list_tasks()
    tasks_by_col: dict[str, list[TaskItem]] = {}
    for t in tasks:
        item = TaskItem(
            task_id=t["id"],
            column_id=t["column_id"],
            title=t["title"],
            description=t.get("description"),
            created_at=t["created_at"],
            updated_at=t["updated_at"],
        )
        tasks_by_col.setdefault(t["column_id"], []).append(item)

    columns = [
        ColumnWithTasks(
            column_id=col["id"],
            name=col["name"],
            position=col["position"],
            tasks=tasks_by_col.get(col["id"], []),
        )
        for col in sorted(board["columns"], key=lambda c: c["position"])
    ]
    return BoardResponse(board_id=board["id"], columns=columns)


@router.post("/tasks")
async def create_board_task(body: CreateTaskRequest) -> TaskItem:
    t = kanban.create_task(body.column_id, body.title, body.description)
    if not t:
        raise HTTPException(status_code=503, detail="Failed to create task")
    return TaskItem(
        task_id=t["id"],
        column_id=t["column_id"],
        title=t["title"],
        description=t.get("description"),
        created_at=t["created_at"],
        updated_at=t["updated_at"],
    )


@router.patch("/tasks/{task_id}")
async def update_board_task(task_id: str, body: MoveTaskRequest) -> TaskItem:
    t = kanban.update_task(
        task_id,
        column_id=body.column_id,
        title=body.title,
        description=body.description,
    )
    if not t:
        raise HTTPException(status_code=503, detail="Failed to update task")
    return TaskItem(
        task_id=t["id"],
        column_id=t["column_id"],
        title=t["title"],
        description=t.get("description"),
        created_at=t["created_at"],
        updated_at=t["updated_at"],
    )
