# TRANSPORT COMPANY COMPUTERIZATION (TCC)
### Full-Stack Logistics & Fleet Management System (Software Engineering Project)

[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-lightgrey.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-brightgreen.svg)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-Bundler-purple.svg)](https://vitejs.dev/)

---

## 1. Project Overview

**Transport Company Computerization (TCC)** is a production-style, end-to-end full-stack web application developed for commercial transport companies. The application computerizes the lifecycle of cargo logistics:
* Receiving consignments at city branch offices.
* Calculating transport charges dynamically using database-driven destination freight tariffs (`Volume × Destination Rate`).
* Generating and printing professional **Consignment Freight Bills (Invoices)**.
* Maintaining complete fleet telematics (Truck status: `AVAILABLE`, `LOADING`, `ON_TRIP`, `IDLE`, `MAINTENANCE`, capacities, drivers, and locations).
* **Automatic Truck Allocation Engine**: Real-time evaluation of pending cargo by destination. When pending cargo volume reaches or exceeds **500 m³**, the engine automatically selects the earliest available truck, packages shipments up to truck capacity, creates a dispatch manifest, and sets truck status to `LOADING`.
* Highway dispatch and trip lifecycle management with printable **Official Dispatch Documents & Highway Cargo Manifests**.
* Comprehensive **Executive Dashboard & Analytics**: Corridor revenues, volume by destination, truck usage, average consignment waiting time, and truck idle time.

---

## 2. Key Features

* **Authentication & Role-Based Access Control (RBAC)**:
  * Secure JWT authentication with `bcryptjs` password hashing.
  * **Manager / Admin Role**: Complete access to fleet analytics, automated truck allocation, rates, branches, trucks, dispatches, and user administration.
  * **Staff Role**: Consignment booking, rate inspection, bill generation, and dispatch tracking.
* **Database-Driven Destination Freight Tariffs**:
  * Rates are stored strictly in MongoDB (never hardcoded in frontend).
  * Auto-calculated transport charges with instant live previews during consignment booking.
* **Consignment Note & Invoice Generator**:
  * Generates unique consignment numbers (`TCC-CN-YYYYMMDD-XXXX`).
  * Instant print-ready modal invoice featuring sender/receiver info, item breakdown, rates, and waiting times.
* **Intelligent 500 m³ Truck Allocation Engine**:
  * Monitors pending queues by destination hub.
  * Checks physical presence of available trucks at the origin branch first; falls back to fleet standby trucks.
  * Prioritizes the earliest available truck (longest idle duration) to maximize fleet utilization.
  * Respects truck volume capacity (`truck.capacity >= volume to load`).
  * Updates statuses across consignments and trucks atomically in the database.
* **Trip & Highway Dispatch Lifecycle**:
  * **PREPARED**: Truck allocated and loading cargo at dock.
  * **IN_TRANSIT (Departed)**: Truck moves to `ON_TRIP`, departure timestamp recorded, idle duration logged.
  * **COMPLETED (Delivered)**: Truck arrives at destination branch, marked `AVAILABLE` at the new branch hub for return loads, consignment marked `DELIVERED`, and trip duration computed in hours.
* **Real-time Metrics & Manager Reports**:
  * Revenue by destination corridor (Bar Charts).
  * Volume handled by destination (m³).
  * Consignment status distribution & Fleet state (Pie Charts).
  * Truck usage: total trips, total transit hours, and idle duration.
  * Consignment waiting time (`allocatedAt - receivedAt`) and average waiting time.
  * Truck idle time (`allocatedAt - lastAvailableAt`) and average idle time.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 (Vite) |
| **Styling** | Tailwind CSS v4 & PostCSS |
| **Routing** | React Router DOM v7 |
| **HTTP Client** | Axios (configured with JWT bearer interceptors) |
| **Charts & Analytics**| Recharts |
| **Icons & Assets** | Lucide React |
| **Backend Runtime** | Node.js (v20+ / v22+) |
| **Backend Framework**| Express.js |
| **Database & ODM** | MongoDB with Mongoose |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) & `bcryptjs` |
| **Environment** | `dotenv`, `cors`, `morgan` |

---

## 4. Architecture & System Flow

```
[ Client: React + Vite + Tailwind ]
            │  ▲
   HTTP/REST│  │ JSON
 (Axios+JWT)▼  │
[ Server: Express.js REST API ]
  ├── Auth Middleware (JWT & Roles: Manager / Staff)
  ├── Controllers & Clean Routes
  ├── Allocation Service (500 m³ Rule, FIFO Packing, Earliest Available Truck)
  ├── Analytics Service (Revenue, Volume, Wait Time, Idle Time Aggregations)
  └── Mongoose Models
            │  ▲
    Mongoose│  │ BSON
            ▼  │
[ Database: MongoDB (Collections: Users, Branches, Trucks, Rates, Consignments, Dispatches, Trips) ]
```

---

## 5. Folder Structure

```
transport-company/
├── client/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js                  # Axios instance with Bearer token interceptor
│   │   ├── components/
│   │   │   ├── ConsignmentBillModal.jsx  # Printable consignment invoice modal
│   │   │   ├── DispatchDocumentModal.jsx # Official highway dispatch manifest modal
│   │   │   ├── LoadingSpinner.jsx        # Animated loading state
│   │   │   ├── MetricCard.jsx            # KPI summary card with colored accents
│   │   │   ├── Navbar.jsx                # Header with live DB indicator & auto-allocation button
│   │   │   ├── Sidebar.jsx               # Navigation bar with role-based links
│   │   │   └── StatusBadge.jsx           # Color-coded badge for trucks and consignments
│   │   ├── context/
│   │   │   └── AuthContext.jsx           # Global user authentication & role management
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx            # Responsive layout wrapper
│   │   ├── pages/
│   │   │   ├── BranchesPage.jsx          # Hubs and branch terminals management
│   │   │   ├── ConsignmentsPage.jsx      # Cargo booking, live tariff preview, and bill printing
│   │   │   ├── DashboardPage.jsx         # Executive command center with 500m³ monitor & charts
│   │   │   ├── DispatchPage.jsx          # Dispatch orders, manifests, and departure/delivery actions
│   │   │   ├── LoginPage.jsx             # Login with single-click demo credential fillers
│   │   │   ├── RatesPage.jsx             # Destination freight tariff rates stored in DB
│   │   │   ├── ReportsPage.jsx           # Revenue, volume, truck usage, and wait time analytics
│   │   │   └── UsersPage.jsx             # User account administration (Manager/Admin only)
│   │   ├── App.jsx                       # Routes definition & ProtectedRoute guards
│   │   ├── index.css                     # Tailwind v4 base styles and print utilities
│   │   └── main.jsx                      # React root entry point
│   ├── index.html                        # Application HTML root
│   ├── package.json
│   └── vite.config.js                    # Vite configuration with proxy to port 5000
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                     # Mongoose MongoDB connection
│   │   ├── controllers/
│   │   │   ├── allocationController.js   # Endpoints for pending status and allocation engine
│   │   │   ├── authController.js         # Login, session verification (/api/auth/me)
│   │   │   ├── branchController.js       # Branch hubs CRUD
│   │   │   ├── consignmentController.js  # Consignment creation, rate lookup, bill retrieval
│   │   │   ├── dispatchController.js     # Dispatch creation, departures, and deliveries
│   │   │   ├── rateController.js         # Freight tariff rates CRUD
│   │   │   ├── reportController.js       # Manager dashboard KPIs, revenue, volume, usage
│   │   │   ├── truckController.js        # Fleet vehicles, telematics, and status transitions
│   │   │   └── userController.js         # User account administration
│   │   ├── middleware/
│   │   │   ├── auth.js                   # JWT protect and authorize('ADMIN', 'MANAGER')
│   │   │   └── errorHandler.js           # Centralized JSON error formatting
│   │   ├── models/
│   │   │   ├── Branch.js                 # Branch hubs and terminals schema
│   │   │   ├── Consignment.js            # Consignment shipments schema
│   │   │   ├── Dispatch.js               # Road transport dispatch manifests schema
│   │   │   ├── Rate.js                   # Destination tariffs schema
│   │   │   ├── Trip.js                   # Highway trips and truck usage metrics schema
│   │   │   ├── Truck.js                  # Fleet trucks schema
│   │   │   └── User.js                   # Authenticated user accounts schema
│   │   ├── routes/
│   │   │   ├── allocationRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── branchRoutes.js
│   │   │   ├── consignmentRoutes.js
│   │   │   ├── dispatchRoutes.js
│   │   │   ├── rateRoutes.js
│   │   │   ├── reportRoutes.js
│   │   │   ├── truckRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── seed/
│   │   │   └── seedData.js               # Realistic seed script for immediate demonstration
│   │   ├── services/
│   │   │   ├── allocationService.js      # 500 m³ truck allocation business logic
│   │   │   └── analyticsService.js       # KPIs, waiting time, and idle time computations
│   │   └── server.js                     # Express app initialization & route registration
│   ├── .env                              # Environment configuration (PORT, MONGODB_URI, JWT_SECRET)
│   ├── .env.example                      # Template configuration
│   ├── package.json
│   └── test-e2e.js                       # Comprehensive automated integration test suite
│
├── package.json                          # Root package.json with unified dev/seed scripts
├── README.md                             # Comprehensive technical documentation
└── .gitignore
```

---

## 6. Database Models

### 1. `User`
* `name`: String (required)
* `email`: String (required, unique, lowercase)
* `passwordHash`: String (bcrypt hashed, `select: false`)
* `role`: Enum `['ADMIN', 'MANAGER', 'STAFF']` (default: `'STAFF'`)
* `branch`: ObjectId ref `Branch`
* `phone`: String
* `isActive`: Boolean (default: `true`)

### 2. `Branch`
* `name`: String (e.g. `"Mumbai Central Logistics Hub (Head Office)"`)
* `city`: String (e.g. `"Mumbai"`, `"Delhi"`, `"Bengaluru"`, `"Chennai"`, `"Kolkata"`)
* `code`: String (unique, uppercase e.g. `"BOM-01"`, `"DEL-01"`)
* `address`: String (required)
* `type`: Enum `['HEAD_OFFICE', 'BRANCH_OFFICE']`
* `phone`: String, `contactPerson`: String

### 3. `Truck`
* `truckNumber`: String (unique, uppercase e.g. `"MH-04-AB-1001"`)
* `capacity`: Number (in cubic meters m³, e.g. `500`, `650`, `750`, `1000`)
* `currentBranch`: ObjectId ref `Branch` (physical location of the truck)
* `status`: Enum `['AVAILABLE', 'LOADING', 'ON_TRIP', 'IDLE', 'MAINTENANCE']`
* `destination`: ObjectId ref `Branch` (assigned destination when loading or on trip)
* `driverName`: String, `driverPhone`: String
* `lastAvailableAt`: Date (timestamp when truck became available/idle)
* `lastAllocatedAt`: Date (timestamp when truck was allocated to a cargo batch)
* `lastTripCompletedAt`: Date (timestamp when last trip finished)

### 4. `Rate` (Stored strictly in Database)
* `destination`: ObjectId ref `Branch` (unique destination)
* `ratePerCubicMeter`: Number (> 0, e.g. ₹48/m³ for Delhi, ₹65/m³ for Kolkata)
* `estimatedTransitHours`: Number (default: 24)
* `description`: String

### 5. `Consignment`
* `consignmentNumber`: String (unique, e.g. `"TCC-CN-20260928-1564"`)
* `sender`: `{ name, phone, address, gstNumber }`
* `receiver`: `{ name, phone, address, gstNumber }`
* `sourceBranch`: ObjectId ref `Branch`
* `destinationBranch`: ObjectId ref `Branch`
* `volume`: Number (> 0, m³)
* `ratePerCubicMeter`: Number (copied from `Rate` model at time of booking)
* `charge`: Number (`volume × ratePerCubicMeter`)
* `status`: Enum `['RECEIVED', 'WAITING_FOR_TRUCK', 'ALLOCATED', 'DISPATCHED', 'DELIVERED']`
* `receivedAt`: Date (booking timestamp)
* `allocatedAt`: Date (when paired with a truck)
* `dispatchedAt`: Date (when truck departed)
* `deliveredAt`: Date (when truck reached destination)
* `assignedTruck`: ObjectId ref `Truck`
* `dispatchId`: ObjectId ref `Dispatch`
* `paymentStatus`: Enum `['PAID', 'TO_PAY', 'CREDIT']`
* Virtual `waitingTimeHours`: `(allocatedAt || dispatchedAt || now) - receivedAt`

### 6. `Dispatch`
* `dispatchNumber`: String (unique, e.g. `"TCC-DSP-20260928-8513"`)
* `truck`: ObjectId ref `Truck`
* `sourceBranch`: ObjectId ref `Branch`
* `destinationBranch`: ObjectId ref `Branch`
* `consignments`: Array of ObjectId ref `Consignment`
* `totalVolume`: Number (sum of loaded consignments volume)
* `dispatchTime`: Date
* `status`: Enum `['PREPARED', 'IN_TRANSIT', 'COMPLETED']`
* `driverName`: String, `driverPhone`: String
* `dispatchedBy`: ObjectId ref `User`

### 7. `Trip` (TruckUsage)
* `truck`: ObjectId ref `Truck`
* `source`: ObjectId ref `Branch`
* `destination`: ObjectId ref `Branch`
* `dispatch`: ObjectId ref `Dispatch`
* `departureTime`: Date
* `arrivalTime`: Date
* `durationHours`: Number (computed upon arrival)
* `idleTimeBeforeTripMinutes`: Number (time spent available/idle before this trip)
* `status`: Enum `['IN_PROGRESS', 'COMPLETED']`
* `totalCargoVolume`: Number

---

## 7. Setup & Installation Instructions

### Prerequisites
1. **Node.js** (v18, v20, or v22)
2. **MongoDB** (Local MongoDB Server running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)

### Quick Start (Step-by-Step)

#### Step 1: Clone Repository
```bash
git clone https://github.com/harshitha0711/transport-company.git
cd transport-company
```

#### Step 2: Install Backend Dependencies & Configure Environment
```bash
cd server
npm install
```
Verify `server/.env` exists (or copy from `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/transport_company_db
JWT_SECRET=tcc_super_secret_jwt_key_college_project_2026
JWT_EXPIRE=7d
NODE_ENV=development
```

#### Step 3: Seed the Database with Realistic Demo Data
```bash
npm run seed
```
*This populates 5 branches, 5 freight tariffs, 7 trucks, historical trips, delivered consignments, and active pending queues.*

#### Step 4: Start Backend Server
```bash
npm run dev
# Backend starts on http://localhost:5000
```

#### Step 5: Install Frontend Dependencies & Start Client
Open a new terminal window:
```bash
cd client
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

Now open **`http://localhost:3000`** in your browser!

---

## 8. Demo Login Credentials

The application provides single-click demo login buttons on the login screen, or you can enter them manually:

| Role | Email Address | Password | Permissions & Access |
|---|---|---|---|
| **Manager** | `manager@tcc.com` | `Manager@123` | **Full Access**: Dashboard, Allocation Engine, Reports, Fleet, Consignments, Dispatches, Tariffs, Users |
| **Staff (Booking Clerk)** | `staff@tcc.com` | `Staff@123` | **Operations**: Book Consignments, View Tariffs, Print Bills, View Trucks & Dispatches |
| **Administrator** | `admin@tcc.com` | `Admin@123` | **System Control**: Fleet, Hubs, Tariffs, User Roles, and Data Management |

---

## 9. Automatic Truck Allocation Logic

One of the central viva requirements is the backend **Automatic Truck Allocation Engine**:

### The 500 m³ Threshold Business Rule:
1. Consignments are received at a branch with status `WAITING_FOR_TRUCK`.
2. For each destination branch, the system groups all pending consignments and calculates:
   $$\text{Total Pending Volume} = \sum \text{volume of pending consignments}$$
3. When $\text{Total Pending Volume} \ge 500\text{ m}^3$:
   * **Step 1: Identify Candidate Trucks**: Queries the database for trucks with `status: 'AVAILABLE'` or `'IDLE'`. Checks the source branch first.
   * **Step 2: Prefer Earliest Available Truck**: Candidate trucks are sorted by `lastAvailableAt ASC`. The truck that has been idle/available the longest is selected first.
   * **Step 3: Database Capacity Check**: The system queries the selected truck's actual capacity (`truck.capacity`) from MongoDB (trucks have 500 m³, 650 m³, 750 m³, etc.).
   * **Step 4: Pack Eligible Cargo (FIFO)**: Consignments are packed in FIFO order (`receivedAt ASC`) up to `truck.capacity`. Selected volume does not exceed truck capacity.
   * **Step 5: Generate Dispatch Manifest**: Generates a unique dispatch order `TCC-DSP-YYYYMMDD-XXXX`.
   * **Step 6: Atomic State Updates**:
     * Selected consignments updated to `ALLOCATED` with `allocatedAt = now`, `assignedTruck = truck._id`, `dispatchId = dispatch._id`.
     * Truck status updated to `LOADING`, with `destination = destinationBranch._id`, and `lastAllocatedAt = now`.
   * **Step 7: If No Truck is Available**: The cargo remains in `WAITING_FOR_TRUCK` status and is prominently highlighted on the dashboard with a "Ready for Truck (No available vehicle in fleet)" status until a truck completes a trip and becomes available.

---

## 10. Waiting Time Calculation

For any consignment:
$$\text{Waiting Time} = \text{Allocation/Dispatch Timestamp} - \text{Received Timestamp}$$

* **Individual Waiting Time**: Displayed on every consignment record and printed on the invoice bill (in hours and minutes).
* **Average Waiting Time**: Aggregated dynamically across all allocated/dispatched consignments:
  $$\text{Average Waiting Time} = \frac{\sum_{i=1}^N (\text{allocatedAt}_i - \text{receivedAt}_i)}{N}$$
* The manager can view the average waiting time on the **Dashboard** and filter by date range on the **Reports & Analytics** page.

---

## 11. Truck Idle Time Calculation

Idle time measures fleet utilization and unproductive dock standby:
$$\text{Idle Time} = \text{Next Allocation Timestamp} - \text{Previous Arrival / Available Timestamp}$$

* When a truck finishes a delivery, its status becomes `AVAILABLE` and `lastAvailableAt = new Date()`.
* When the truck is allocated to a new dispatch and departs, the idle duration is computed:
  $$\text{Idle Duration (minutes)} = \frac{\text{departureTime} - \text{lastAvailableAt}}{1000 \times 60}$$
* Stored in the `Trip` collection (`idleTimeBeforeTripMinutes`).
* Average idle duration is computed across completed trips and reported in the **Fleet Usage Report**.

---

## 12. REST API Reference

### Authentication
* `POST /api/auth/login` - Authenticate user & return JWT token
* `GET /api/auth/me` - Get profile of logged-in user

### Consignments
* `GET /api/consignments` - List consignments (filter by status, destination, search)
* `POST /api/consignments` - Book consignment (dynamically fetches rate from DB, computes charge, checks 500m³ allocation)
* `GET /api/consignments/:id` - Get consignment details with invoice bill data
* `PUT /api/consignments/:id` - Update consignment (if not yet dispatched)
* `DELETE /api/consignments/:id` - Delete/cancel waiting consignment

### Fleet Trucks
* `GET /api/trucks` - List fleet trucks with status & branch filters
* `POST /api/trucks` - Register new truck to fleet (Manager/Admin)
* `GET /api/trucks/:id` - Get truck details with trip history & telematics
* `PATCH /api/trucks/:id/status` - Quick status transition (`AVAILABLE`, `IDLE`, `MAINTENANCE`)
* `PUT /api/trucks/:id` - Update truck details
* `DELETE /api/trucks/:id` - Remove truck from fleet

### Dispatch & Allocation Engine
* `GET /api/allocation/pending` - Pending volume queues grouped by destination with 500 m³ progress
* `POST /api/allocation/run` - Trigger automated truck allocation algorithm
* `GET /api/dispatch` - List all dispatch manifests
* `GET /api/dispatch/:id` - Get manifest document with itemized shipments
* `POST /api/dispatch/:id/depart` - Mark truck departed (`ON_TRIP`, records idle time)
* `POST /api/dispatch/:id/deliver` - Mark cargo delivered (`COMPLETED`, relocates truck to destination hub as `AVAILABLE`)

### Freight Tariffs (Rates)
* `GET /api/rates` - Get destination rates from DB
* `GET /api/rates/destination/:id` - Get rate for destination branch
* `POST /api/rates` - Define tariff rate (Manager/Admin)
* `PUT /api/rates/:id` - Update tariff rate

### Reports & Analytics (Manager Only)
* `GET /api/reports/dashboard` - Real-time KPI summary (truck states, pending volume, revenue, wait times)
* `GET /api/reports/revenue` - Revenue by destination corridor with date filtering
* `GET /api/reports/volume` - Volume handled by destination
* `GET /api/reports/truck-usage` - Truck trips, transit hours, and idle durations
* `GET /api/reports/waiting-time` - Individual and average consignment waiting times

### Branch Hubs & Users
* `GET /api/branches`, `POST /api/branches` - Hubs management
* `GET /api/users`, `POST /api/users`, `PUT /api/users/:id` - User accounts & RBAC

---

## 13. Automated Integration Testing

An automated end-to-end integration test suite is included in `server/test-e2e.js`:
```bash
# From workspace root:
npm run test:e2e

# Or from server directory:
node test-e2e.js
```
The test script verifies:
1. Health check online status
2. Manager and Staff authentication
3. Fetching destination rates dynamically from MongoDB
4. Pending cargo volume before booking
5. Booking an 80 m³ consignment to push pending queue to $\ge 500\text{ m}^3$
6. Automatic trigger of the allocation algorithm
7. Generation of dispatch manifest order
8. Truck departure transition with idle time recording
9. Truck delivery completion and relocation to destination hub
10. Dynamic dashboard KPIs and analytics calculation

---

## 14. Viva / Evaluation Questions & Answers

**Q1: How are transport rates calculated in the system?**
> *Answer:* Rates are never hard-coded in the frontend. Destination tariff rates are stored in MongoDB in the `Rate` collection. When a booking clerk enters a consignment with a volume (m³) and destination, the backend fetches the destination-specific rate per m³ from the database and computes: $\text{Charge} = \text{Volume} \times \text{Rate}$.

**Q2: How does the Automatic Truck Allocation work?**
> *Answer:* Pending consignments (`WAITING_FOR_TRUCK`) are aggregated by destination. When pending volume reaches or exceeds 500 m³, the backend queries available trucks, picks the earliest available vehicle (sorted by `lastAvailableAt`), packs consignments in FIFO order up to the truck's actual capacity from the database, generates a dispatch record, sets truck status to `LOADING`, and sets consignment statuses to `ALLOCATED`.

**Q3: How is truck idle time tracked?**
> *Answer:* Each truck maintains a `lastAvailableAt` timestamp. When a truck completes a delivery or becomes available, this timestamp is updated. When the truck is allocated to a dispatch and departs, the idle duration is computed as $\text{departureTime} - \text{lastAvailableAt}$ and stored in the `Trip` record.

**Q4: What happens to a truck after it delivers cargo?**
> *Answer:* When marked delivered, the dispatch status becomes `COMPLETED`, consignments become `DELIVERED`, and the truck's current branch is updated to the destination branch with status `AVAILABLE`. This makes the truck immediately available to pick up return freight at the destination hub.

---

## 15. Deployment Guide

### Deploying to Render / Railway / Heroku
1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Complete TCC Full-Stack Logistics Application"
   git push origin main
   ```
2. **Backend**:
   - Create a Web Service on Render or Railway pointing to the `server/` directory.
   - Set Build Command: `npm install`
   - Set Start Command: `npm start`
   - Add Environment Variables: `PORT`, `MONGODB_URI` (from MongoDB Atlas), `JWT_SECRET`, `NODE_ENV=production`.
3. **Frontend**:
   - Create a Static Site on Vercel or Render pointing to `client/`.
   - Set Build Command: `npm run build`
   - Set Output Directory: `dist`
   - Set Environment Variable: `VITE_API_URL` pointing to your deployed backend URL.

---

### Developed for College Software Engineering Capstone
*Transport Company Computerization (TCC) • Production-Grade MERN Architecture*
