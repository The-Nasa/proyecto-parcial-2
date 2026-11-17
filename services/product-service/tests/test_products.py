import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.models import Product
from app.main import app

# SQLite en memoria con StaticPool para que todas las conexiones compartan la misma BD
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def client():
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client

    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


def test_health_live(client):
    response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "alive", "service": "product-service"}


def test_health_ready(client):
    response = client.get("/health/ready")
    assert response.status_code == 200
    assert "ready" in response.json()["status"]


def test_create_and_list_product(client):
    payload = {
        "name": "Teclado Mecánico RGB",
        "description": "Switches Red silenciosos",
        "price": 89.99,
        "category": "Periféricos",
        "stock": 25
    }
    response = client.post("/api/products", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["id"] is not None
    assert data["name"] == "Teclado Mecánico RGB"
    assert data["price"] == 89.99

    # Listar productos
    list_res = client.get("/api/products")
    assert list_res.status_code == 200
    products = list_res.json()
    assert len(products) == 1
    assert products[0]["id"] == data["id"]


def test_get_product_by_id(client):
    payload = {
        "name": "Mouse Gamer 16000 DPI",
        "description": "Sensor óptico de alta precisión",
        "price": 49.50,
        "category": "Periféricos",
        "stock": 10
    }
    post_res = client.post("/api/products", json=payload)
    prod_id = post_res.json()["id"]

    get_res = client.get(f"/api/products/{prod_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Mouse Gamer 16000 DPI"

    # Producto inexistente
    not_found_res = client.get("/api/products/99999")
    assert not_found_res.status_code == 404


def test_invalid_price_rejected(client):
    payload = {
        "name": "Producto Inválido",
        "price": -10.0,
        "category": "Test",
        "stock": 5
    }
    response = client.post("/api/products", json=payload)
    assert response.status_code == 422
