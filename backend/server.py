from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
import hmac
import json
import os
import time
import uuid


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
PRODUCTS_FILE = DATA_DIR / "products.json"

ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "linunaura123")
SECRET_KEY = os.environ.get("SECRET_KEY", "linunaura-local-secret")
TOKEN_TTL_SECONDS = 60 * 60 * 8

app = Flask(__name__)
CORS(app)

SEED_PRODUCTS = [
    {
        "id": "linen-dawn-queen",
        "name": "Linen Dawn Cotton Bedsheet",
        "category": "Bedsheet Set",
        "price": 1899,
        "mrp": 2499,
        "stock": 18,
        "color": "Sage Green",
        "size": "Queen",
        "material": "300 TC Cotton",
        "image": "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=80",
        "description": "Breathable cotton bedsheet with two pillow covers and a soft matte finish.",
        "badge": "Best seller",
        "rating": 4.8,
        "featured": True
    },
    {
        "id": "rose-garden-king",
        "name": "Rose Garden King Bedsheet",
        "category": "Printed Cotton",
        "price": 2199,
        "mrp": 2899,
        "stock": 11,
        "color": "Blush Rose",
        "size": "King",
        "material": "Percale Cotton",
        "image": "https://images.unsplash.com/photo-1615874694520-474822394e73?auto=format&fit=crop&w=900&q=80",
        "description": "Crisp percale weave with a modern floral print for elegant daily use.",
        "badge": "New",
        "rating": 4.7,
        "featured": False
    },
    {
        "id": "hotel-white-super-king",
        "name": "Hotel White Super King Set",
        "category": "Hotel Collection",
        "price": 2999,
        "mrp": 3799,
        "stock": 9,
        "color": "Classic White",
        "size": "Super King",
        "material": "Sateen Cotton",
        "image": "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80",
        "description": "Smooth sateen bedsheet set with a premium hotel feel and deep fitted corners.",
        "badge": "Premium",
        "rating": 4.9,
        "featured": False
    },
    {
        "id": "jaipur-indigo-double",
        "name": "Jaipur Indigo Double Bedsheet",
        "category": "Block Print",
        "price": 1599,
        "mrp": 2199,
        "stock": 24,
        "color": "Indigo",
        "size": "Double",
        "material": "Cotton Blend",
        "image": "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=900&q=80",
        "description": "Lightweight daily bedsheet inspired by Indian block print patterns.",
        "badge": "Value pick",
        "rating": 4.6,
        "featured": False
    },
    {
        "id": "resham-glow-queen",
        "name": "Resham Glow Queen Bedsheet",
        "category": "Silk Touch",
        "price": 2599,
        "mrp": 3299,
        "stock": 14,
        "color": "Champagne Gold",
        "size": "Queen",
        "material": "Resham Silk",
        "image": "https://images.unsplash.com/photo-1616627561839-074385245ff6?auto=format&fit=crop&w=900&q=80",
        "description": "Silk-touch resham bedsheet with a soft sheen for festive and premium rooms.",
        "badge": "Resham",
        "rating": 4.8,
        "featured": False
    }
]


def ensure_data_file():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if not PRODUCTS_FILE.exists():
        save_products(SEED_PRODUCTS)


def load_products():
    ensure_data_file()

    with PRODUCTS_FILE.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_products(products):
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    with PRODUCTS_FILE.open("w", encoding="utf-8") as file:
        json.dump(products, file, indent=2)


def make_token():
    expires = int(time.time()) + TOKEN_TTL_SECONDS

    payload = f"admin:{expires}"

    signature = hmac.new(
        SECRET_KEY.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    return f"{payload}:{signature}"


def verify_token(token):
    try:
        role, expires, signature = token.split(":")

        payload = f"{role}:{expires}"

        expected = hmac.new(
            SECRET_KEY.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        return (
            role == "admin"
            and int(expires) >= int(time.time())
            and hmac.compare_digest(signature, expected)
        )

    except (ValueError, TypeError):
        return False


def normalize_product(data, existing_id=None):
    required = [
        "name",
        "category",
        "price",
        "stock",
        "color",
        "size",
        "material",
        "image",
        "description"
    ]

    missing = [
        field for field in required
        if data.get(field) in (None, "")
    ]

    if missing:
        raise ValueError(
            f"Missing required field: {', '.join(missing)}"
        )

    price = int(float(data["price"]))
    mrp = int(float(data.get("mrp") or price))
    stock = int(float(data["stock"]))

    if price < 0 or mrp < 0 or stock < 0:
        raise ValueError(
            "Price, MRP, and stock must be positive numbers"
        )

    return {
        "id": existing_id or data.get("id") or str(uuid.uuid4()),
        "name": str(data["name"]).strip(),
        "category": str(data["category"]).strip(),
        "price": price,
        "mrp": mrp,
        "stock": stock,
        "color": str(data["color"]).strip(),
        "size": str(data["size"]).strip(),
        "material": str(data["material"]).strip(),
        "image": str(data["image"]).strip(),
        "description": str(data["description"]).strip(),
        "badge": str(data.get("badge", "")).strip(),
        "rating": float(data.get("rating") or 4.7),
        "featured": bool(data.get("featured", False))
    }


@app.after_request
def cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Admin-Token"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"

    return response


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "name": "Linunaura.in"
    })


@app.route("/api/products", methods=["GET"])
def get_products():
    return jsonify(load_products())


@app.route("/api/admin/login", methods=["POST"])
def admin_login():

    data = request.get_json()

    password = data.get("password")

    if password != "linunaura123":
        return jsonify({
            "error": "Invalid password"
        }), 401

    return jsonify({
        "token": "admin-token"
    })

@app.route("/api/products", methods=["POST"])
def add_product():
    token = request.headers.get("X-Admin-Token", "")

    if not verify_token(token):
        return jsonify({
            "error": "Admin login required"
        }), 401

    try:
        product = normalize_product(
            request.get_json() or {}
        )

        products = load_products()

        products.insert(0, product)

        save_products(products)

        return jsonify(product), 201

    except (ValueError, json.JSONDecodeError) as error:
        return jsonify({
            "error": str(error)
        }), 400


@app.route("/api/products/<product_id>", methods=["PUT"])
def update_product(product_id):
    token = request.headers.get("X-Admin-Token", "")

    if not verify_token(token):
        return jsonify({
            "error": "Admin login required"
        }), 401

    try:
        products = load_products()

        index = next(
            (
                position
                for position, item in enumerate(products)
                if item["id"] == product_id
            ),
            None
        )

        if index is None:
            return jsonify({
                "error": "Product not found"
            }), 404

        products[index] = normalize_product(
            request.get_json() or {},
            existing_id=product_id
        )

        save_products(products)

        return jsonify(products[index])

    except (ValueError, json.JSONDecodeError) as error:
        return jsonify({
            "error": str(error)
        }), 400


@app.route("/api/products/<product_id>", methods=["DELETE"])
def delete_product(product_id):
    token = request.headers.get("X-Admin-Token", "")

    if not verify_token(token):
        return jsonify({
            "error": "Admin login required"
        }), 401

    products = load_products()

    remaining = [
        item for item in products
        if item["id"] != product_id
    ]

    if len(remaining) == len(products):
        return jsonify({
            "error": "Product not found"
        }), 404

    save_products(remaining)

    return jsonify({
        "deleted": product_id
    })


def run():
    ensure_data_file()

    host = "0.0.0.0"
    port = int(os.environ.get("PORT", "8000"))

    print(f"Linunaura backend running at http://{host}:{port}")
    print(f"Admin password: {ADMIN_PASSWORD}")

    app.run(host=host, port=port)


if __name__ == "__main__":
    run()