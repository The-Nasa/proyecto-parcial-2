from typing import List
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import engine, Base, get_db
from app.models import Product
from app.schemas import ProductCreate, ProductResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicialización de tablas en la base de datos PostgreSQL
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Advertencia inicializando tablas: {e}")
    yield


app = FastAPI(
    title="Product Catalog Microservice (Python)",
    version="1.0.0",
    description="Microservicio 1 para Parcial 2: Catálogo de productos con PostgreSQL.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Sondas de Salud (Kubernetes Probes) ---
@app.get("/health/live", tags=["Health"])
def health_live():
    return {"status": "alive", "service": "product-service"}


@app.get("/health/ready", tags=["Health"])
def health_ready(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ready", "database": "PostgreSQL connected"}
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Base de datos no disponible: {str(exc)}"
        )


# --- Endpoints de Negocio ---
@app.get("/api/products", response_model=List[ProductResponse], tags=["Products"])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id.desc()).all()


@app.get("/api/products/{product_id}", response_model=ProductResponse, tags=["Products"])
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
        )
    return product


@app.post("/api/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, tags=["Products"])
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    new_product = Product(
        name=product_in.name,
        description=product_in.description,
        price=product_in.price,
        category=product_in.category,
        stock=product_in.stock,
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


@app.delete("/api/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Products"])
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con ID {product_id} no encontrado"
        )
    db.delete(product)
    db.commit()
    return None
