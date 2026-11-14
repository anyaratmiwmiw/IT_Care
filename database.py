import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ดึงค่า DATABASE_URL จาก Environment Variable (สำหรับ PostgreSQL บน Render/Neon)
# หากไม่มี (เช่น รันทดสอบในเครื่อง Localhost) จะ fallback ใช้ SQLite (./it_preventive.db)
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    default_db = "/data/itcare.db" if os.path.exists("/data") else "./it_preventive.db"
    DB_PATH = os.getenv("SQLITE_PATH", default_db)
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# แปลง prefix postgres:// เป็น postgresql:// กรณีแพลตฟอร์มส่งรูปแบบเก่ามา
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

# ตั้งค่า engine แยกตามประเภทฐานข้อมูล (SQLite ต้องใช้ check_same_thread แต่ PostgreSQL ไม่ต้องใช้)
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# ฟังก์ชั่นสำหรับเรียกใช้ Session ของ Database
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()