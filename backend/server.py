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

    except Exception:
        return False


def normalize_product(data, existing_id=None):

    return {
        "id": existing_id or str(uuid.uuid4()),
        "name": str(data.get("name", "")).strip(),
        "category": str(data.get("category", "")).strip(),
        "price": int(float(data.get("price", 0))),
        "mrp": int(float(data.get("mrp", data.get("price", 0)))),
        "stock": int(float(data.get("stock", 0))),
        "color": str(data.get("color", "")).strip(),
        "size": str(data.get("size", "")).strip(),
        "material": str(data.get("material", "")).strip(),
        "image": str(data.get("image", "")).strip(),
        "description": str(data.get("description", "")).strip(),
        "badge": str(data.get("badge", "")).strip(),
        "rating": float(data.get("rating", 4.7)),
        "featured": bool(data.get("featured", False))
    }


@app.after_request
def cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Admin-Token"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok"
    })


@app.route("/api/products", methods=["GET"])
def get_products():
    return jsonify(load_products())


@app.route("/api/admin/login", methods=["POST", "OPTIONS"])
def admin_login():

    if request.method == "OPTIONS":
        return jsonify({"ok": True})

    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No data received"
            }), 400

        password = data.get("password", "")

        if password != ADMIN_PASSWORD:
            return jsonify({
                "error": "Invalid password"
            }), 401

        token = make_token()

        return jsonify({
            "token": token
        }), 200

    except Exception as error:
        return jsonify({
            "error": str(error)
        }), 500


@app.route("/api/products", methods=["POST"])
def add_product():

    token = request.headers.get("X-Admin-Token", "")

    if not verify_token(token):
        return jsonify({
            "error": "Admin login required"
        }), 401

    try:
        products = load_products()

        product = normalize_product(
            request.get_json() or {}
        )

        products.insert(0, product)

        save_products(products)

        return jsonify(product), 201

    except Exception as error:
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
                i for i, item in enumerate(products)
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

    except Exception as error:
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

    save_products(remaining)

    return jsonify({
        "deleted": product_id
    })


def run():
    ensure_data_file()

    host = "0.0.0.0"
    port = int(os.environ.get("PORT", "8000"))

    app.run(host=host, port=port)


if __name__ == "__main__":
    run()