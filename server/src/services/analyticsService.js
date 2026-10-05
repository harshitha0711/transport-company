const Consignment = require('../models/Consignment');
const Truck = require('../models/Truck');
const Dispatch = require('../models/Dispatch');
const Trip = require('../models/Trip');
const Branch = require('../models/Branch');
const Rate = require('../models/Rate');

/**
 * Calculates core dashboard KPI metrics
 */
const getDashboardMetrics = async () => {
  // Truck statuses count
  const trucks = await Truck.find();
  const totalTrucks = trucks.length;
  const availableTrucks = trucks.filter((t) => t.status === 'AVAILABLE').length;
  const loadingTrucks = trucks.filter((t) => t.status === 'LOADING').length;
  const onTripTrucks = trucks.filter((t) => t.status === 'ON_TRIP').length;
  const idleTrucks = trucks.filter((t) => t.status === 'IDLE').length;
  const maintenanceTrucks = trucks.filter((t) => t.status === 'MAINTENANCE').length;

  // Consignments metrics
  const pendingConsignmentsList = await Consignment.find({
    status: { $in: ['WAITING_FOR_TRUCK', 'RECEIVED'] },
  });
  const pendingConsignmentsCount = pendingConsignmentsList.length;
  const pendingCargoVolume = Number(
    pendingConsignmentsList.reduce((acc, c) => acc + (c.volume || 0), 0).toFixed(2)
  );

  // Total revenue from all booked consignments
  const revenueAgg = await Consignment.aggregate([
    { $group: { _id: null, totalRevenue: { $sum: '$charge' } } },
  ]);
  const totalRevenue = revenueAgg[0] ? Number(revenueAgg[0].totalRevenue.toFixed(2)) : 0;

  // Average Consignment Waiting Time (in hours)
  // For consignments that have been allocated or dispatched
  const waitTimeAgg = await Consignment.aggregate([
    {
      $match: {
        allocatedAt: { $ne: null },
        receivedAt: { $ne: null },
      },
    },
    {
      $project: {
        waitingHours: {
          $divide: [
            { $subtract: ['$allocatedAt', '$receivedAt'] },
            1000 * 60 * 60, // ms to hours
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        avgWaitHours: { $avg: '$waitingHours' },
      },
    },
  ]);
  const avgWaitingTime = waitTimeAgg[0]
    ? Number(waitTimeAgg[0].avgWaitHours.toFixed(2))
    : 0;

  // Average Truck Idle Time (in hours)
  // From completed trips or truck state history
  const tripsWithIdle = await Trip.find({ idleTimeBeforeTripMinutes: { $gt: 0 } });
  let avgIdleTimeHours = 0;
  if (tripsWithIdle.length > 0) {
    const totalIdleMins = tripsWithIdle.reduce(
      (acc, t) => acc + (t.idleTimeBeforeTripMinutes || 0),
      0
    );
    avgIdleTimeHours = Number((totalIdleMins / tripsWithIdle.length / 60).toFixed(2));
  } else {
    // Estimate from currently available / idle trucks
    const now = Date.now();
    const idleDurations = trucks
      .filter((t) => t.lastAvailableAt)
      .map((t) => (now - new Date(t.lastAvailableAt).getTime()) / (1000 * 60 * 60));
    if (idleDurations.length > 0) {
      avgIdleTimeHours = Number(
        (idleDurations.reduce((a, b) => a + b, 0) / idleDurations.length).toFixed(2)
      );
    }
  }

  return {
    trucks: {
      total: totalTrucks,
      available: availableTrucks,
      loading: loadingTrucks,
      onTrip: onTripTrucks,
      idle: idleTrucks,
      maintenance: maintenanceTrucks,
    },
    consignments: {
      pendingCount: pendingConsignmentsCount,
      pendingVolume: pendingCargoVolume,
    },
    totalRevenue,
    avgWaitingTimeHours: avgWaitingTime,
    avgIdleTimeHours,
  };
};

/**
 * Revenue, volume, and consignment counts by Destination
 */
const getDestinationMetrics = async (startDate, endDate) => {
  const match = {};
  if (startDate || endDate) {
    match.receivedAt = {};
    if (startDate) match.receivedAt.$gte = new Date(startDate);
    if (endDate) match.receivedAt.$lte = new Date(endDate);
  }

  const result = await Consignment.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$destinationBranch',
        totalRevenue: { $sum: '$charge' },
        totalVolume: { $sum: '$volume' },
        consignmentCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'branches',
        localField: '_id',
        foreignField: '_id',
        as: 'branchDetails',
      },
    },
    { $unwind: '$branchDetails' },
    {
      $project: {
        destinationId: '$_id',
        destinationName: '$branchDetails.name',
        city: '$branchDetails.city',
        code: '$branchDetails.code',
        totalRevenue: { $round: ['$totalRevenue', 2] },
        totalVolume: { $round: ['$totalVolume', 2] },
        consignmentCount: 1,
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  return result;
};

/**
 * Truck usage and idle time analytics over selected period
 */
const getTruckUsageReport = async (startDate, endDate) => {
  const match = {};
  if (startDate || endDate) {
    match.departureTime = {};
    if (startDate) match.departureTime.$gte = new Date(startDate);
    if (endDate) match.departureTime.$lte = new Date(endDate);
  }

  const rates = await Rate.find();
  const allTrucks = await Truck.find().populate('currentBranch', 'name city code');

  const rawTrips = await Trip.find(match)
    .populate('truck', 'truckNumber capacity status')
    .populate('source', 'name city code')
    .populate('destination', 'name city code')
    .sort({ departureTime: -1 });

  // Map trips with non-zero transit time and explicit idle calculation details
  const trips = rawTrips.map((trip) => {
    const tObj = trip.toObject();

    // 1. Determine realistic transit hours (prevent 0 hrs from quick demo deliveries)
    let transitHours = tObj.durationHours || 0;
    if (transitHours < 1) {
      // Find matching corridor rate
      const corridorRate = rates.find(
        (r) =>
          r.destination?.toString() === trip.destination?._id?.toString() &&
          (!r.origin || r.origin?.toString() === trip.source?._id?.toString())
      );
      transitHours = corridorRate?.estimatedTransitHours || (trip.status === 'IN_PROGRESS' ? 8 : 24);
    }
    tObj.durationHours = transitHours;

    // 2. Explicit Idle Time Calculation (Departure Time - Available Time)
    const idleMins = tObj.idleTimeBeforeTripMinutes || 0;
    const depTime = new Date(tObj.departureTime);
    const availTime = tObj.availableTimeBeforeTrip
      ? new Date(tObj.availableTimeBeforeTrip)
      : new Date(depTime.getTime() - idleMins * 60 * 1000);

    tObj.availableTimeBeforeTrip = availTime;
    tObj.idleMinutes = idleMins;
    tObj.idleHours = Number((idleMins / 60).toFixed(1));
    tObj.idleCalculation = `${depTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${availTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} = ${idleMins} mins (${Number((idleMins / 60).toFixed(1))} hrs)`;

    return tObj;
  });

  // Aggregate stats per truck
  const truckMap = {};

  // Initialize with all trucks in fleet
  for (const trk of allTrucks) {
    const tId = trk._id.toString();
    truckMap[tId] = {
      truckId: tId,
      truckNumber: trk.truckNumber,
      capacity: trk.capacity,
      status: trk.status,
      currentBranch: trk.currentBranch?.city || 'Hub',
      totalTrips: 0,
      totalDurationHours: 0,
      totalIdleMinutes: 0,
      totalVolumeCarried: 0,
    };
  }

  for (const trip of trips) {
    if (!trip.truck) continue;
    const tId = trip.truck._id.toString();
    if (!truckMap[tId]) {
      truckMap[tId] = {
        truckId: tId,
        truckNumber: trip.truck.truckNumber,
        capacity: trip.truck.capacity,
        status: trip.truck.status,
        currentBranch: 'Hub',
        totalTrips: 0,
        totalDurationHours: 0,
        totalIdleMinutes: 0,
        totalVolumeCarried: 0,
      };
    }
    truckMap[tId].totalTrips += 1;
    truckMap[tId].totalDurationHours += trip.durationHours || 0;
    truckMap[tId].totalIdleMinutes += trip.idleMinutes || 0;
    truckMap[tId].totalVolumeCarried += trip.totalCargoVolume || 0;
  }

  const truckUsage = Object.values(truckMap).map((t) => ({
    ...t,
    totalDurationHours: Number(t.totalDurationHours.toFixed(1)),
    avgIdleHours: t.totalTrips > 0 ? Number((t.totalIdleMinutes / t.totalTrips / 60).toFixed(1)) : 0,
    totalVolumeCarried: Number(t.totalVolumeCarried.toFixed(2)),
  }));

  // Overall fleet idle metrics
  const totalFleetIdleMins = trips.reduce((acc, t) => acc + (t.idleMinutes || 0), 0);
  const avgFleetIdleHours = trips.length > 0 ? Number((totalFleetIdleMins / trips.length / 60).toFixed(1)) : 0;

  return {
    trips,
    truckUsage,
    totalTripsRun: trips.length,
    avgFleetIdleHours,
    totalFleetIdleHours: Number((totalFleetIdleMins / 60).toFixed(1)),
  };
};

/**
 * Consignment waiting time details & trends
 */
const getWaitingTimeReport = async (startDate, endDate) => {
  const match = {
    allocatedAt: { $ne: null },
    receivedAt: { $ne: null },
  };

  if (startDate || endDate) {
    match.receivedAt = {};
    if (startDate) match.receivedAt.$gte = new Date(startDate);
    if (endDate) match.receivedAt.$lte = new Date(endDate);
  }

  const consignments = await Consignment.find(match)
    .populate('sourceBranch', 'name city')
    .populate('destinationBranch', 'name city')
    .sort({ receivedAt: -1 })
    .limit(100);

  const data = consignments.map((c) => {
    const diffMs = new Date(c.allocatedAt).getTime() - new Date(c.receivedAt).getTime();
    const waitHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
    return {
      consignmentNumber: c.consignmentNumber,
      source: c.sourceBranch ? c.sourceBranch.city : 'N/A',
      destination: c.destinationBranch ? c.destinationBranch.city : 'N/A',
      volume: c.volume,
      receivedAt: c.receivedAt,
      allocatedAt: c.allocatedAt,
      waitingHours: waitHours,
    };
  });

  const avgHours =
    data.length > 0
      ? Number((data.reduce((acc, c) => acc + c.waitingHours, 0) / data.length).toFixed(2))
      : 0;

  return {
    averageWaitingHours: avgHours,
    totalAnalyzed: data.length,
    consignments: data,
  };
};

module.exports = {
  getDashboardMetrics,
  getDestinationMetrics,
  getTruckUsageReport,
  getWaitingTimeReport,
};
