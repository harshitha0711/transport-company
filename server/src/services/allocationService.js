const Consignment = require('../models/Consignment');
const Truck = require('../models/Truck');
const Dispatch = require('../models/Dispatch');
const Branch = require('../models/Branch');

/**
 * Calculates pending cargo summary grouped by destination branch
 */
const getPendingCargoSummary = async (sourceBranchId = null) => {
  const matchQuery = {
    status: { $in: ['WAITING_FOR_TRUCK', 'RECEIVED'] },
  };

  if (sourceBranchId) {
    matchQuery.sourceBranch = sourceBranchId;
  }

  const pendingConsignments = await Consignment.find(matchQuery)
    .populate('sourceBranch', 'name city code')
    .populate('destinationBranch', 'name city code')
    .sort({ receivedAt: 1 });

  // Group by destination branch (and source branch)
  const groupMap = {};

  for (const c of pendingConsignments) {
    if (!c.destinationBranch) continue;
    const destId = c.destinationBranch._id.toString();
    const srcId = c.sourceBranch ? c.sourceBranch._id.toString() : 'ALL';
    const key = `${srcId}_${destId}`;

    if (!groupMap[key]) {
      groupMap[key] = {
        key,
        sourceBranch: c.sourceBranch,
        destinationBranch: c.destinationBranch,
        totalVolume: 0,
        consignmentCount: 0,
        consignments: [],
        oldestReceivedAt: c.receivedAt,
        thresholdReached: false,
      };
    }

    groupMap[key].totalVolume += Number(c.volume);
    groupMap[key].consignmentCount += 1;
    groupMap[key].consignments.push(c);
  }

  const results = Object.values(groupMap).map((grp) => {
    grp.totalVolume = Number(grp.totalVolume.toFixed(2));
    grp.thresholdReached = grp.totalVolume >= 500;
    return grp;
  });

  // Check available trucks
  const availableTrucksQuery = { status: { $in: ['AVAILABLE', 'IDLE'] } };
  const availableTrucks = await Truck.find(availableTrucksQuery)
    .populate('currentBranch', 'name city code')
    .sort({ lastAvailableAt: 1 });

  return {
    pendingGroups: results,
    totalPendingVolume: Number(
      results.reduce((acc, curr) => acc + curr.totalVolume, 0).toFixed(2)
    ),
    totalPendingConsignments: results.reduce((acc, curr) => acc + curr.consignmentCount, 0),
    readyForAllocationCount: results.filter((g) => g.thresholdReached).length,
    availableTrucksCount: availableTrucks.length,
    availableTrucks,
  };
};

/**
 * Runs the automatic truck allocation business logic
 * Triggered automatically when consignment is entered or manually by manager/staff
 */
const runAutomaticAllocation = async (userId = null) => {
  const allocationLog = [];
  const allocatedTruckIds = new Set();

  // Find all pending consignments
  const pendingConsignments = await Consignment.find({
    status: { $in: ['WAITING_FOR_TRUCK', 'RECEIVED'] },
  })
    .populate('sourceBranch')
    .populate('destinationBranch')
    .sort({ receivedAt: 1 }); // FIFO order

  if (pendingConsignments.length === 0) {
    return {
      message: 'No pending cargo awaiting allocation',
      allocations: [],
      unallocatedGroups: [],
    };
  }

  // Group by [sourceBranch, destinationBranch]
  const groups = {};
  for (const c of pendingConsignments) {
    if (!c.destinationBranch || !c.sourceBranch) continue;
    const key = `${c.sourceBranch._id}_${c.destinationBranch._id}`;
    if (!groups[key]) {
      groups[key] = {
        sourceBranch: c.sourceBranch,
        destinationBranch: c.destinationBranch,
        consignments: [],
        totalVolume: 0,
      };
    }
    groups[key].consignments.push(c);
    groups[key].totalVolume += Number(c.volume);
  }

  const unallocatedGroups = [];

  for (const key of Object.keys(groups)) {
    const group = groups[key];
    group.totalVolume = Number(group.totalVolume.toFixed(2));

    // Check 500 m³ requirement
    if (group.totalVolume < 500) {
      unallocatedGroups.push({
        sourceBranch: group.sourceBranch.name,
        destinationBranch: group.destinationBranch.name,
        pendingVolume: group.totalVolume,
        consignmentCount: group.consignments.length,
        reason: `Pending volume (${group.totalVolume} m³) has not reached 500 m³ threshold (${(500 - group.totalVolume).toFixed(2)} m³ needed).`,
      });
      continue;
    }

    // Step 1: Find next suitable available truck
    // Earliest available truck preference
    const truckCandidates = await Truck.find({
      _id: { $nin: Array.from(allocatedTruckIds) },
      status: { $in: ['AVAILABLE', 'IDLE'] },
      currentBranch: group.sourceBranch._id,
    }).sort({ lastAvailableAt: 1 });

    let chosenTruck = null;

    if (truckCandidates.length > 0) {
      chosenTruck = truckCandidates[0];
    } else {
      // If no truck currently physically at this branch, check any available truck in system
      const fallbackTruck = await Truck.findOne({
        _id: { $nin: Array.from(allocatedTruckIds) },
        status: { $in: ['AVAILABLE', 'IDLE'] },
      }).sort({ lastAvailableAt: 1 });

      if (fallbackTruck) {
        chosenTruck = fallbackTruck;
        // Reposition truck to source branch
        chosenTruck.currentBranch = group.sourceBranch._id;
      }
    }

    if (!chosenTruck) {
      unallocatedGroups.push({
        sourceBranch: group.sourceBranch.name,
        destinationBranch: group.destinationBranch.name,
        pendingVolume: group.totalVolume,
        consignmentCount: group.consignments.length,
        reason: 'Cargo volume is >= 500 m³, but no truck is currently AVAILABLE in the fleet.',
      });
      continue;
    }

    // Step 2: Select consignments to pack within chosen truck's capacity
    const truckCapacity = chosenTruck.capacity;
    const selectedConsignments = [];
    let currentLoadedVolume = 0;

    for (const item of group.consignments) {
      if (currentLoadedVolume + item.volume <= truckCapacity) {
        selectedConsignments.push(item);
        currentLoadedVolume += item.volume;
      }
    }

    if (selectedConsignments.length === 0) {
      unallocatedGroups.push({
        sourceBranch: group.sourceBranch.name,
        destinationBranch: group.destinationBranch.name,
        pendingVolume: group.totalVolume,
        reason: `Truck ${chosenTruck.truckNumber} capacity (${truckCapacity} m³) too small for individual items.`,
      });
      continue;
    }

    currentLoadedVolume = Number(currentLoadedVolume.toFixed(2));

    // Generate unique Dispatch number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const dispatchNumber = `TCC-DSP-${dateStr}-${randSuffix}`;

    // Create Dispatch record
    const dispatch = await Dispatch.create({
      dispatchNumber,
      truck: chosenTruck._id,
      sourceBranch: group.sourceBranch._id,
      destinationBranch: group.destinationBranch._id,
      consignments: selectedConsignments.map((c) => c._id),
      totalVolume: currentLoadedVolume,
      dispatchTime: new Date(),
      status: 'PREPARED',
      driverName: chosenTruck.driverName || 'Designated Fleet Driver',
      driverPhone: chosenTruck.driverPhone || '',
      dispatchedBy: userId,
      notes: `Automated batch allocation for cargo to ${group.destinationBranch.city}`,
    });

    // Update Consignments
    const now = new Date();
    const consignmentIds = selectedConsignments.map((c) => c._id);
    await Consignment.updateMany(
      { _id: { $in: consignmentIds } },
      {
        $set: {
          status: 'ALLOCATED',
          allocatedAt: now,
          assignedTruck: chosenTruck._id,
          dispatchId: dispatch._id,
        },
      }
    );

    // Update Truck
    chosenTruck.status = 'LOADING';
    chosenTruck.destination = group.destinationBranch._id;
    chosenTruck.lastAllocatedAt = now;
    await chosenTruck.save();

    allocatedTruckIds.add(chosenTruck._id.toString());

    allocationLog.push({
      dispatchNumber: dispatch.dispatchNumber,
      truckNumber: chosenTruck.truckNumber,
      truckCapacity: chosenTruck.capacity,
      allocatedVolume: currentLoadedVolume,
      consignmentsCount: selectedConsignments.length,
      sourceBranch: group.sourceBranch.name,
      destinationBranch: group.destinationBranch.name,
      timestamp: now,
    });
  }

  return {
    success: true,
    totalAllocated: allocationLog.length,
    allocations: allocationLog,
    unallocatedGroups,
  };
};

module.exports = {
  getPendingCargoSummary,
  runAutomaticAllocation,
};
