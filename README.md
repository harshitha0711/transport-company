# TRANSPORT COMPANY COMPUTERIZATION (TCC)
### Enterprise Full-Stack Logistics, Consignment Billing & Fleet Management System
*(College Software Engineering Capstone Project)*

[![Node.js](https://img.shields.io/badge/Node.js-v18%20--%20v22-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-lightgrey.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-purple.svg)](https://vitejs.dev/)

---

## ⚡ QUICKSTART: HOW TO RUN ON ANY LAPTOP OR PC

Follow these simple steps to run and test the complete project when cloned on any laptop or PC (Windows, macOS, or Linux).

### Prerequisites Check
Before running, ensure your laptop/PC has:
1. **Node.js**: Installed (version 18, 20, or 22). Check with:
   ```bash
   node -v
   npm -v
   ```
2. **MongoDB**: Installed and running locally on port 27017 (or use MongoDB Atlas connection string).
   * **Windows**: Press `Win + R`, type `services.msc`, and ensure **MongoDB Server** is "Running". Or run in PowerShell:
     ```powershell
     Get-Service -Name *mongo*
     ```
   * **macOS**: `brew services start mongodb-community`
   * **Linux**: `sudo systemctl start mongod`

---

### OPTION 1: One-Click Automatic Start (Fastest)

#### On Windows:
Double-click `start-dev.bat` in File Explorer, or run in your terminal:
* **PowerShell**:
  ```powershell
  .\start-dev.bat
  # or: .\start-dev.ps1
  ```
* **Command Prompt (CMD)**:
  ```cmd
  start-dev.bat
  ```
*(This automatically installs dependencies if missing, copies `.env`, seeds the database, and launches both backend and frontend servers in separate windows!)*

#### On macOS / Linux:
```bash
chmod +x start-dev.sh
./start-dev.sh
```

---

### OPTION 2: Step-by-Step Manual Setup (Terminal by Terminal)

If you prefer opening two terminal tabs:

#### 1. Clone the Repository
```bash
git clone https://github.com/harshitha0711/transport-company.git
cd transport-company
```

#### 2. Start the Backend Server (Terminal 1)
```bash
cd server

# 1. Install backend dependencies
npm install

# 2. Setup environment variables (if .env doesn't exist)
cp .env.example .env

# 3. Seed MongoDB with realistic branches, rates, trucks, users & cargo
npm run seed

# 4. Start the backend development server
npm run dev
```
> **Backend Status**: Running on **`http://localhost:5000`** (Health check: `http://localhost:5000/api/health`)

#### 3. Start the Frontend Client (Terminal 2)
Open a new terminal tab/window in the project root:
```bash
cd client

# 1. Install frontend dependencies
npm install

# 2. Start the Vite React client
npm run dev
```
> **Frontend Status**: Open your browser at **`http://localhost:3000`**

---

### OPTION 3: Run from Project Root
From the top-level `transport-company/` directory:
```bash
# Seed database
npm run seed

# Run backend
npm run dev:server

# Run frontend (in another tab)
npm run dev:client
```

---

## 🧪 How to Run Automated Verification Test Suite

To verify all 10 core system requirements, APIs, and business rules in **5 seconds** without manual clicking:
```bash
# From the project root:
npm run test:e2e

# Or from inside the server folder:
node server/test-e2e.js
```

**What this automated test validates:**
1. Backend health check online.
2. Manager & Staff JWT login authentication.
3. Fetching destination tariff rates strictly from MongoDB.
4. Active cargo queues and tracking pending volume.
5. Booking an 80 m³ consignment pushing pending queue past $\ge 500\text{ m}^3$.
6. **Automatic Truck Allocation engine triggering live**.
7. Creating dispatch manifests and packing shipments up to truck capacity.
8. Recording truck departure, idle time calculation, and transit state.
9. Delivering cargo, marking consignments delivered, and relocating truck to destination hub as available.
10. Calculating real-time dashboard KPIs and manager revenue reports.

---

## 🔑 Demo Login Credentials

The login screen features **Single-Click Demo Buttons** so examiners and evaluators can log in with one tap:

| Role | Email Address | Password | Permissions & Access |
|---|---|---|---|
| **Manager** | `manager@tcc.com` | `Manager@123` | **Full Access**: Command Center Dashboard, 500 m³ Allocation Engine, Reports, Fleet, Consignments, Dispatches, Tariffs, Users |
| **Staff (Clerk)**| `staff@tcc.com` | `Staff@123` | **Operations**: Book Consignments, View DB Tariffs, Print Bills, View Fleet & Dispatches |
| **Administrator**| `admin@tcc.com` | `Admin@123` | **System Control**: Fleet, Hubs, Tariffs, User Roles, and Data Management |

---

## 📋 System Requirements & Architecture

The application is structured cleanly into modular layers:

```
[ Client: React 19 + Vite + Tailwind CSS v4 ]
            │  ▲
   HTTP/REST│  │ JSON
 (Axios+JWT)▼  │
[ Server: Node.js + Express.js ]
  ├── JWT Auth Middleware & Role Guard (Manager / Staff)
  ├── Allocation Service (500 m³ Rule, FIFO Packing, Earliest Available Truck)
  ├── Analytics Service (Corridor Revenue, Volume, Wait Time, Idle Time)
  └── Mongoose Models
            │  ▲
    Mongoose│  │ BSON
            ▼  │
[ Database: MongoDB Engine (transport_company_db) ]
  ├── users (Manager, Staff, Admin accounts with hashed passwords)
  ├── branches (Mumbai Head Office, Delhi, Bengaluru, Chennai, Kolkata)
  ├── trucks (Capacities: 500, 650, 750, 1000 m³; Statuses: AVAILABLE, LOADING, ON_TRIP, IDLE, MAINTENANCE)
  ├── rates (Destination-wise freight tariffs stored strictly in DB)
  ├── consignments (Cargo volume, charge = vol × rate, bills, status lifecycle)
  ├── dispatches (Road manifests, allocated trucks, consignment batches)
  └── trips (Highway departures, arrivals, transit hours, idle duration)
```

---

## 🚚 Automatic Truck Allocation Engine Explained (Viva Core)

### The 500 m³ Threshold Business Rule:
1. Consignments are received at branch offices with status `WAITING_FOR_TRUCK`.
2. For each destination branch, the system groups all pending consignments and computes:
   $$\text{Total Pending Volume} = \sum \text{volume of pending consignments}$$
3. When $\text{Total Pending Volume} \ge 500\text{ m}^3$:
   * **Step 1: Identify Candidate Trucks**: Queries MongoDB for trucks with `status: 'AVAILABLE'` or `'IDLE'`. Checks the source branch first.
   * **Step 2: Prefer Earliest Available Truck**: Candidate trucks are sorted by `lastAvailableAt ASC`. The vehicle waiting longest is picked to minimize idle costs.
   * **Step 3: Database Capacity Check**: The system queries the selected truck's capacity (`truck.capacity`) from MongoDB (trucks have 500 m³, 650 m³, 750 m³, etc.).
   * **Step 4: Pack Eligible Cargo (FIFO)**: Consignments are packed in FIFO order (`receivedAt ASC`) up to `truck.capacity`. Selected cargo volume will not exceed truck capacity.
   * **Step 5: Generate Dispatch Manifest**: Creates a unique dispatch order `TCC-DSP-YYYYMMDD-XXXX`.
   * **Step 6: Atomic State Updates**:
     * Selected consignments updated to `ALLOCATED` with `allocatedAt = now`, `assignedTruck = truck._id`, `dispatchId = dispatch._id`.
     * Truck status updated to `LOADING`, with `destination = destinationBranch._id`, and `lastAllocatedAt = now`.
   * **Step 7: If No Truck is Available**: Cargo remains in `WAITING_FOR_TRUCK` with a dashboard alert until a truck arrives at the hub.

---

## ⏱️ Waiting Time & Idle Time Formulas

### 1. Consignment Waiting Time
For any consignment:
$$\text{Individual Waiting Time} = \text{Allocation/Dispatch Timestamp} - \text{Received Timestamp}$$

* Printed on every consignment invoice bill in hours and minutes.
* **Average Waiting Time**: Aggregated dynamically across all allocated/dispatched consignments:
  $$\text{Average Waiting Time} = \frac{\sum_{i=1}^N (\text{allocatedAt}_i - \text{receivedAt}_i)}{N}$$

### 2. Truck Idle Time
Measures unproductive dock standby before a trip departs:
$$\text{Idle Time} = \text{Departure Timestamp} - \text{Previous Available Timestamp}$$

* When a truck finishes a delivery, its status becomes `AVAILABLE` and `lastAvailableAt = new Date()`.
* When the truck is allocated to a new dispatch and departs, the idle duration is computed:
  $$\text{Idle Duration (minutes)} = \frac{\text{departureTime} - \text{lastAvailableAt}}{1000 \times 60}$$
* Stored in the `Trip` collection (`idleTimeBeforeTripMinutes`).
* Average idle duration is reported in the **Fleet Usage Report**.

---

## 📂 Project Structure

```
transport-company/
├── client/                       # React 19 + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── api/axios.js          # Axios client with JWT interceptor
│   │   ├── components/           # ConsignmentBillModal, DispatchDocumentModal, MetricCard, Navbar, Sidebar, StatusBadge
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/                # Dashboard, Consignments, Trucks, Dispatch, Branches, Rates, Reports, Users, Login
│   │   ├── App.jsx               # Routes and ProtectedRoute guards
│   │   └── index.css             # Tailwind v4 styles & print stylesheets
│   ├── package.json
│   └── vite.config.js            # Port 3000 & API reverse proxy to port 5000
│
├── server/                       # Node.js + Express.js + Mongoose backend
│   ├── src/
│   │   ├── config/db.js          # MongoDB connection
│   │   ├── controllers/          # Business logic handlers
│   │   ├── middleware/           # auth.js (JWT & RBAC), errorHandler.js
│   │   ├── models/               # User, Branch, Truck, Rate, Consignment, Dispatch, Trip
│   │   ├── routes/               # Express REST route definitions
│   │   ├── seed/seedData.js      # Database seed script with demo data
│   │   ├── services/             # allocationService.js (500m³ engine), analyticsService.js
│   │   └── server.js             # Server entry point
│   ├── .env.example              # Template configuration
│   ├── package.json
│   └── test-e2e.js               # Automated integration test suite
│
├── package.json                  # Root npm scripts
├── requirements.txt              # System & package specifications
├── start-dev.bat                 # One-click Windows launcher
├── start-dev.sh                  # One-click macOS / Linux launcher
└── README.md                     # Full documentation
```

---

## 🎓 Viva / Evaluation Questions & Answers

**Q1: How are transport rates calculated in the system?**
> **Answer**: Rates are never hard-coded in the frontend. Destination tariff rates are stored in MongoDB in the `Rate` collection. When a booking clerk enters a consignment with a volume (m³) and destination, the backend fetches the destination-specific rate per m³ from the database and computes: $\text{Charge} = \text{Volume} \times \text{Rate}$.

**Q2: How does the Automatic Truck Allocation work?**
> **Answer**: Pending consignments (`WAITING_FOR_TRUCK`) are aggregated by destination. When pending volume reaches or exceeds 500 m³, the backend queries available trucks, picks the earliest available vehicle (sorted by `lastAvailableAt`), packs consignments in FIFO order up to the truck's actual capacity from the database, generates a dispatch record, sets truck status to `LOADING`, and sets consignment statuses to `ALLOCATED`.

**Q3: How is truck idle time tracked?**
> **Answer**: Each truck maintains a `lastAvailableAt` timestamp. When a truck completes a delivery or becomes available, this timestamp is updated. When the truck is allocated to a dispatch and departs, the idle duration is computed as $\text{departureTime} - \text{lastAvailableAt}$ and stored in the `Trip` record.

**Q4: What happens to a truck after it delivers cargo?**
> **Answer**: When marked delivered, the dispatch status becomes `COMPLETED`, consignments become `DELIVERED`, and the truck's current branch is updated to the destination branch with status `AVAILABLE`. This makes the truck immediately available to pick up return freight at the destination hub.

---

### Developed for College Software Engineering Capstone
*Transport Company Computerization (TCC) • Production-Grade MERN Architecture*
