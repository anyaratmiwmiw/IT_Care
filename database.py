from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# กำหนดชื่อไฟล์ฐานข้อมูล SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./it_preventive.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# ฟังก์ชั่นสำหรับเรียกใช้ Session ของ Database
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()