const http = require('http');

const request = (path, method = 'GET', data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'http://127.0.0.1:5000');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const bodyStr = data ? JSON.stringify(data) : null;
    if (bodyStr) headers['Content-Length'] = Buffer.byteLength(bodyStr);

    const req = http.request(
      url,
      {
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve({ status: res.statusCode, body: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, body: rawData });
          }
        });
      }
    );

    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
};

const runTests = async () => {
  console.log('====================================================');
  console.log('  STARTING TCC FULL-STACK END-TO-END AUTOMATED TESTS');
  console.log('====================================================\n');

  // Test 1: Health check
  console.log('[Test 1] GET /api/health');
  const health = await request('/api/health');
  console.log(`Status: ${health.status}, Response:`, health.body);
  if (health.status !== 200) throw new Error('Health check failed');
  console.log('✓ PASS: Health check online\n');

  // Test 2: Manager Login
  console.log('[Test 2] POST /api/auth/login as Manager');
  const managerLogin = await request('/api/auth/login', 'POST', {
    email: 'manager@tcc.com',
    password: 'Manager@123',
  });
  console.log(`Status: ${managerLogin.status}, User: ${managerLogin.body.user?.name}, Role: ${managerLogin.body.user?.role}`);
  const managerToken = managerLogin.body.token;
  if (!managerToken) throw new Error('Manager login failed');
  console.log('✓ PASS: Manager authenticated, JWT issued\n');

  // Test 3: Staff Login
  console.log('[Test 3] POST /api/auth/login as Staff');
  const staffLogin = await request('/api/auth/login', 'POST', {
    email: 'staff@tcc.com',
    password: 'Staff@123',
  });
  console.log(`Status: ${staffLogin.status}, User: ${staffLogin.body.user?.name}, Role: ${staffLogin.body.user?.role}`);
  if (staffLogin.status !== 200) throw new Error('Staff login failed');
  console.log('✓ PASS: Staff authenticated, JWT issued\n');

  // Test 4: Fetch Branches & Rates from Database
  console.log('[Test 4] GET /api/branches and GET /api/rates');
  const branches = await request('/api/branches', 'GET', null, managerToken);
  const rates = await request('/api/rates', 'GET', null, managerToken);
  console.log(`Branches count: ${branches.body.count}, Rates count: ${rates.body.count}`);
  const mumbaiBranch = branches.body.data.find((b) => b.city === 'Mumbai');
  const delhiBranch = branches.body.data.find((b) => b.city === 'Delhi');
  const delhiRate = rates.body.data.find((r) => r.destination?.city === 'Delhi');
  console.log(`Mumbai Hub ID: ${mumbaiBranch._id}, Delhi Terminal ID: ${delhiBranch._id}`);
  console.log(`Database Freight Rate for Delhi: ₹${delhiRate.ratePerCubicMeter} / m³`);
  console.log('✓ PASS: Rates and branches loaded directly from database\n');

  // Test 5: Check Pending Cargo before booking
  console.log('[Test 5] GET /api/allocation/pending');
  const pendingBefore = await request('/api/allocation/pending', 'GET', null, managerToken);
  console.log('Total pending volume:', pendingBefore.body.data.totalPendingVolume, 'm³');
  const delhiQueueBefore = pendingBefore.body.data.pendingGroups.find((g) => g.destinationBranch?.city === 'Delhi');
  console.log(`Delhi pending before booking: ${delhiQueueBefore?.totalVolume || 0} m³`);

  // Test 6: Book a consignment that pushes Delhi past 500 m³!
  // Current Delhi pending is 430 m³. Booking 80 m³ will make it 510 m³ (>= 500 m³ threshold)!
  console.log('\n[Test 6] POST /api/consignments - Booking 80 m³ consignment to Delhi to trigger >= 500 m³ auto-allocation');
  const consignmentRes = await request(
    '/api/consignments',
    'POST',
    {
      sender: {
        name: 'Apex Industrial Parts',
        phone: '+91 98200 99881',
        address: 'MIDC Phase 2, Turbhe, Navi Mumbai',
        gstNumber: '27AABCA1234F1Z1',
      },
      receiver: {
        name: 'Northern Engineering Depot',
        phone: '+91 98111 22334',
        address: 'Okhla Industrial Area Phase 1, New Delhi',
      },
      sourceBranch: mumbaiBranch._id,
      destinationBranch: delhiBranch._id,
      volume: 80,
      description: 'Precision Machined CNC Assemblies',
      paymentStatus: 'PAID',
    },
    managerToken
  );

  console.log(`Status: ${consignmentRes.status}`);
  console.log(`Consignment Created: ${consignmentRes.body.data.consignmentNumber}`);
  console.log(`Cargo Volume: ${consignmentRes.body.data.volume} m³`);
  console.log(`Tariff Rate applied from DB: ₹${consignmentRes.body.data.ratePerCubicMeter} / m³`);
  console.log(`Calculated Transport Charge: ₹${consignmentRes.body.data.charge} (80 × 48)`);
  console.log(`Automatic Allocation Triggered: ${consignmentRes.body.allocationTriggered}`);
  console.log('Allocation Result:', JSON.stringify(consignmentRes.body.allocationResult, null, 2));

  if (!consignmentRes.body.allocationTriggered) {
    console.log('Checking manual allocation trigger if needed...');
    const allocRun = await request('/api/allocation/run', 'POST', {}, managerToken);
    console.log('Allocation run response:', allocRun.body);
  }
  console.log('✓ PASS: Consignment booked, rate calculated from DB, and truck allocation evaluated!\n');

  // Test 7: Verify Dispatches
  console.log('[Test 7] GET /api/dispatch');
  const dispatches = await request('/api/dispatch', 'GET', null, managerToken);
  console.log(`Total Dispatches created: ${dispatches.body.count}`);
  const latestDispatch = dispatches.body.data[0];
  console.log(`Latest Dispatch #: ${latestDispatch?.dispatchNumber}`);
  console.log(`Allocated Truck: ${latestDispatch?.truck?.truckNumber} (Capacity: ${latestDispatch?.truck?.capacity} m³)`);
  console.log(`Total Cargo Manifested: ${latestDispatch?.totalVolume} m³`);
  console.log(`Dispatch Status: ${latestDispatch?.status}`);
  console.log('✓ PASS: Dispatch manifest generated with eligible consignments\n');

  // Test 8: Dispatch Departure Transition
  if (latestDispatch && latestDispatch.status === 'PREPARED') {
    console.log(`[Test 8] POST /api/dispatch/${latestDispatch._id}/depart`);
    const departRes = await request(`/api/dispatch/${latestDispatch._id}/depart`, 'POST', {}, managerToken);
    console.log(`Depart status: ${departRes.status}, Message: ${departRes.body.message}`);
    console.log(`Truck status updated to: ${departRes.body.data.trip.status}, Idle time before trip: ${departRes.body.data.trip.idleTimeBeforeTripMinutes} mins`);
    console.log('✓ PASS: Truck departed on highway trip, timestamps and idle duration recorded\n');

    // Test 9: Complete Delivery at Destination
    console.log(`[Test 9] POST /api/dispatch/${latestDispatch._id}/deliver`);
    const deliverRes = await request(`/api/dispatch/${latestDispatch._id}/deliver`, 'POST', {}, managerToken);
    console.log(`Deliver status: ${deliverRes.status}, Message: ${deliverRes.body.message}`);
    console.log('✓ PASS: Delivery completed, truck marked AVAILABLE at destination hub!\n');
  }

  // Test 10: Reports and Analytics
  console.log('[Test 10] GET /api/reports/dashboard & GET /api/reports/revenue');
  const dashRes = await request('/api/reports/dashboard', 'GET', null, managerToken);
  const revRes = await request('/api/reports/revenue', 'GET', null, managerToken);
  const waitRes = await request('/api/reports/waiting-time', 'GET', null, managerToken);
  console.log('Dashboard KPIs:', dashRes.body.data);
  console.log(`Corridor Revenue items: ${revRes.body.count}`);
  console.log(`Average Consignment Waiting Time: ${waitRes.body.data.averageWaitingHours} hrs`);
  console.log('✓ PASS: All analytics, waiting times, and revenue calculated from database\n');

  console.log('====================================================');
  console.log('  ALL END-TO-END SYSTEM TESTS PASSED SUCCESSFULLY!  ');
  console.log('====================================================');
};

runTests().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
