# Intelligent Queue & Token Management System

A real-time, multi-counter queue and token management system built with **Node.js, Express, PostgreSQL, Redis, and Socket.IO**, designed for banks, hospitals, and service centers.

---

## 🚀 Features

### 🎫 Token Management
- Same-day token generation  
- Auto-increment token numbers: `B-YYYYMMDD-0001`  
- Database-safe daily sequence generator  
- Metadata + customer info support  
- Reserved slots (optional)  

### 🏢 Multi-Counter Queue Handling
- Redis-backed FIFO queue per counter  
- Fast enqueue / call / serve operations  
- Live updates using Socket.IO  
- Multi-service & multi-counter support  

### 🖥 Real-Time UI Compatibility
- Kiosk display  
- Operator console  
- Admin dashboard (future)  
- Real-time broadcasting to rooms  

### 🗄 Database Architecture
- PostgreSQL for persistence  
- Redis for in-memory queue operations  
- Full audit log for token state changes  
- Materialized views for analytics  

### 🐳 Docker Support
- API Server  
- PostgreSQL  
- Redis  
- Auto SQL migrations  

---

## 📂 Project Structure

