# Farm Digital Twin Platform

A high-performance Farm Digital Twin GIS platform designed to digitally map, visualize, and manage assets for a large Moringa plantation farm. Built as part of Phase 1 to allow operators to map boundaries, trees, pipelines, valves, pumps, tanks, and other key farm infrastructure.

---

## 🛠️ Tech Stack & Directory Structure

- **Backend (`/backend`)**: Spring Boot 3 (Java 21), Maven, Spring Security (JWT), Hibernate Spatial.
- **Frontend (`/frontend`)**: Angular 20+, Angular Material, Leaflet, ApexCharts.
- **Mobile (`/mobile`)**: Flutter (Dart), Google Maps, Hive (offline DB), BLoC.
- **Database (`/docker`)**: PostgreSQL 17 + PostGIS.

---

## 🚀 Getting Started

### 1. Database Setup (Docker)

To run the local database with PostgreSQL and PostGIS:

```bash
# Navigate to the docker directory
cd docker

# Start the PostgreSQL + PostGIS container
docker-compose up -d
```

The database will be accessible at:
- **Host**: `localhost`
- **Port**: `5436`
- **Username**: `postgres`
- **Password**: `Employee@123`
- **Database**: `farm_twin`

### 2. Running the Application Components

Open separate terminal windows in your shell to run each component:

#### A. Backend (Spring Boot)
Navigate to the `/backend` folder, configure `JAVA_HOME`, and execute Maven:
```powershell
cd backend
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
.\apache-maven-3.9.6\bin\mvn.cmd clean spring-boot:run
```

#### B. Web Frontend (Angular)
Navigate to the `/frontend` folder and run the development compiler:
```bash
cd frontend
npm run start
```
*The Angular web dashboard will be available at `http://localhost:4200`.*

#### C. Mobile Client (Flutter)
Navigate to the `/mobile` folder and run the mobile map collector app:
```bash
cd mobile
flutter run -d chrome
```

---

## 📅 MVP Development Roadmap (Phase 1)
- **Week 1**: Project Setup, Database Schema, & JWT Authentication
- **Week 2**: Farm Management & Boundary Spatial Mapping
- **Week 3**: Tree Inventory Mapping & Photo Attachment Uploads
- **Week 4**: Pipeline Routing & Valve Mapping
- **Week 5**: Pump & Tank Mapping
- **Week 6**: Visual GIS Dashboard & Map Overlays
- **Week 7**: Reports Generation & Excel/PDF Export
- **Week 8**: Testing & Validation