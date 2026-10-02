from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from database import Base
import datetime

# ตารางเก็บข้อมูลอุปกรณ์
class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_tag = Column(String, unique=True, index=True)
    name = Column(String)
    
    # เงื่อนไข Threshold สำหรับ Policy-based Alerting
    cpu_threshold = Column(Float, default=80.0)
    ram_threshold = Column(Float, default=85.0)
    disk_threshold = Column(Float, default=90.0)

    # ข้อมูลคำนวณ PM ล่วงหน้า
    last_pm_date = Column(DateTime, nullable=True)
    pm_interval_days = Column(Integer, default=90)
    next_pm_date = Column(DateTime, nullable=True)
    
    # ข้อมูลสถานะและการติดต่อล่าสุด (Online/Offline Check)
    last_seen = Column(DateTime, nullable=True)
    status = Column(String, default="Normal") # Normal, Warning, Critical, Offline

# ตารางเก็บ Log ประวัติการทำงาน Real-time
class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"

    id = Column(Integer, primary_key=True, index=True)
    asset_tag = Column(String, index=True)
    cpu_usage = Column(Float)
    ram_usage = Column(Float)
    disk_usage = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# ตารางเก็บบันทึกประวัติการบำรุงรักษา (PM History & Maintenance Logs)
class PMHistory(Base):
    __tablename__ = "pm_history"

    id = Column(Integer, primary_key=True, index=True)
    asset_tag = Column(String, index=True)
    technician_name = Column(String)
    action_taken = Column(String)
    details = Column(Text, nullable=True)
    status = Column(String, default="Completed") # Completed, Pending
    performed_at = Column(DateTime, default=datetime.datetime.utcnow)

# ตารางเก็บข้อมูลผู้ใช้งานระบบ (User Management)
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True) # 👈 เพิ่มฟิลด์ใช้อีเมลเป็นหลัก
    #username = Column(String, unique=True, index=True)
    password_hash = Column(String)  # รหัสผ่านที่ผ่านการเข้ารหัส
    full_name = Column(String) # ชื่อ-นามสกุล ผู้ดูแล
    role = Column(String, default="IT Support") # IT Administrator, IT Support
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

# ตารางเก็บบันทึกการแจ้งเตือน (Alert Logs)
class AlertLog(Base):
    __tablename__ = "alert_logs"

    id = Column(Integer, primary_key=True, index=True)
    asset_tag = Column(String, index=True)
    alert_type = Column(String)
    message = Column(String)
    sent_at = Column(DateTime, default=datetime.datetime.utcnow)
