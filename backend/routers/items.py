from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

# ── Schemas ───────────────────────────────────────────────────────────────────

class Item(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    price: float
    in_stock: bool = True


class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    in_stock: bool = True


# ── In-memory DB (replace with a real DB later) ───────────────────────────────

_items_db: List[Item] = [
    Item(id=1, name="Laptop", description="High-performance laptop", price=999.99, in_stock=True),
    Item(id=2, name="Mouse",  description="Wireless ergonomic mouse", price=49.99,  in_stock=True),
    Item(id=3, name="Keyboard", description="Mechanical keyboard", price=129.99, in_stock=False),
]
_next_id = 4


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[Item])
async def get_items():
    """Return all items."""
    return _items_db


@router.get("/{item_id}", response_model=Item)
async def get_item(item_id: int):
    """Return a single item by ID."""
    for item in _items_db:
        if item.id == item_id:
            return item
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Item not found")


@router.post("/", response_model=Item, status_code=201)
async def create_item(payload: ItemCreate):
    """Create a new item."""
    global _next_id
    item = Item(id=_next_id, **payload.model_dump())
    _items_db.append(item)
    _next_id += 1
    return item


@router.delete("/{item_id}")
async def delete_item(item_id: int):
    """Delete an item by ID."""
    global _items_db
    original_len = len(_items_db)
    _items_db = [i for i in _items_db if i.id != item_id]
    if len(_items_db) == original_len:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Item not found")
    return {"detail": "Item deleted"}
