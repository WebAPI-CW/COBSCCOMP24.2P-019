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
import dotenv   from 'dotenv';
import bcrypt   from 'bcryptjs';

import Province     from '../src/models/Province.js';
import District     from '../src/models/District.js';
import PoliceStation from '../src/models/PoliceStation.js';
import User         from '../src/models/User.js';
import TukTuk       from '../src/models/TukTuk.js';
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
  { name: 'Western',       code: 'WP'  },
  { name: 'Central',       code: 'CP'  },
  { name: 'Southern',      code: 'SP'  },
  { name: 'Northern',      code: 'NP'  },
  { name: 'Eastern',       code: 'EP'  },
  { name: 'North Western', code: 'NWP' },
  { name: 'North Central', code: 'NCP' },
  { name: 'Uva',           code: 'UP'  },
  { name: 'Sabaragamuwa',  code: 'SGP' },
];

const districts = [
  { name: 'Colombo',      code: 'COL', provinceName: 'Western'       },
  { name: 'Gampaha',      code: 'GAM', provinceName: 'Western'       },
  { name: 'Kalutara',     code: 'KAL', provinceName: 'Western'       },
  { name: 'Kandy',        code: 'KAN', provinceName: 'Central'       },
  { name: 'Matale',       code: 'MAT', provinceName: 'Central'       },
  { name: 'Nuwara Eliya', code: 'NUW', provinceName: 'Central'       },
  { name: 'Galle',        code: 'GAL', provinceName: 'Southern'      },
  { name: 'Matara',       code: 'MTA', provinceName: 'Southern'      },
  { name: 'Hambantota',   code: 'HAM', provinceName: 'Southern'      },
  { name: 'Jaffna',       code: 'JAF', provinceName: 'Northern'      },
  { name: 'Kilinochchi',  code: 'KIL', provinceName: 'Northern'      },
  { name: 'Mannar',       code: 'MAN', provinceName: 'Northern'      },
  { name: 'Vavuniya',     code: 'VAV', provinceName: 'Northern'      },
  { name: 'Mullaitivu',   code: 'MUL', provinceName: 'Northern'      },
  { name: 'Batticaloa',   code: 'BAT', provinceName: 'Eastern'       },
  { name: 'Ampara',       code: 'AMP', provinceName: 'Eastern'       },
  { name: 'Trincomalee',  code: 'TRI', provinceName: 'Eastern'       },
  { name: 'Kurunegala',   code: 'KUR', provinceName: 'North Western' },
  { name: 'Puttalam',     code: 'PUT', provinceName: 'North Western' },
  { name: 'Anuradhapura', code: 'ANU', provinceName: 'North Central' },
  { name: 'Polonnaruwa',  code: 'POL', provinceName: 'North Central' },
  { name: 'Badulla',      code: 'BAD', provinceName: 'Uva'           },
  { name: 'Monaragala',   code: 'MON', provinceName: 'Uva'           },
  { name: 'Ratnapura',    code: 'RAT', provinceName: 'Sabaragamuwa'  },
  { name: 'Kegalle',      code: 'KEG', provinceName: 'Sabaragamuwa'  },
];

const stationsData = [
  { name: 'Colombo Fort Police Station',   code: 'ST001', districtName: 'Colombo'      },
  { name: 'Nugegoda Police Station',        code: 'ST002', districtName: 'Colombo'      },
  { name: 'Dehiwala Police Station',        code: 'ST003', districtName: 'Colombo'      },
  { name: 'Negombo Police Station',         code: 'ST004', districtName: 'Gampaha'      },
  { name: 'Gampaha Police Station',         code: 'ST005', districtName: 'Gampaha'      },
  { name: 'Kalutara Police Station',        code: 'ST006', districtName: 'Kalutara'     },
  { name: 'Kandy Police Station',           code: 'ST007', districtName: 'Kandy'        },
  { name: 'Peradeniya Police Station',      code: 'ST008', districtName: 'Kandy'        },
  { name: 'Matale Police Station',          code: 'ST009', districtName: 'Matale'       },
  { name: 'Nuwara Eliya Police Station',    code: 'ST010', districtName: 'Nuwara Eliya' },
  { name: 'Galle Police Station',           code: 'ST011', districtName: 'Galle'        },
  { name: 'Matara Police Station',          code: 'ST012', districtName: 'Matara'       },
  { name: 'Hambantota Police Station',      code: 'ST013', districtName: 'Hambantota'   },
  { name: 'Jaffna Police Station',          code: 'ST014', districtName: 'Jaffna'       },
  { name: 'Vavuniya Police Station',        code: 'ST015', districtName: 'Vavuniya'     },
  { name: 'Batticaloa Police Station',      code: 'ST016', districtName: 'Batticaloa'   },
  { name: 'Trincomalee Police Station',     code: 'ST017', districtName: 'Trincomalee'  },
  { name: 'Kurunegala Police Station',      code: 'ST018', districtName: 'Kurunegala'   },
  { name: 'Puttalam Police Station',        code: 'ST019', districtName: 'Puttalam'     },
  { name: 'Anuradhapura Police Station',    code: 'ST020', districtName: 'Anuradhapura' },
  { name: 'Polonnaruwa Police Station',     code: 'ST021', districtName: 'Polonnaruwa'  },
  { name: 'Badulla Police Station',         code: 'ST022', districtName: 'Badulla'      },
  { name: 'Ratnapura Police Station',       code: 'ST023', districtName: 'Ratnapura'    },
  { name: 'Kegalle Police Station',         code: 'ST024', districtName: 'Kegalle'      },
  { name: 'Ampara Police Station',          code: 'ST025', districtName: 'Ampara'       },
  { name: 'Kilinochchi Police Station',     code: 'ST026', districtName: 'Kilinochchi'  },
  { name: 'Mannar Police Station',          code: 'ST027', districtName: 'Mannar'       },
  { name: 'Mullaitivu Police Station',      code: 'ST028', districtName: 'Mullaitivu'   },
  { name: 'Monaragala Police Station',      code: 'ST029', districtName: 'Monaragala'   },
];

const driverNames = [
  'Kamal Perera',        'Nimal Silva',         'Sunil Fernando',      'Asanka Jayawardena',
  'Chaminda Rathnayake', 'Pradeep Kumara',       'Roshan Bandara',      'Thilak Wickrama',
  'Nuwan Senanayake',    'Lahiru Madhushanka',   'Kasun Pathirana',     'Dimuth Kariyawasam',
  'Buddhika Rajapaksa',  'Chatura Dissanayake',  'Harsha Gunasekara',   'Janaka Munasinghe',
  'Kelum Samaraweera',   'Lasith Mallawarachchi','Mahesh Thilakaratne', 'Nalin Hewage',
  'Osanda Tennakoon',    'Prabath Jayasuriya',   'Rangana Herath',      'Sampath Pushpakumara',
  'Tharaka Koswatta',    'Upul Chandana',        'Vimukthi Alwis',      'Wimal Gunawardena',
  'Yasas Rodrigo',       'Zack Mendis',          'Amal Cooray',         'Bimal Pieris',
  'Chiran Soyza',        'Danushka Gunathilaka', 'Eranga Jayawickrama', 'Faisal Rasheed',
  'Gehan Mendis',        'Hasitha Boyagoda',     'Isuru Udana',         'Jehan Mubarak',
];

const randomNIC   = (i) => `${randomInt(1970,2000)}${String(randomInt(1,366)).padStart(3,'0')}${String(i).padStart(4,'0')}V`;
const randomPhone = ()  => `07${randomInt(0,9)}${randomInt(1000000,9999999)}`;

// ── Working-Hour Windows (Sri Lanka Time → UTC offsets) ───────────────────────
// All windows expressed as UTC timestamps.
// SLT = UTC + 5h30m  →  UTC = SLT - 5h30m = SLT - 330min

const SLT_OFFSET_MS = 330 * 60 * 1000;

/**
 * Build a UTC Date from a SLT date string and SLT time components.
 * @param {string} dateStr  e.g. '2026-04-16'
 * @param {number} h        SLT hour
 * @param {number} m        SLT minute (default 0)
 */
const sltToUTC = (dateStr, h, m = 0) =>
  new Date(new Date(`${dateStr}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00Z`).getTime() - SLT_OFFSET_MS);

/**
 * Each entry = one simulator session [startUTC, endUTC].
 * Apr 16–24: 4–5 short sessions per day (~3 min each).
 * Apr 25–27: more and longer sessions (5 min each) — heavier testing phase.
 * Total pings: 200 tuktuks × ~430 timestamps = ~86,000 pings (~30 MB)
 */
const WORKING_WINDOWS = [
  // ── Apr 16 Wed — first day, 4 evening sessions ──
  [sltToUTC('2026-04-16', 18, 30), sltToUTC('2026-04-16', 18, 33)],
  [sltToUTC('2026-04-16', 19, 45), sltToUTC('2026-04-16', 19, 48)],
  [sltToUTC('2026-04-16', 21, 20), sltToUTC('2026-04-16', 21, 23)],
  [sltToUTC('2026-04-16', 23, 10), sltToUTC('2026-04-16', 23, 13)],

  // ── Apr 17 Thu — 6 sessions across the day ──
  [sltToUTC('2026-04-17',  5, 10), sltToUTC('2026-04-17',  5, 13)],   // PRE_DAWN
  [sltToUTC('2026-04-17',  6, 15), sltToUTC('2026-04-17',  6, 18)],
  [sltToUTC('2026-04-17',  8, 20), sltToUTC('2026-04-17',  8, 23)],
  [sltToUTC('2026-04-17', 13, 30), sltToUTC('2026-04-17', 13, 33)],
  [sltToUTC('2026-04-17', 17, 15), sltToUTC('2026-04-17', 17, 18)],
  [sltToUTC('2026-04-17', 22, 45), sltToUTC('2026-04-17', 22, 48)],

  // ── Apr 18 Fri — 4 sessions ──
  [sltToUTC('2026-04-18',  7,  0), sltToUTC('2026-04-18',  7,  3)],
  [sltToUTC('2026-04-18', 15, 30), sltToUTC('2026-04-18', 15, 33)],
  [sltToUTC('2026-04-18', 19, 45), sltToUTC('2026-04-18', 19, 48)],
  [sltToUTC('2026-04-18', 22, 10), sltToUTC('2026-04-18', 22, 13)],

  // ── Apr 19 Sat — 7 sessions (weekend spread) ──
  [sltToUTC('2026-04-19',  6, 30), sltToUTC('2026-04-19',  6, 33)],   // SATURDAY_MARKET
  [sltToUTC('2026-04-19',  9, 15), sltToUTC('2026-04-19',  9, 18)],
  [sltToUTC('2026-04-19', 11, 30), sltToUTC('2026-04-19', 11, 33)],
  [sltToUTC('2026-04-19', 14, 20), sltToUTC('2026-04-19', 14, 23)],
  [sltToUTC('2026-04-19', 17,  0), sltToUTC('2026-04-19', 17,  3)],
  [sltToUTC('2026-04-19', 20, 30), sltToUTC('2026-04-19', 20, 33)],
  [sltToUTC('2026-04-19', 22, 30), sltToUTC('2026-04-19', 22, 33)],   // LATE_NIGHT weekend

  // ── Apr 20 Sun — 5 sessions ──
  [sltToUTC('2026-04-20',  6,  0), sltToUTC('2026-04-20',  6,  3)],   // SUNDAY_RELIGIOUS
  [sltToUTC('2026-04-20', 10,  0), sltToUTC('2026-04-20', 10,  3)],
  [sltToUTC('2026-04-20', 12, 45), sltToUTC('2026-04-20', 12, 48)],
  [sltToUTC('2026-04-20', 15, 30), sltToUTC('2026-04-20', 15, 33)],
  [sltToUTC('2026-04-20', 19,  0), sltToUTC('2026-04-20', 19,  3)],

  // ── Apr 21 Mon — 4 evening sessions ──
  [sltToUTC('2026-04-21', 18, 30), sltToUTC('2026-04-21', 18, 33)],
  [sltToUTC('2026-04-21', 20,  0), sltToUTC('2026-04-21', 20,  3)],
  [sltToUTC('2026-04-21', 22, 30), sltToUTC('2026-04-21', 22, 33)],
  [sltToUTC('2026-04-22',  0, 10), sltToUTC('2026-04-22',  0, 13)],

  // ── Apr 22 Tue — 5 sessions ──
  [sltToUTC('2026-04-22',  6, 30), sltToUTC('2026-04-22',  6, 33)],
  [sltToUTC('2026-04-22',  8, 45), sltToUTC('2026-04-22',  8, 48)],
  [sltToUTC('2026-04-22', 12, 15), sltToUTC('2026-04-22', 12, 18)],   // LUNCH weekday
  [sltToUTC('2026-04-22', 14,  0), sltToUTC('2026-04-22', 14,  3)],
  [sltToUTC('2026-04-22', 17, 30), sltToUTC('2026-04-22', 17, 33)],
  [sltToUTC('2026-04-22', 23, 20), sltToUTC('2026-04-22', 23, 23)],

  // ── Apr 23 Wed — 4 sessions ──
  [sltToUTC('2026-04-23', 18, 15), sltToUTC('2026-04-23', 18, 18)],
  [sltToUTC('2026-04-23', 20, 30), sltToUTC('2026-04-23', 20, 33)],
  [sltToUTC('2026-04-23', 22,  0), sltToUTC('2026-04-23', 22,  3)],
  [sltToUTC('2026-04-23', 23, 45), sltToUTC('2026-04-23', 23, 48)],

  // ── Apr 24 Thu — 5 sessions ──
  [sltToUTC('2026-04-24',  6, 20), sltToUTC('2026-04-24',  6, 23)],
  [sltToUTC('2026-04-24',  9,  0), sltToUTC('2026-04-24',  9,  3)],
  [sltToUTC('2026-04-24', 13, 15), sltToUTC('2026-04-24', 13, 18)],
  [sltToUTC('2026-04-24', 14, 40), sltToUTC('2026-04-24', 14, 43)],   // POST_SCHOOL weekday
  [sltToUTC('2026-04-24', 17,  0), sltToUTC('2026-04-24', 17,  3)],
  [sltToUTC('2026-04-24', 22, 30), sltToUTC('2026-04-24', 22, 33)],

  // ── Apr 25 Fri — heavier testing, 7 sessions of 5 min ──
  [sltToUTC('2026-04-25', 15,  0), sltToUTC('2026-04-25', 15,  5)],
  [sltToUTC('2026-04-25', 16, 30), sltToUTC('2026-04-25', 16, 35)],
  [sltToUTC('2026-04-25', 18,  0), sltToUTC('2026-04-25', 18,  5)],
  [sltToUTC('2026-04-25', 19, 15), sltToUTC('2026-04-25', 19, 20)],
  [sltToUTC('2026-04-25', 20, 30), sltToUTC('2026-04-25', 20, 35)],
  [sltToUTC('2026-04-25', 22,  0), sltToUTC('2026-04-25', 22,  5)],
  [sltToUTC('2026-04-25', 23, 30), sltToUTC('2026-04-25', 23, 35)],

  // ── Apr 26 Sat — most active day, 8 sessions of 5 min ──
  [sltToUTC('2026-04-26',  9,  0), sltToUTC('2026-04-26',  9,  5)],
  [sltToUTC('2026-04-26', 10, 30), sltToUTC('2026-04-26', 10, 35)],
  [sltToUTC('2026-04-26', 12,  0), sltToUTC('2026-04-26', 12,  5)],
  [sltToUTC('2026-04-26', 13, 30), sltToUTC('2026-04-26', 13, 35)],
  [sltToUTC('2026-04-26', 15,  0), sltToUTC('2026-04-26', 15,  5)],
  [sltToUTC('2026-04-26', 16, 30), sltToUTC('2026-04-26', 16, 35)],
  [sltToUTC('2026-04-26', 18, 30), sltToUTC('2026-04-26', 18, 35)],
  [sltToUTC('2026-04-26', 20,  0), sltToUTC('2026-04-26', 20,  5)],

  // ── Apr 27 Sun — 5 sessions, stopped at lunchtime ──
  [sltToUTC('2026-04-27', 10,  0), sltToUTC('2026-04-27', 10,  4)],
  [sltToUTC('2026-04-27', 11,  0), sltToUTC('2026-04-27', 11,  4)],
  [sltToUTC('2026-04-27', 12,  0), sltToUTC('2026-04-27', 12,  4)],
  [sltToUTC('2026-04-27', 13,  0), sltToUTC('2026-04-27', 13,  4)],
  [sltToUTC('2026-04-27', 13, 30), sltToUTC('2026-04-27', 13, 34)],

  // ── Apr 28 Mon — 6 sessions (demo day) ──
  [sltToUTC('2026-04-28',  7, 30), sltToUTC('2026-04-28',  7, 35)],
  [sltToUTC('2026-04-28',  9,  0), sltToUTC('2026-04-28',  9,  5)],
  [sltToUTC('2026-04-28', 12,  0), sltToUTC('2026-04-28', 12,  5)],
  [sltToUTC('2026-04-28', 14, 30), sltToUTC('2026-04-28', 14, 35)],
  [sltToUTC('2026-04-28', 17,  0), sltToUTC('2026-04-28', 17,  5)],
  [sltToUTC('2026-04-28', 20,  0), sltToUTC('2026-04-28', 20,  5)],
];

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
        name:      d.name,
        code:      d.code,
        province:  createdProvinces.find(p => p.name === d.provinceName)._id,
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
    await User.insertMany([
      { name: 'HQ Administrator',   email: 'admin@slpolice.lk',       password: await bcrypt.hash('Admin@1234',       salt), role: 'HQ_ADMIN',   createdAt: T0, updatedAt: T0 },
      { name: 'Provincial Commander',email: 'provincial@slpolice.lk', password: await bcrypt.hash('Provincial@1234',  salt), role: 'PROVINCIAL', createdAt: T0, updatedAt: T0 },
      { name: 'Station OIC',         email: 'station@slpolice.lk',    password: await bcrypt.hash('Station@1234',     salt), role: 'STATION',     createdAt: T0, updatedAt: T0 },
      { name: 'Device Unit 001',     email: 'device001@slpolice.lk',  password: await bcrypt.hash('Device@1234',      salt), role: 'DEVICE', registrationNumber: 'WP-0001', createdAt: T0, updatedAt: T0 },
    ]);
    console.log('✔  4 demo users seeded (HQ_ADMIN, PROVINCIAL, STATION, DEVICE)');

    // 6. TukTuks
    const createdTukTuks = await TukTuk.insertMany(
      Array.from({ length: 200 }, (_, i) => {
        const station  = createdStations[i % createdStations.length];
        const district = createdDistricts.find(d => d._id.toString() === station.district.toString());
        const province = createdProvinces.find(p => p._id.toString() === station.province.toString());
        return {
          registrationNumber: `${province.code}-${String(i + 1).padStart(4, '0')}`,
          deviceId:           `DEV-${String(i + 1).padStart(4, '0')}`,
          driverName:         driverNames[i % driverNames.length],
          driverNIC:          randomNIC(i + 1),
          driverContact:      randomPhone(),
          province:           province._id,
          district:           district._id,
          station:            station._id,
          isActive:           true,
          createdAt:          T0,
          updatedAt:          T0,
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

  let batch      = [];
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
          tuktuk:     ts.tuktuk,
          timestamp:  new Date(cursor),
          lat:        ts.lat,
          lng:        ts.lng,
          anomalies:  ts.anomalies,
          elapsedMin: 0.5,  // 30 seconds — matches simulate.js exactly
          state:      ts.state,
        });
        ts.lat   = newLat;
        ts.lng   = newLng;
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