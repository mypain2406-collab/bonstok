import os
import uuid
import hmac
import hashlib
import time
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, List

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "bonstok")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "changeme123")
TOKEN_SECRET = os.environ.get("TOKEN_SECRET", "change-this-secret")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="BonStok API")
api_router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def new_id():
    return str(uuid.uuid4())


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ---------------- Admin token (HMAC, no external deps) ----------------

def make_token() -> str:
    ts = str(int(time.time()))
    sig = hmac.new(TOKEN_SECRET.encode(), ts.encode(), hashlib.sha256).hexdigest()
    return f"{ts}.{sig}"


def verify_token(token: str) -> bool:
    try:
        ts, sig = token.split(".", 1)
        expected = hmac.new(TOKEN_SECRET.encode(), ts.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return False
        if time.time() - int(ts) > 7 * 24 * 3600:
            return False
        return True
    except Exception:
        return False


async def require_admin(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Tidak ada token")
    token = authorization.split(" ", 1)[1]
    if not verify_token(token):
        raise HTTPException(status_code=401, detail="Token tidak valid atau kedaluwarsa")
    return True


# ---------------- Models ----------------

class LoginPayload(BaseModel):
    password: str


class ItemPayload(BaseModel):
    name: str
    barcode: str
    unit: str = "pcs"
    category: Optional[str] = None
    current_stock: float = 0
    min_stock: float = 0


class BonItemLine(BaseModel):
    item_id: str
    qty: float


class BonRequestPayload(BaseModel):
    requester_name: str
    room: str
    items: List[BonItemLine]
    note: Optional[str] = None


class MedicinePayload(BaseModel):
    name: str
    unit: str = "pcs"
    category: Optional[str] = None
    current_stock: float = 0
    min_stock: float = 0


class MedicineTransactionPayload(BaseModel):
    medicine_id: str
    type: str  # "masuk" | "keluar"
    qty: float
    nurse_name: str
    note: Optional[str] = None


# ---------------- Public: items (gudang) ----------------

@api_router.get("/health")
async def health():
    return {"ok": True, "time": now_iso()}


@api_router.get("/items")
async def list_items(search: Optional[str] = None):
    q = {}
    if search:
        q = {"$or": [
            {"name": {"$regex": search, "$options": "i"}},
            {"barcode": {"$regex": search, "$options": "i"}},
        ]}
    items = await db.items.find(q, {"_id": 0}).sort("name", 1).to_list(500)
    return items


@api_router.get("/items/by-barcode/{barcode}")
async def get_item_by_barcode(barcode: str):
    item = await db.items.find_one({"barcode": barcode}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Barang dengan barcode ini tidak ditemukan")
    return item


# ---------------- Public: bon request ----------------

@api_router.post("/bon")
async def submit_bon(payload: BonRequestPayload):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Keranjang bon kosong")

    lines = []
    for line in payload.items:
        item = await db.items.find_one({"id": line.item_id})
        if not item:
            raise HTTPException(status_code=404, detail=f"Barang tidak ditemukan: {line.item_id}")
        if line.qty <= 0:
            raise HTTPException(status_code=400, detail="Jumlah harus lebih dari 0")
        lines.append({
            "item_id": item["id"],
            "item_name": item["name"],
            "barcode": item["barcode"],
            "unit": item.get("unit", "pcs"),
            "qty": line.qty,
        })

    doc = {
        "id": new_id(),
        "requester_name": payload.requester_name,
        "room": payload.room,
        "items": lines,
        "note": payload.note,
        "status": "pending",
        "requested_at": now_iso(),
        "decided_at": None,
        "decided_note": None,
    }
    await db.bon_requests.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ---------------- Public: medicines (klinik) ----------------

@api_router.get("/medicines")
async def list_medicines(search: Optional[str] = None):
    q = {}
    if search:
        q = {"name": {"$regex": search, "$options": "i"}}
    meds = await db.medicines.find(q, {"_id": 0}).sort("name", 1).to_list(500)
    return meds


@api_router.post("/medicine-transactions")
async def create_medicine_transaction(payload: MedicineTransactionPayload):
    if payload.type not in ("masuk", "keluar"):
        raise HTTPException(status_code=400, detail="Tipe transaksi tidak valid")
    if payload.qty <= 0:
        raise HTTPException(status_code=400, detail="Jumlah harus lebih dari 0")

    med = await db.medicines.find_one({"id": payload.medicine_id})
    if not med:
        raise HTTPException(status_code=404, detail="Obat tidak ditemukan")

    delta = payload.qty if payload.type == "masuk" else -payload.qty
    new_stock = med.get("current_stock", 0) + delta
    if new_stock < 0:
        raise HTTPException(status_code=400, detail="Stok obat tidak cukup")

    await db.medicines.update_one({"id": payload.medicine_id}, {"$set": {"current_stock": new_stock}})

    doc = {
        "id": new_id(),
        "medicine_id": payload.medicine_id,
        "medicine_name": med["name"],
        "type": payload.type,
        "qty": payload.qty,
        "nurse_name": payload.nurse_name,
        "note": payload.note,
        "created_at": now_iso(),
    }
    await db.medicine_transactions.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ---------------- Admin auth ----------------

@api_router.post("/admin/login")
async def admin_login(payload: LoginPayload):
    if not hmac.compare_digest(payload.password, ADMIN_PASSWORD):
        raise HTTPException(status_code=401, detail="Password salah")
    return {"token": make_token()}


# ---------------- Admin: items ----------------

@api_router.get("/admin/items")
async def admin_list_items(_: bool = Depends(require_admin)):
    items = await db.items.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    return items


@api_router.post("/admin/items")
async def admin_create_item(payload: ItemPayload, _: bool = Depends(require_admin)):
    existing = await db.items.find_one({"barcode": payload.barcode})
    if existing:
        raise HTTPException(status_code=400, detail="Barcode sudah terdaftar")
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["created_at"] = now_iso()
    await db.items.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/items/{item_id}")
async def admin_update_item(item_id: str, payload: ItemPayload, _: bool = Depends(require_admin)):
    existing = await db.items.find_one({"id": item_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Barang tidak ditemukan")
    dup = await db.items.find_one({"barcode": payload.barcode, "id": {"$ne": item_id}})
    if dup:
        raise HTTPException(status_code=400, detail="Barcode sudah dipakai barang lain")
    doc = payload.model_dump()
    doc["updated_at"] = now_iso()
    await db.items.update_one({"id": item_id}, {"$set": doc})
    updated = await db.items.find_one({"id": item_id}, {"_id": 0})
    return updated


@api_router.delete("/admin/items/{item_id}")
async def admin_delete_item(item_id: str, _: bool = Depends(require_admin)):
    await db.items.delete_one({"id": item_id})
    return {"ok": True}


# ---------------- Admin: bon requests ----------------

@api_router.get("/admin/bon")
async def admin_list_bon(status: Optional[str] = None, _: bool = Depends(require_admin)):
    q = {}
    if status:
        q["status"] = status
    items = await db.bon_requests.find(q, {"_id": 0}).sort("requested_at", -1).to_list(500)
    return items


@api_router.post("/admin/bon/{bon_id}/approve")
async def admin_approve_bon(bon_id: str, _: bool = Depends(require_admin)):
    bon = await db.bon_requests.find_one({"id": bon_id})
    if not bon:
        raise HTTPException(status_code=404, detail="Bon tidak ditemukan")
    if bon["status"] != "pending":
        raise HTTPException(status_code=400, detail="Bon sudah diproses")

    for line in bon["items"]:
        item = await db.items.find_one({"id": line["item_id"]})
        if not item:
            raise HTTPException(status_code=404, detail=f"Barang {line['item_name']} tidak ditemukan")
        if item.get("current_stock", 0) < line["qty"]:
            raise HTTPException(status_code=400, detail=f"Stok {line['item_name']} tidak cukup")

    for line in bon["items"]:
        await db.items.update_one(
            {"id": line["item_id"]},
            {"$inc": {"current_stock": -line["qty"]}},
        )

    await db.bon_requests.update_one(
        {"id": bon_id},
        {"$set": {"status": "approved", "decided_at": now_iso()}},
    )
    updated = await db.bon_requests.find_one({"id": bon_id}, {"_id": 0})
    return updated


class DecisionPayload(BaseModel):
    note: Optional[str] = None


@api_router.post("/admin/bon/{bon_id}/reject")
async def admin_reject_bon(bon_id: str, payload: DecisionPayload, _: bool = Depends(require_admin)):
    bon = await db.bon_requests.find_one({"id": bon_id})
    if not bon:
        raise HTTPException(status_code=404, detail="Bon tidak ditemukan")
    if bon["status"] != "pending":
        raise HTTPException(status_code=400, detail="Bon sudah diproses")

    await db.bon_requests.update_one(
        {"id": bon_id},
        {"$set": {"status": "rejected", "decided_at": now_iso(), "decided_note": payload.note}},
    )
    updated = await db.bon_requests.find_one({"id": bon_id}, {"_id": 0})
    return updated


# ---------------- Admin: medicines ----------------

@api_router.get("/admin/medicines")
async def admin_list_medicines(_: bool = Depends(require_admin)):
    meds = await db.medicines.find({}, {"_id": 0}).sort("name", 1).to_list(1000)
    return meds


@api_router.post("/admin/medicines")
async def admin_create_medicine(payload: MedicinePayload, _: bool = Depends(require_admin)):
    doc = payload.model_dump()
    doc["id"] = new_id()
    doc["created_at"] = now_iso()
    await db.medicines.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/medicines/{medicine_id}")
async def admin_update_medicine(medicine_id: str, payload: MedicinePayload, _: bool = Depends(require_admin)):
    existing = await db.medicines.find_one({"id": medicine_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Obat tidak ditemukan")
    doc = payload.model_dump()
    doc["updated_at"] = now_iso()
    await db.medicines.update_one({"id": medicine_id}, {"$set": doc})
    updated = await db.medicines.find_one({"id": medicine_id}, {"_id": 0})
    return updated


@api_router.delete("/admin/medicines/{medicine_id}")
async def admin_delete_medicine(medicine_id: str, _: bool = Depends(require_admin)):
    await db.medicines.delete_one({"id": medicine_id})
    return {"ok": True}


@api_router.get("/admin/medicine-transactions")
async def admin_list_medicine_transactions(medicine_id: Optional[str] = None, _: bool = Depends(require_admin)):
    q = {}
    if medicine_id:
        q["medicine_id"] = medicine_id
    items = await db.medicine_transactions.find(q, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return items


# ---------------- Admin: stats ----------------

@api_router.get("/admin/stats")
async def admin_stats(_: bool = Depends(require_admin)):
    total_items = await db.items.count_documents({})
    low_stock_items = await db.items.count_documents({"$expr": {"$lte": ["$current_stock", "$min_stock"]}})
    total_medicines = await db.medicines.count_documents({})
    low_stock_medicines = await db.medicines.count_documents({"$expr": {"$lte": ["$current_stock", "$min_stock"]}})
    pending_bon = await db.bon_requests.count_documents({"status": "pending"})
    approved_bon = await db.bon_requests.count_documents({"status": "approved"})
    rejected_bon = await db.bon_requests.count_documents({"status": "rejected"})

    return {
        "total_items": total_items,
        "low_stock_items": low_stock_items,
        "total_medicines": total_medicines,
        "low_stock_medicines": low_stock_medicines,
        "pending_bon": pending_bon,
        "approved_bon": approved_bon,
        "rejected_bon": rejected_bon,
    }


# ---------------- Startup ----------------

@app.on_event("startup")
async def startup():
    await db.items.create_index("id", unique=True)
    await db.items.create_index("barcode", unique=True)
    await db.medicines.create_index("id", unique=True)
    await db.bon_requests.create_index("id", unique=True)
    await db.bon_requests.create_index("status")
    await db.medicine_transactions.create_index("id", unique=True)
    await db.medicine_transactions.create_index("medicine_id")


app.include_router(api_router)
