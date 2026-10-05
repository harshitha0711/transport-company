const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Truck = require('../models/Truck');
const Rate = require('../models/Rate');
const Consignment = require('../models/Consignment');
const Dispatch = require('../models/Dispatch');
const Trip = require('../models/Trip');

dotenv.config();

const seed = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/transport_company_db';
    await mongoose.connect(mongoUri);
    console.log('[Seed] Connected to MongoDB for seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Branch.deleteMany({});
    await Truck.deleteMany({});
    await Rate.deleteMany({});
    await Consignment.deleteMany({});
    await Dispatch.deleteMany({});
    await Trip.deleteMany({});
    console.log('[Seed] Cleared existing records.');

    // 1. Create Branches
    const branches = await Branch.insertMany([
      {
        name: 'Mumbai Central Logistics Hub (Head Office)',
        city: 'Mumbai',
        code: 'BOM-01',
        address: 'Plot 45, Sector 18, Vashi Logistics Park, Navi Mumbai',
        type: 'HEAD_OFFICE',
        phone: '+91 22 2789 4401',
        contactPerson: 'Rajesh Sharma (Fleet Director)',
      },
      {
        name: 'Delhi Northern Freight Terminal',
        city: 'Delhi',
        code: 'DEL-01',
        address: 'Sanjay Gandhi Transport Nagar, GT Karnal Road, Delhi',
        type: 'BRANCH_OFFICE',
        phone: '+91 11 2786 8920',
        contactPerson: 'Amitabh Verma (Branch Manager)',
      },
      {
        name: 'Bengaluru Tech Corridor Depot',
        city: 'Bengaluru',
        code: 'BLR-01',
        address: 'Hosur Road, Electronic City Phase 2, Bengaluru',
        type: 'BRANCH_OFFICE',
        phone: '+91 80 4120 7733',
        contactPerson: 'Karthik Rao (Operations Lead)',
      },
      {
        name: 'Chennai Port Express Branch',
        city: 'Chennai',
        code: 'MAA-01',
        address: 'Manali Express Highway, Near Ennore Port, Chennai',
        type: 'BRANCH_OFFICE',
        phone: '+91 44 2598 3311',
        contactPerson: 'Srinivasan Iyer (Logistics Supervisor)',
      },
      {
        name: 'Kolkata Eastern Gateway Hub',
        city: 'Kolkata',
        code: 'CCU-01',
        address: 'Dankuni Freight Complex, NH-2, Hooghly, Kolkata',
        type: 'BRANCH_OFFICE',
        phone: '+91 33 2659 1190',
        contactPerson: 'Subhashish Ghosh (Depot Manager)',
      },
    ]);

    const [mumbai, delhi, bangalore, chennai, kolkata] = branches;
    console.log(`[Seed] Created ${branches.length} branches.`);

    // 2. Create Origin-to-Destination Corridor Rates (per cubic meter & transit time)
    try {
      await Rate.collection.dropIndex('destination_1');
    } catch (e) {
      // index might not exist
    }

    const rates = await Rate.insertMany([
      // From Mumbai (Western Gateway)
      { origin: mumbai._id, destination: delhi._id, ratePerCubicMeter: 48, estimatedTransitHours: 32, description: 'Western-Northern Trunk Corridor Express (~1,400 km)' },
      { origin: mumbai._id, destination: bangalore._id, ratePerCubicMeter: 42, estimatedTransitHours: 22, description: 'Western-Southern Highway Corridor (~1,000 km)' },
      { origin: mumbai._id, destination: chennai._id, ratePerCubicMeter: 55, estimatedTransitHours: 28, description: 'Coastal-Transpeninsular Freight Expressway (~1,330 km)' },
      { origin: mumbai._id, destination: kolkata._id, ratePerCubicMeter: 65, estimatedTransitHours: 42, description: 'Trans-India East-West Freight Corridor (~1,900 km)' },

      // From Bengaluru (Southern Tech Hub) - Notice Bengaluru -> Chennai is only 7 hrs & ₹28!
      { origin: bangalore._id, destination: chennai._id, ratePerCubicMeter: 28, estimatedTransitHours: 7, description: 'Bengaluru-Chennai Expressway Rapid Corridor (~350 km)' },
      { origin: bangalore._id, destination: mumbai._id, ratePerCubicMeter: 42, estimatedTransitHours: 22, description: 'Southern-Western Return Trunk Route (~1,000 km)' },
      { origin: bangalore._id, destination: delhi._id, ratePerCubicMeter: 68, estimatedTransitHours: 46, description: 'Trans-National South-North Express Freight (~2,150 km)' },
      { origin: bangalore._id, destination: kolkata._id, ratePerCubicMeter: 62, estimatedTransitHours: 38, description: 'South-Eastern Coastal Industrial Corridor (~1,850 km)' },

      // From Chennai (Southern Port Gateway)
      { origin: chennai._id, destination: bangalore._id, ratePerCubicMeter: 28, estimatedTransitHours: 7, description: 'Chennai-Bengaluru Express Return Corridor (~350 km)' },
      { origin: chennai._id, destination: mumbai._id, ratePerCubicMeter: 55, estimatedTransitHours: 28, description: 'Chennai Port to Mumbai Gateway Corridor (~1,330 km)' },
      { origin: chennai._id, destination: delhi._id, ratePerCubicMeter: 70, estimatedTransitHours: 48, description: 'Grand South-North Port-to-Capital Trunk (~2,200 km)' },
      { origin: chennai._id, destination: kolkata._id, ratePerCubicMeter: 58, estimatedTransitHours: 36, description: 'East Coast Highway Port Corridor (~1,650 km)' },

      // From Delhi (Northern Freight Terminal)
      { origin: delhi._id, destination: mumbai._id, ratePerCubicMeter: 48, estimatedTransitHours: 32, description: 'Northern-Western Return Trunk Line (~1,400 km)' },
      { origin: delhi._id, destination: bangalore._id, ratePerCubicMeter: 68, estimatedTransitHours: 46, description: 'North-South Heavy Industrial Trunk (~2,150 km)' },
      { origin: delhi._id, destination: chennai._id, ratePerCubicMeter: 70, estimatedTransitHours: 48, description: 'Northern Capital to Chennai Port Highway (~2,200 km)' },
      { origin: delhi._id, destination: kolkata._id, ratePerCubicMeter: 52, estimatedTransitHours: 34, description: 'Grand Trunk Eastern Expressway (~1,500 km)' },

      // From Kolkata (Eastern Gateway)
      { origin: kolkata._id, destination: mumbai._id, ratePerCubicMeter: 65, estimatedTransitHours: 42, description: 'Eastern Gateway to Mumbai Trunk Corridor (~1,900 km)' },
      { origin: kolkata._id, destination: delhi._id, ratePerCubicMeter: 52, estimatedTransitHours: 34, description: 'Eastern to Capital Grand Trunk Return (~1,500 km)' },
      { origin: kolkata._id, destination: bangalore._id, ratePerCubicMeter: 62, estimatedTransitHours: 38, description: 'Eastern to Southern Tech Corridor (~1,850 km)' },
      { origin: kolkata._id, destination: chennai._id, ratePerCubicMeter: 58, estimatedTransitHours: 36, description: 'Eastern Maritime to Chennai Port Corridor (~1,650 km)' },
    ]);
    console.log(`[Seed] Created ${rates.length} origin-to-destination corridor rates in database.`);

    // 3. Create Users (hashed passwords)
    const adminPassword = await User.hashPassword('Admin@123');
    const managerPassword = await User.hashPassword('Manager@123');
    const staffPassword = await User.hashPassword('Staff@123');

    const users = await User.insertMany([
      {
        name: 'Super Administrator',
        email: 'admin@tcc.com',
        passwordHash: adminPassword,
        role: 'ADMIN',
        branch: mumbai._id,
        phone: '+91 98200 11001',
      },
      {
        name: 'Priya Nair (Operations Manager)',
        email: 'manager@tcc.com',
        passwordHash: managerPassword,
        role: 'MANAGER',
        branch: mumbai._id,
        phone: '+91 98200 22002',
      },
      {
        name: 'Rohan Deshmukh (Booking Clerk)',
        email: 'staff@tcc.com',
        passwordHash: staffPassword,
        role: 'STAFF',
        branch: mumbai._id,
        phone: '+91 98200 33003',
      },
    ]);
    console.log(`[Seed] Created ${users.length} authenticated users.`);

    // 4. Create Trucks of varying capacities and statuses
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

    const trucks = await Truck.insertMany([
      {
        truckNumber: 'MH-04-AB-1001',
        capacity: 500, // 500 m³ capacity
        currentBranch: mumbai._id,
        status: 'AVAILABLE',
        driverName: 'Gurdeep Singh',
        driverPhone: '+91 98111 20001',
        lastAvailableAt: twoDaysAgo, // Available for 48 hours (idle)
        notes: 'Heavy payload container truck, fully certified',
      },
      {
        truckNumber: 'MH-04-CD-2002',
        capacity: 650, // 650 m³ capacity
        currentBranch: mumbai._id,
        status: 'AVAILABLE',
        driverName: 'Mohammad Farooq',
        driverPhone: '+91 98111 20002',
        lastAvailableAt: oneDayAgo,
        notes: 'Multi-axle high capacity freight hauler',
      },
      {
        truckNumber: 'DL-01-EF-3003',
        capacity: 550,
        currentBranch: delhi._id,
        status: 'AVAILABLE',
        driverName: 'Rameshwar Pal',
        driverPhone: '+91 98111 20003',
        lastAvailableAt: fourHoursAgo,
        notes: 'Northern zonal line-haul vehicle',
      },
      {
        truckNumber: 'KA-05-GH-4004',
        capacity: 600,
        currentBranch: mumbai._id,
        status: 'LOADING',
        destination: bangalore._id,
        driverName: 'Satish Kumar',
        driverPhone: '+91 98111 20004',
        lastAllocatedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        notes: 'Currently in dock bay 4 loading tech equipment',
      },
      {
        truckNumber: 'TN-09-JK-5005',
        capacity: 750,
        currentBranch: bangalore._id,
        status: 'ON_TRIP',
        destination: chennai._id,
        driverName: 'Mani Maran',
        driverPhone: '+91 98111 20005',
        lastAllocatedAt: new Date(now.getTime() - 10 * 60 * 60 * 1000),
        notes: 'En route via NH-48 Express highway',
      },
      {
        truckNumber: 'WB-02-LM-6006',
        capacity: 500,
        currentBranch: mumbai._id,
        status: 'IDLE',
        driverName: 'Bikash Mondal',
        driverPhone: '+91 98111 20006',
        lastAvailableAt: new Date(now.getTime() - 72 * 60 * 60 * 1000),
        notes: 'Available on standby dock',
      },
      {
        truckNumber: 'MH-04-NP-7007',
        capacity: 1000,
        currentBranch: mumbai._id,
        status: 'MAINTENANCE',
        driverName: 'Ranjeet Shinde',
        driverPhone: '+91 98111 20007',
        notes: 'Undergoing routine 100,000 km engine service',
      },
    ]);
    console.log(`[Seed] Created ${trucks.length} fleet trucks with realistic metrics.`);

    // 5. Create Completed Historical Trips (for reports & idle time calculations)
    const trip1Departure = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const trip1Arrival = new Date(trip1Departure.getTime() + 26 * 60 * 60 * 1000);

    const trip2Departure = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    const trip2Arrival = new Date(trip2Departure.getTime() + 30 * 60 * 60 * 1000);

    const trip3Departure = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const trip3Arrival = new Date(trip3Departure.getTime() + 20 * 60 * 60 * 1000);

    await Trip.insertMany([
      {
        truck: trucks[0]._id,
        source: mumbai._id,
        destination: delhi._id,
        departureTime: trip1Departure,
        arrivalTime: trip1Arrival,
        durationHours: 26,
        idleTimeBeforeTripMinutes: 180, // 3 hours idle before trip
        status: 'COMPLETED',
        totalCargoVolume: 495,
        remarks: 'Express line haul completed on schedule',
      },
      {
        truck: trucks[1]._id,
        source: mumbai._id,
        destination: bangalore._id,
        departureTime: trip2Departure,
        arrivalTime: trip2Arrival,
        durationHours: 30,
        idleTimeBeforeTripMinutes: 240, // 4 hours idle
        status: 'COMPLETED',
        totalCargoVolume: 610,
        remarks: 'Delivered in good condition',
      },
      {
        truck: trucks[2]._id,
        source: delhi._id,
        destination: mumbai._id,
        departureTime: trip3Departure,
        arrivalTime: trip3Arrival,
        durationHours: 20,
        idleTimeBeforeTripMinutes: 120, // 2 hours idle
        status: 'COMPLETED',
        totalCargoVolume: 520,
        remarks: 'Standard transit completed',
      },
      {
        truck: trucks[4]._id,
        source: bangalore._id,
        destination: chennai._id,
        departureTime: new Date(now.getTime() - 8 * 60 * 60 * 1000),
        status: 'IN_PROGRESS',
        totalCargoVolume: 720,
        idleTimeBeforeTripMinutes: 90,
        remarks: 'Currently active on highway',
      },
    ]);
    console.log('[Seed] Created historical trips.');

    // 6. Create Historical Delivered / Dispatched Consignments (for revenue & volume graphs)
    const historicalConsignments = await Consignment.insertMany([
      {
        consignmentNumber: 'TCC-CN-20260920-1011',
        sender: {
          name: 'Tata Consultancy Logistics',
          phone: '+91 98200 44101',
          address: 'Powai Technology Park, Mumbai',
          gstNumber: '27AAACT2727Q1ZB',
        },
        receiver: {
          name: 'Infotech Systems Delhi',
          phone: '+91 98100 55102',
          address: 'Okhla Industrial Area Phase 3, New Delhi',
        },
        sourceBranch: mumbai._id,
        destinationBranch: delhi._id,
        volume: 240,
        ratePerCubicMeter: 48,
        charge: 240 * 48, // 11,520
        status: 'DELIVERED',
        receivedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        allocatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        dispatchedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        deliveredAt: trip1Arrival,
        assignedTruck: trucks[0]._id,
        paymentStatus: 'PAID',
        description: 'Server Racks and Network Hardware',
      },
      {
        consignmentNumber: 'TCC-CN-20260920-1012',
        sender: {
          name: 'Godrej Consumer Products',
          phone: '+91 98200 44102',
          address: 'Vikhroli Industrial Estate, Mumbai',
          gstNumber: '27AAACG0001Q1ZA',
        },
        receiver: {
          name: 'Northern FMCG Distributors',
          phone: '+91 98100 55103',
          address: 'GT Road Warehouse, Azadpur, Delhi',
        },
        sourceBranch: mumbai._id,
        destinationBranch: delhi._id,
        volume: 255,
        ratePerCubicMeter: 48,
        charge: 255 * 48, // 12,240
        status: 'DELIVERED',
        receivedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
        allocatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        dispatchedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        deliveredAt: trip1Arrival,
        assignedTruck: trucks[0]._id,
        paymentStatus: 'PAID',
        description: 'Packaged Household Consumables',
      },
      {
        consignmentNumber: 'TCC-CN-20260923-2021',
        sender: {
          name: 'Reliance Retail Logistics',
          phone: '+91 98200 44103',
          address: 'Ghansoli Hub, Navi Mumbai',
        },
        receiver: {
          name: 'South India Retail Mart',
          phone: '+91 98450 66104',
          address: 'Whitefield Distribution Park, Bengaluru',
        },
        sourceBranch: mumbai._id,
        destinationBranch: bangalore._id,
        volume: 320,
        ratePerCubicMeter: 42,
        charge: 320 * 42, // 13,440
        status: 'DELIVERED',
        receivedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        allocatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
        dispatchedAt: trip2Departure,
        deliveredAt: trip2Arrival,
        assignedTruck: trucks[1]._id,
        paymentStatus: 'PAID',
        description: 'Apparel & Department Store Goods',
      },
      {
        consignmentNumber: 'TCC-CN-20260923-2022',
        sender: {
          name: 'Bharat Electronics Ltd',
          phone: '+91 98200 44104',
          address: 'MIDC Industrial Area, Mumbai',
        },
        receiver: {
          name: 'ElectroTech Industries',
          phone: '+91 98450 66105',
          address: 'Peenya Industrial Estate, Bengaluru',
        },
        sourceBranch: mumbai._id,
        destinationBranch: bangalore._id,
        volume: 290,
        ratePerCubicMeter: 42,
        charge: 290 * 42, // 12,180
        status: 'DELIVERED',
        receivedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
        allocatedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000),
        dispatchedAt: trip2Departure,
        deliveredAt: trip2Arrival,
        assignedTruck: trucks[1]._id,
        paymentStatus: 'PAID',
        description: 'High-precision Semiconductor Equipment',
      },
    ]);
    console.log(`[Seed] Created ${historicalConsignments.length} delivered consignments.`);

    // 7. Create Active Pending Consignments (Crucial for Demo & Allocation testing!)
    // Scenario A: Consignments for Delhi at Mumbai branch:
    // Total current volume = 220 + 210 = 430 m³.
    // Just 70 m³ shy of 500 m³!
    // Adding 1 consignment of 80 m³ will immediately breach 500 m³ threshold and trigger auto allocation!
    const pendingDelhi = await Consignment.insertMany([
      {
        consignmentNumber: 'TCC-CN-20260927-4001',
        sender: {
          name: 'Mahindra Auto Spares',
          phone: '+91 98200 77001',
          address: 'Kandivali Auto Cluster, Mumbai',
        },
        receiver: {
          name: 'Delhi Northern Spares Hub',
          phone: '+91 98111 88001',
          address: 'Kashmere Gate Auto Market, Delhi',
        },
        sourceBranch: mumbai._id,
        destinationBranch: delhi._id,
        volume: 220,
        ratePerCubicMeter: 48,
        charge: 220 * 48, // 10,560
        status: 'WAITING_FOR_TRUCK',
        receivedAt: new Date(now.getTime() - 14 * 60 * 60 * 1000), // waiting 14h
        paymentStatus: 'PAID',
        description: 'Automotive Crankshafts & Gearboxes',
      },
      {
        consignmentNumber: 'TCC-CN-20260927-4002',
        sender: {
          name: 'Asian Paints Industrial Div',
          phone: '+91 98200 77002',
          address: 'Bhandup Industrial Zone, Mumbai',
        },
        receiver: {
          name: 'Capital Coating Works',
          phone: '+91 98111 88002',
          address: 'Mayapuri Industrial Area, Delhi',
        },
        sourceBranch: mumbai._id,
        destinationBranch: delhi._id,
        volume: 210,
        ratePerCubicMeter: 48,
        charge: 210 * 48, // 10,080
        status: 'WAITING_FOR_TRUCK',
        receivedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000), // waiting 8h
        paymentStatus: 'PAID',
        description: 'Industrial Protective Resins & Drums',
      },
    ]);

    // Scenario B: Consignments for Kolkata at Mumbai branch:
    // Total current volume = 310 + 220 = 530 m³! (Already reached > 500 m³ threshold!)
    // Demonstrates instant allocation when running allocation engine!
    const pendingKolkata = await Consignment.insertMany([
      {
        consignmentNumber: 'TCC-CN-20260927-5001',
        sender: {
          name: 'Jindal Steel Logistics',
          phone: '+91 98200 99001',
          address: 'Kalamboli Steel Yard, Navi Mumbai',
        },
        receiver: {
          name: 'Eastern Infrastructure Corp',
          phone: '+91 98300 11002',
          address: 'Taratala Industrial Area, Kolkata',
        },
        sourceBranch: mumbai._id,
        destinationBranch: kolkata._id,
        volume: 310,
        ratePerCubicMeter: 65,
        charge: 310 * 65, // 20,150
        status: 'WAITING_FOR_TRUCK',
        receivedAt: new Date(now.getTime() - 18 * 60 * 60 * 1000),
        paymentStatus: 'PAID',
        description: 'Structural Steel Angles and Girders',
      },
      {
        consignmentNumber: 'TCC-CN-20260927-5002',
        sender: {
          name: 'Pidilite Industries',
          phone: '+91 98200 99003',
          address: 'Andheri East Industrial Hub, Mumbai',
        },
        receiver: {
          name: 'Bengal Adhesive Traders',
          phone: '+91 98300 11004',
          address: 'Strand Road Commercial Market, Kolkata',
        },
        sourceBranch: mumbai._id,
        destinationBranch: kolkata._id,
        volume: 220,
        ratePerCubicMeter: 65,
        charge: 220 * 65, // 14,300
        status: 'WAITING_FOR_TRUCK',
        receivedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        paymentStatus: 'PAID',
        description: 'Industrial Adhesives & Polymer Sealants',
      },
    ]);

    // Scenario C: Consignments for Chennai at Mumbai branch:
    // Volume = 180 m³ (Under 500 m³ threshold, waiting)
    await Consignment.create({
      consignmentNumber: 'TCC-CN-20260928-6001',
      sender: {
        name: 'Cipla Pharmaceuticals',
        phone: '+91 98200 33005',
        address: 'Kurla Industrial Estate, Mumbai',
      },
      receiver: {
        name: 'Apollo Hospital Central Pharmacy',
        phone: '+91 98400 44006',
        address: 'Greams Road, Chennai',
      },
      sourceBranch: mumbai._id,
      destinationBranch: chennai._id,
      volume: 180,
      ratePerCubicMeter: 55,
      charge: 180 * 55, // 9,900
      status: 'WAITING_FOR_TRUCK',
      receivedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
      paymentStatus: 'PAID',
      description: 'Temperature-Controlled Medical Supplies',
    });

    console.log('[Seed] Created active pending consignments across multiple routes.');
    console.log('[Seed] Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Seeding failed:', error);
    process.exit(1);
  }
};

seed();
