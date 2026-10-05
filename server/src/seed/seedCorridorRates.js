const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Branch = require('../models/Branch');
const Rate = require('../models/Rate');

dotenv.config();

const run = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/transport_company_db';
    await mongoose.connect(mongoUri);
    console.log('[Corridor Rates] Connected to MongoDB...');

    // Drop old index on destination if exists
    try {
      await Rate.collection.dropIndex('destination_1');
      console.log('[Corridor Rates] Dropped old destination_1 unique index.');
    } catch (e) {
      // index might not exist or already dropped
    }

    const branches = await Branch.find();
    const branchMap = {};
    for (const b of branches) {
      branchMap[b.city] = b._id;
    }

    const mumbai = branchMap['Mumbai'];
    const delhi = branchMap['Delhi'];
    const bangalore = branchMap['Bengaluru'];
    const chennai = branchMap['Chennai'];
    const kolkata = branchMap['Kolkata'];

    if (!mumbai || !delhi || !bangalore || !chennai || !kolkata) {
      console.error('[Corridor Rates] Missing some branch cities. Aborting.');
      process.exit(1);
    }

    // Corridor definitions: [OriginCity, DestCity, RatePerM3, TransitHours, Description]
    const corridors = [
      // From Mumbai (Western Gateway)
      { origin: mumbai, destination: delhi, ratePerCubicMeter: 48, estimatedTransitHours: 32, description: 'Western-Northern Trunk Corridor Express (~1,400 km)' },
      { origin: mumbai, destination: bangalore, ratePerCubicMeter: 42, estimatedTransitHours: 22, description: 'Western-Southern Highway Corridor (~1,000 km)' },
      { origin: mumbai, destination: chennai, ratePerCubicMeter: 55, estimatedTransitHours: 28, description: 'Coastal-Transpeninsular Freight Expressway (~1,330 km)' },
      { origin: mumbai, destination: kolkata, ratePerCubicMeter: 65, estimatedTransitHours: 42, description: 'Trans-India East-West Freight Corridor (~1,900 km)' },

      // From Bengaluru (Southern Hub) - Notice Bengaluru -> Chennai is only 7 hrs & ₹28!
      { origin: bangalore, destination: chennai, ratePerCubicMeter: 28, estimatedTransitHours: 7, description: 'Bengaluru-Chennai Expressway Rapid Corridor (~350 km)' },
      { origin: bangalore, destination: mumbai, ratePerCubicMeter: 42, estimatedTransitHours: 22, description: 'Southern-Western Return Trunk Route (~1,000 km)' },
      { origin: bangalore, destination: delhi, ratePerCubicMeter: 68, estimatedTransitHours: 46, description: 'Trans-National South-North Express Freight (~2,150 km)' },
      { origin: bangalore, destination: kolkata, ratePerCubicMeter: 62, estimatedTransitHours: 38, description: 'South-Eastern Coastal Industrial Corridor (~1,850 km)' },

      // From Chennai (Southern Port Gateway)
      { origin: chennai, destination: bangalore, ratePerCubicMeter: 28, estimatedTransitHours: 7, description: 'Chennai-Bengaluru Express Return Corridor (~350 km)' },
      { origin: chennai, destination: mumbai, ratePerCubicMeter: 55, estimatedTransitHours: 28, description: 'Chennai Port to Mumbai Gateway Corridor (~1,330 km)' },
      { origin: chennai, destination: delhi, ratePerCubicMeter: 70, estimatedTransitHours: 48, description: 'Grand South-North Port-to-Capital Trunk (~2,200 km)' },
      { origin: chennai, destination: kolkata, ratePerCubicMeter: 58, estimatedTransitHours: 36, description: 'East Coast Highway Port Corridor (~1,650 km)' },

      // From Delhi (Northern Terminal)
      { origin: delhi, destination: mumbai, ratePerCubicMeter: 48, estimatedTransitHours: 32, description: 'Northern-Western Return Trunk Line (~1,400 km)' },
      { origin: delhi, destination: bangalore, ratePerCubicMeter: 68, estimatedTransitHours: 46, description: 'North-South Heavy Industrial Trunk (~2,150 km)' },
      { origin: delhi, destination: chennai, ratePerCubicMeter: 70, estimatedTransitHours: 48, description: 'Northern Capital to Chennai Port Highway (~2,200 km)' },
      { origin: delhi, destination: kolkata, ratePerCubicMeter: 52, estimatedTransitHours: 34, description: 'Grand Trunk Eastern Expressway (~1,500 km)' },

      // From Kolkata (Eastern Gateway)
      { origin: kolkata, destination: mumbai, ratePerCubicMeter: 65, estimatedTransitHours: 42, description: 'Eastern Gateway to Mumbai Trunk Corridor (~1,900 km)' },
      { origin: kolkata, destination: delhi, ratePerCubicMeter: 52, estimatedTransitHours: 34, description: 'Eastern to Capital Grand Trunk Return (~1,500 km)' },
      { origin: kolkata, destination: bangalore, ratePerCubicMeter: 62, estimatedTransitHours: 38, description: 'Eastern to Southern Tech Corridor (~1,850 km)' },
      { origin: kolkata, destination: chennai, ratePerCubicMeter: 58, estimatedTransitHours: 36, description: 'Eastern Maritime to Chennai Port Corridor (~1,650 km)' },
    ];

    // Clear existing rates and insert corridor rates
    await Rate.deleteMany({});
    await Rate.insertMany(corridors);

    console.log(`[Corridor Rates] Successfully inserted ${corridors.length} origin-to-destination corridor rates!`);
    process.exit(0);
  } catch (err) {
    console.error('[Corridor Rates Error]', err);
    process.exit(1);
  }
};

run();
