/**
 * data/seed.js
 *
 * Initializes the database. Run once on first setup.
 * Usage: npm run seed
 *
 * Part 1 — Master Data: always runs (provinces, districts, stations, users, tuktuks)
 * Part 2 — Location Data: comment out seedHistoricalPings() after the first run
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import Province from '../src/models/Province.js';
import District from '../src/models/District.js';
import PoliceStation from '../src/models/PoliceStation.js';
import User from '../src/models/User.js';
import TukTuk from '../src/models/TukTuk.js';
import LocationPing from '../src/models/LocationPing.js';

import {
  randomBetween, randomInt, toSLT,
  assignAnomalies, generatePing, estimateStorageMB,
} from './simulationHelper.js';

dotenv.config();

if (!process.env.MONGO_URI) {
  console.error('ERROR: MONGO_URI is not set in .env');
  process.exit(1);
}

// ── Sri Lanka bounding box ────────────────────────────────────────────────────
const randomSLLatLng = () => ({
  lat: randomBetween(5.9, 9.9),
  lng: randomBetween(79.7, 81.9),
});

// ── Master Data ───────────────────────────────────────────────────────────────

const provinces = [
  { name: 'Western', code: 'WP' },
  { name: 'Central', code: 'CP' },
  { name: 'Southern', code: 'SP' },
  { name: 'Northern', code: 'NP' },
  { name: 'Eastern', code: 'EP' },
  { name: 'North Western', code: 'NWP' },
  { name: 'North Central', code: 'NCP' },
  { name: 'Uva', code: 'UP' },
  { name: 'Sabaragamuwa', code: 'SGP' },
];

const districts = [
  { name: 'Colombo', code: 'COL', provinceName: 'Western' },
  { name: 'Gampaha', code: 'GAM', provinceName: 'Western' },
  { name: 'Kalutara', code: 'KAL', provinceName: 'Western' },
  { name: 'Kandy', code: 'KAN', provinceName: 'Central' },
  { name: 'Matale', code: 'MAT', provinceName: 'Central' },
  { name: 'Nuwara Eliya', code: 'NUW', provinceName: 'Central' },
  { name: 'Galle', code: 'GAL', provinceName: 'Southern' },
  { name: 'Matara', code: 'MTA', provinceName: 'Southern' },
  { name: 'Hambantota', code: 'HAM', provinceName: 'Southern' },
  { name: 'Jaffna', code: 'JAF', provinceName: 'Northern' },
  { name: 'Kilinochchi', code: 'KIL', provinceName: 'Northern' },
  { name: 'Mannar', code: 'MAN', provinceName: 'Northern' },
  { name: 'Vavuniya', code: 'VAV', provinceName: 'Northern' },
  { name: 'Mullaitivu', code: 'MUL', provinceName: 'Northern' },
  { name: 'Batticaloa', code: 'BAT', provinceName: 'Eastern' },
  { name: 'Ampara', code: 'AMP', provinceName: 'Eastern' },
  { name: 'Trincomalee', code: 'TRI', provinceName: 'Eastern' },
  { name: 'Kurunegala', code: 'KUR', provinceName: 'North Western' },
  { name: 'Puttalam', code: 'PUT', provinceName: 'North Western' },
  { name: 'Anuradhapura', code: 'ANU', provinceName: 'North Central' },
  { name: 'Polonnaruwa', code: 'POL', provinceName: 'North Central' },
  { name: 'Badulla', code: 'BAD', provinceName: 'Uva' },
  { name: 'Monaragala', code: 'MON', provinceName: 'Uva' },
  { name: 'Ratnapura', code: 'RAT', provinceName: 'Sabaragamuwa' },
  { name: 'Kegalle', code: 'KEG', provinceName: 'Sabaragamuwa' },
];

const stationsData = [
  { name: 'Colombo Fort Police Station', code: 'ST001', districtName: 'Colombo' },
  { name: 'Nugegoda Police Station', code: 'ST002', districtName: 'Colombo' },
  { name: 'Dehiwala Police Station', code: 'ST003', districtName: 'Colombo' },
  { name: 'Negombo Police Station', code: 'ST004', districtName: 'Gampaha' },
  { name: 'Gampaha Police Station', code: 'ST005', districtName: 'Gampaha' },
  { name: 'Kalutara Police Station', code: 'ST006', districtName: 'Kalutara' },
  { name: 'Kandy Police Station', code: 'ST007', districtName: 'Kandy' },
  { name: 'Peradeniya Police Station', code: 'ST008', districtName: 'Kandy' },
  { name: 'Matale Police Station', code: 'ST009', districtName: 'Matale' },
  { name: 'Nuwara Eliya Police Station', code: 'ST010', districtName: 'Nuwara Eliya' },
  { name: 'Galle Police Station', code: 'ST011', districtName: 'Galle' },
  { name: 'Matara Police Station', code: 'ST012', districtName: 'Matara' },
  { name: 'Hambantota Police Station', code: 'ST013', districtName: 'Hambantota' },
  { name: 'Jaffna Police Station', code: 'ST014', districtName: 'Jaffna' },
  { name: 'Vavuniya Police Station', code: 'ST015', districtName: 'Vavuniya' },
  { name: 'Batticaloa Police Station', code: 'ST016', districtName: 'Batticaloa' },
  { name: 'Trincomalee Police Station', code: 'ST017', districtName: 'Trincomalee' },
  { name: 'Kurunegala Police Station', code: 'ST018', districtName: 'Kurunegala' },
  { name: 'Puttalam Police Station', code: 'ST019', districtName: 'Puttalam' },
  { name: 'Anuradhapura Police Station', code: 'ST020', districtName: 'Anuradhapura' },
  { name: 'Polonnaruwa Police Station', code: 'ST021', districtName: 'Polonnaruwa' },
  { name: 'Badulla Police Station', code: 'ST022', districtName: 'Badulla' },
  { name: 'Ratnapura Police Station', code: 'ST023', districtName: 'Ratnapura' },
  { name: 'Kegalle Police Station', code: 'ST024', districtName: 'Kegalle' },
  { name: 'Ampara Police Station', code: 'ST025', districtName: 'Ampara' },
  { name: 'Kilinochchi Police Station', code: 'ST026', districtName: 'Kilinochchi' },
  { name: 'Mannar Police Station', code: 'ST027', districtName: 'Mannar' },
  { name: 'Mullaitivu Police Station', code: 'ST028', districtName: 'Mullaitivu' },
  { name: 'Monaragala Police Station', code: 'ST029', districtName: 'Monaragala' },
];

const driverNames = [
  'Kamal Perera', 'Nimal Silva', 'Sunil Fernando', 'Asanka Jayawardena',
  'Chaminda Rathnayake', 'Pradeep Kumara', 'Roshan Bandara', 'Thilak Wickrama',
  'Nuwan Senanayake', 'Lahiru Madhushanka', 'Kasun Pathirana', 'Dimuth Kariyawasam',
  'Buddhika Rajapaksa', 'Chatura Dissanayake', 'Harsha Gunasekara', 'Janaka Munasinghe',
  'Kelum Samaraweera', 'Lasith Mallawarachchi', 'Mahesh Thilakaratne', 'Nalin Hewage',
  'Osanda Tennakoon', 'Prabath Jayasuriya', 'Rangana Herath', 'Sampath Pushpakumara',
  'Tharaka Koswatta', 'Upul Chandana', 'Vimukthi Alwis', 'Wimal Gunawardena',
  'Yasas Rodrigo', 'Zack Mendis', 'Amal Cooray', 'Bimal Pieris',
  'Chiran Soyza', 'Danushka Gunathilaka', 'Eranga Jayawickrama', 'Faisal Rasheed',
  'Gehan Mendis', 'Hasitha Boyagoda', 'Isuru Udana', 'Jehan Mubarak',
];

const randomNIC = (i) => `${randomInt(1970, 2000)}${String(randomInt(1, 366)).padStart(3, '0')}${String(i).padStart(4, '0')}V`;
const randomPhone = () => `07${randomInt(0, 9)}${randomInt(1000000, 9999999)}`;

// ── Working-Hour Windows (Sri Lanka Time → UTC offsets) ───────────────────────
// All windows expressed as UTC timestamps.
// SLT = UTC + 5h30m  →  UTC = SLT - 5h30m = SLT - 330min

const SLT_OFFSET_MS = 330 * 60 * 1000;



// ── Main Seed Function ────────────────────────────────────────────────────────

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✔  MongoDB connected');

    // 1. Drop all collections
    await Promise.all([
      Province.deleteMany(),
      District.deleteMany(),
      PoliceStation.deleteMany(),
      User.deleteMany(),
      TukTuk.deleteMany(),
      LocationPing.deleteMany(),
    ]);
    console.log('✔  Existing data cleared');

    const T0 = new Date('2026-04-16T10:00:00Z'); // project start timestamp

    // 2. Provinces
    const createdProvinces = await Province.insertMany(
      provinces.map(p => ({ ...p, createdAt: T0, updatedAt: T0 }))
    );
    console.log(`✔  ${createdProvinces.length} provinces seeded`);

    // 3. Districts
    const createdDistricts = await District.insertMany(
      districts.map(d => ({
        name: d.name,
        code: d.code,
        province: createdProvinces.find(p => p.name === d.provinceName)._id,
        createdAt: T0,
        updatedAt: T0,
      }))
    );
    console.log(`✔  ${createdDistricts.length} districts seeded`);

    // 4. Stations
    const createdStations = await PoliceStation.insertMany(
      stationsData.map(s => {
        const district = createdDistricts.find(d => d.name === s.districtName);
        const province = createdProvinces.find(p => p._id.toString() === district.province.toString());
        return { name: s.name, code: s.code, district: district._id, province: province._id, createdAt: T0, updatedAt: T0 };
      })
    );
    console.log(`✔  ${createdStations.length} stations seeded`);

    // 5. Users (hash passwords manually — insertMany bypasses pre-save hooks)
    const salt = await bcrypt.genSalt(10);
    const wpProvince = createdProvinces.find(p => p.code === 'WP');
    const st001Station = createdStations.find(s => s.code === 'ST001');
    const colDistrict = createdDistricts.find(d => d.code === 'COL');
    await User.insertMany([
      { name: 'HQ Administrator', email: 'admin@slpolice.lk', password: await bcrypt.hash('Admin@1234', salt), role: 'HQ_ADMIN', createdAt: T0, updatedAt: T0 },
      { name: 'Provincial Commander', email: 'provincial@slpolice.lk', password: await bcrypt.hash('Provincial@1234', salt), role: 'PROVINCIAL', province: wpProvince._id, createdAt: T0, updatedAt: T0 },
      { name: 'Station OIC', email: 'station@slpolice.lk', password: await bcrypt.hash('Station@1234', salt), role: 'STATION', province: wpProvince._id, district: colDistrict._id, station: st001Station._id, createdAt: T0, updatedAt: T0 },
      { name: 'Device Unit 001', email: 'device001@slpolice.lk', password: await bcrypt.hash('Device@1234', salt), role: 'DEVICE', registrationNumber: 'WP-0001', createdAt: T0, updatedAt: T0 },
    ]);
    console.log('✔  4 demo users seeded (HQ_ADMIN, PROVINCIAL[WP], STATION[ST001/COL/WP], DEVICE)');

    // 6. TukTuks
    const createdTukTuks = await TukTuk.insertMany(
      Array.from({ length: 200 }, (_, i) => {
        const station = createdStations[i % createdStations.length];
        const district = createdDistricts.find(d => d._id.toString() === station.district.toString());
        const province = createdProvinces.find(p => p._id.toString() === station.province.toString());
        return {
          registrationNumber: `${province.code}-${String(i + 1).padStart(4, '0')}`,
          deviceId: `DEV-${String(i + 1).padStart(4, '0')}`,
          driverName: driverNames[i % driverNames.length],
          driverNIC: randomNIC(i + 1),
          driverContact: randomPhone(),
          province: province._id,
          district: district._id,
          station: station._id,
          isActive: true,
          createdAt: T0,
          updatedAt: T0,
        };
      })
    );
    console.log(`✔  ${createdTukTuks.length} tuktuks seeded`);

    // ── Part 2: Location data — comment out after first run ──────────────────
    await seedHistoricalPings(createdTukTuks);

    // ── Completion ────────────────────────────────────────────────────────────
    console.log('\n--- TUKPATROL INITIALIZATION COMPLETE ---');
    console.log(`Provinces    : ${createdProvinces.length}`);
    console.log(`Districts    : ${createdDistricts.length}`);
    console.log(`Stations     : ${createdStations.length}`);
    console.log(`Users        : 4`);
    console.log(`TukTuks      : ${createdTukTuks.length}`);
    console.log('Database ready. Run npm run dev to start the system.');
    console.log('Demo credentials:');
    console.log('  admin@slpolice.lk       / Admin@1234       (HQ_ADMIN)');
    console.log('  provincial@slpolice.lk  / Provincial@1234  (PROVINCIAL)');
    console.log('  station@slpolice.lk     / Station@1234     (STATION)');
    console.log('  device001@slpolice.lk   / Device@1234      (DEVICE)');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
};

// ── Historical Location Data ──────────────────────────────────────────────────
// Each WORKING_WINDOW is a single simulator session.
// Pings at 30-second intervals — identical to simulate.js.
// Comment out the call in seedDB() after the first run.

const seedHistoricalPings = async (tuktuks) => {
  const tuktukStates = tuktuks.map(t => {
    const { lat, lng } = randomSLLatLng();
    return { tuktuk: t, anomalies: assignAnomalies(t.deviceId), lat, lng, state: {} };
  });

  let batch = [];
  let totalPings = 0;

  const flushBatch = async () => {
    if (batch.length === 0) return;
    await LocationPing.insertMany(batch);
    totalPings += batch.length;
    batch = [];
  };

  process.stdout.write('  Initializing location data');

  // Each window is one session — advance cursor 30s per tick
  for (const [sessionStart, sessionEnd] of WORKING_WINDOWS) {
    let cursor = new Date(sessionStart);
    while (cursor < sessionEnd) {
      for (const ts of tuktukStates) {
        const { ping, newLat, newLng, newState } = generatePing({
          tuktuk: ts.tuktuk,
          timestamp: new Date(cursor),
          lat: ts.lat,
          lng: ts.lng,
          anomalies: ts.anomalies,
          elapsedMin: 0.5,  // 30 seconds — matches simulate.js exactly
          state: ts.state,
        });
        ts.lat = newLat;
        ts.lng = newLng;
        ts.state = newState;
        batch.push(ping);
      }
      if (batch.length >= 2000) {
        await flushBatch();
        process.stdout.write('.');
      }
      cursor = new Date(cursor.getTime() + 30 * 1000);
    }
  }

  await flushBatch();
  process.stdout.write(` done\n`);
};

seedDB();