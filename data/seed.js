import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Province from '../src/models/Province.js';
import District from '../src/models/District.js';
import PoliceStation from '../src/models/PoliceStation.js';
import User from '../src/models/User.js';
import TukTuk from '../src/models/TukTuk.js';
import LocationPing from '../src/models/LocationPing.js';

dotenv.config();

// --- MASTER DATA ---

const provinces = [
  { name: 'Western', code: 'WP' },
  { name: 'Central', code: 'CP' },
  { name: 'Southern', code: 'SP' },
  { name: 'Northern', code: 'NP' },
  { name: 'Eastern', code: 'EP' },
  { name: 'North Western', code: 'NWP' },
  { name: 'North Central', code: 'NCP' },
  { name: 'Uva', code: 'UP' },
  { name: 'Sabaragamuwa', code: 'SGP' }
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
  { name: 'Kegalle', code: 'KEG', provinceName: 'Sabaragamuwa' }
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
  { name: 'Monaragala Police Station', code: 'ST029', districtName: 'Monaragala' }
];

// --- HELPER FUNCTIONS ---

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const randomInt = (min, max) => 
  Math.floor(Math.random() * (max - min + 1)) + min;

// Sri Lanka bounding box
const randomLatLng = () => ({
  latitude: randomBetween(5.9, 9.9),
  longitude: randomBetween(79.7, 81.9)
});

const randomNIC = (index) => {
  const year = randomInt(1970, 2000);
  const days = randomInt(1, 366);
  return `${year}${String(days).padStart(3, '0')}${String(index).padStart(4, '0')}V`;
};

const randomPhone = () => 
  `07${randomInt(0,9)}${randomInt(1000000, 9999999)}`;

const driverNames = [
  'Kamal Perera', 'Nimal Silva', 'Sunil Fernando', 'Asanka Jayawardena',
  'Chaminda Rathnayake', 'Pradeep Kumara', 'Roshan Bandara', 'Thilak Wickrama',
  'Nuwan Senanayake', 'Lahiru Madhushanka', 'Kasun Pathirana', 'Dimuth Kariyawasam',
  'Buddhika Rajapaksa', 'Chatura Dissanayake', 'Harsha Gunasekara',
  'Janaka Munasinghe', 'Kelum Samaraweera', 'Lasith Mallawarachchi',
  'Mahesh Thilakaratne', 'Nalin Hewage', 'Osanda Tennakoon', 'Prabath Jayasuriya',
  'Rangana Herath', 'Sampath Pushpakumara', 'Tharaka Koswatta',
  'Upul Chandana', 'Vimukthi Alwis', 'Wimal Gunawardena', 'Yasas Rodrigo',
  'Zack Mendis', 'Amal Cooray', 'Bimal Pieris', 'Chiran Soyza',
  'Danushka Gunathilaka', 'Eranga Jayawickrama', 'Faisal Rasheed',
  'Gehan Mendis', 'Hasitha Boyagoda', 'Isuru Udana', 'Jehan Mubarak'
];

// --- MAIN SEED FUNCTION ---

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // clear existing data
    await Promise.all([
      Province.deleteMany(),
      District.deleteMany(),
      PoliceStation.deleteMany(),
      User.deleteMany(),
      TukTuk.deleteMany(),
      LocationPing.deleteMany()
    ]);
    console.log('Existing data cleared');

    const universalDate = new Date('2026-04-16T10:00:00Z');

    // seed provinces
    const provinceDocs = provinces.map(p => ({
      ...p,
      createdAt: universalDate,
      updatedAt: universalDate
    }));
    const createdProvinces = await Province.insertMany(provinceDocs);
    console.log(`${createdProvinces.length} provinces seeded`);

    // seed districts
    const districtDocs = districts.map(d => ({
      name: d.name,
      code: d.code,
      province: createdProvinces.find(p => p.name === d.provinceName)._id,
      createdAt: universalDate,
      updatedAt: universalDate
    }));
    const createdDistricts = await District.insertMany(districtDocs);
    console.log(`${createdDistricts.length} districts seeded`);

    // seed stations
    const stationDocs = stationsData.map(s => {
      const district = createdDistricts.find(d => d.name === s.districtName);
      const province = createdProvinces.find(
        p => p._id.toString() === district.province.toString()
      );
      const stationDate = universalDate;
      return {
        name: s.name,
        code: s.code,
        district: district._id,
        province: province._id,
        createdAt: stationDate,
        updatedAt: stationDate
      };
    });
    const createdStations = await PoliceStation.insertMany(stationDocs);
    console.log(`${createdStations.length} stations seeded`);

    // seed users — manually hash passwords because insertMany bypasses pre-save hooks
    const salt = await bcrypt.genSalt(10);
    const userDate = universalDate;
    await User.insertMany([
      {
        name: 'HQ Administrator',
        email: 'admin@slpolice.lk',
        password: await bcrypt.hash('Admin@1234', salt),
        role: 'HQ_ADMIN',
        createdAt: userDate,
        updatedAt: userDate
      },
      {
        name: 'Provincial Commander',
        email: 'provincial@slpolice.lk',
        password: await bcrypt.hash('Provincial@1234', salt),
        role: 'PROVINCIAL',
        createdAt: userDate,
        updatedAt: userDate
      },
      {
        name: 'Station OIC',
        email: 'station@slpolice.lk',
        password: await bcrypt.hash('Station@1234', salt),
        role: 'STATION',
        createdAt: userDate,
        updatedAt: userDate
      },
      {
        name: 'Device Unit 001',
        email: 'device001@slpolice.lk',
        password: await bcrypt.hash('Device@1234', salt),
        role: 'DEVICE',
        createdAt: userDate,
        updatedAt: userDate
      }
    ]);
    console.log('Demo users (HQ_ADMIN, PROVINCIAL, STATION, DEVICE) seeded');

    // seed 200 tuktuks
    const tuktukDocs = Array.from({ length: 200 }, (_, i) => {
      const station = createdStations[i % createdStations.length];
      const district = createdDistricts.find(
        d => d._id.toString() === station.district.toString()
      );
      const province = createdProvinces.find(
        p => p._id.toString() === station.province.toString()
      );
      const tuktukDate = universalDate;
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
        createdAt: tuktukDate,
        updatedAt: tuktukDate
      };
    });
    const createdTukTuks = await TukTuk.insertMany(tuktukDocs);
    console.log(`${createdTukTuks.length} tuktuks seeded`);

    // ==========================================
    // SEED LOCATION PINGS (Realistic SL Patterns & Anomalies)
    // ==========================================
    // IMPORTANT — requires timestamps:true in LocationPing schema
    // 
    // PATTERNS:
    // - Night parking: isNight slots -> speed=0, fixed pos
    // - Rush hour: isRushHour slots -> speed 5-25 km/h
    // - Normal daytime: speed 25-45 km/h
    // - Daytime parking: 10% chance -> speed=0, fixed pos
    // - Speeding: 1% chance outside rush hour & night -> speed 65-80 km/h
    //
    // ANOMALIES:
    // 1. Night movement: 3% of tuktuks (move during night instead of parking)
    // 2. Ping gap: 1 per day per tuktuk (skips 6 consecutive slots)
    // 3. Stationary all day: 2% chance per day (broken down)
    // 4. Out-of-district jump: 1% of tuktuks, jumps on day 3
    // 5. Excessive idling: 5% chance per day, idles for 3 hours
    // 6. Erratic movement: 2% of tuktuks, weekend nights (days 3 & 4)

    const startDate = new Date('2026-04-16T00:00:00Z');
    const now = new Date();
    const days = 10;
    
    // Counters
    let totalPings = 0;
    let nightRunnerCount = 0;
    let jumpedCount = 0;
    let erraticCount = 0;
    let pingGapsTotal = 0;
    let stationaryDaysTotal = 0;
    let idlingDaysTotal = 0;
    let speedingPingsTotal = 0;
    let erraticPingsTotal = 0;
    let nightMovementPingsTotal = 0;

    // Build DAY_SCHEDULE (10 min intervals = 144 slots)
    const DAY_SCHEDULE = [];
    for (let minute = 0; minute < 1440; minute++) {
      if (minute % 10 === 0) {
        const hour = Math.floor(minute / 60);
        DAY_SCHEDULE.push({
          minuteOfDay: minute,
          isNight: hour >= 22 || hour < 5
        });
      }
    }

    const pingDocs = [];

    // NOTE: Limitations - In a real production system, each tuktuk device would have its own 
    // DEVICE user account. For this seeding script, all 200 tuktuks share the single demo 
    // DEVICE account to simplify testing and database size.

    for (const tuktuk of createdTukTuks) {
      // TukTuk level flags
      const isNightRunner = Math.random() < 0.03;
      const isJumped = Math.random() < 0.01;
      const isErratic = Math.random() < 0.02;

      if (isNightRunner) nightRunnerCount++;
      if (isJumped) jumpedCount++;
      if (isErratic) erraticCount++;

      let currentLat = randomBetween(5.9, 9.9);
      let currentLng = randomBetween(79.7, 81.9);
      let lastSpeed = 0;

      for (let day = 0; day < days; day++) {
        const baseTime = new Date(startDate.getTime() + day * 24 * 60 * 60 * 1000);

        // Daily flags
        const isStationaryDay = Math.random() < 0.02;
        if (isStationaryDay) stationaryDaysTotal++;

        const isIdlingDay = Math.random() < 0.05;
        let idleStartHour = null;
        if (isIdlingDay) {
          idleStartHour = [10, 11, 12][Math.floor(Math.random() * 3)];
          idlingDaysTotal++;
        }

        // 1 ping gap per day: skip 6 consecutive slots
        const pingGapStartIndex = Math.floor(randomBetween(60, DAY_SCHEDULE.length - 20));

        for (let slotIdx = 0; slotIdx < DAY_SCHEDULE.length; slotIdx++) {
          if (slotIdx >= pingGapStartIndex && slotIdx < pingGapStartIndex + 6) {
            if (slotIdx === pingGapStartIndex) pingGapsTotal++;
            continue; // Skip this slot
          }

          const slot = DAY_SCHEDULE[slotIdx];
          const hour = Math.floor(slot.minuteOfDay / 60);
          
          const timestamp = new Date(baseTime.getTime() + slot.minuteOfDay * 60 * 1000);

          let speed = 0;
          let heading = 0;

          // Process Out-of-district jump
          if (isJumped && day === 3 && slotIdx === 72) { // 72 is noon
            currentLat = randomBetween(5.9, 9.9);
            currentLng = randomBetween(79.7, 81.9);
          }

          if (isStationaryDay) {
             // speed=0, no movement
          } else if (isIdlingDay && hour >= idleStartHour && hour < idleStartHour + 3) {
             // speed=0, no movement
          } else if (isErratic && (day === 3 || day === 4) && (hour >= 22 || hour < 3)) {
             // Erratic movement anomaly
             if (Math.random() < 0.15) {
                speed = 0;
                heading = 0;
             } else {
                if (lastSpeed > 25) {
                   speed = randomBetween(3, 12);
                } else {
                   speed = randomBetween(50, 65);
                }
                heading = randomInt(0, 359);
             }
             erraticPingsTotal++;
          } else if (slot.isNight) {
             if (isNightRunner) {
               speed = randomBetween(20, 45);
               heading = randomInt(0, 359);
               nightMovementPingsTotal++;
             }
          } else {
             // Daytime
             const dayOfWeek = baseTime.getDay();
             const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
             
             let isSchoolTraffic = false;
             let isOfficeTraffic = false;

             if (!isWeekend) {
               const minOfDay = slot.minuteOfDay;
               // School: 7:00-7:30 (420-450) and 13:30-14:30 (810-870)
               if ((minOfDay >= 420 && minOfDay < 450) || (minOfDay >= 810 && minOfDay < 870)) {
                 isSchoolTraffic = true;
               }
               // Office: 7:30-9:00 (450-540) and 17:00-19:00 (1020-1140)
               else if ((minOfDay >= 450 && minOfDay < 540) || (minOfDay >= 1020 && minOfDay < 1140)) {
                 isOfficeTraffic = true;
               }
             }

             // Slightly more daytime parking on weekends
             const isParked = Math.random() < (isWeekend ? 0.15 : 0.1);
             if (!isParked) {
                if (isSchoolTraffic) {
                   speed = randomBetween(5, 15); // heavy school traffic
                } else if (isOfficeTraffic) {
                   speed = randomBetween(10, 25); // heavy office traffic
                } else {
                   // Normal daytime driving
                   speed = randomBetween(25, 45);
                   if (Math.random() < 0.01) {
                      speed = randomBetween(65, 80);
                      speedingPingsTotal++;
                   }
                }
                heading = randomInt(0, 359);
             }
          }

          if (speed > 0) {
            // 10 minutes elapsed = 1/6 of an hour
            const distanceKm = speed * (1/6);
            const distanceDeg = distanceKm / 111;
            const headingRad = heading * (Math.PI / 180);
            
            currentLat += Math.cos(headingRad) * distanceDeg;
            currentLng += Math.sin(headingRad) * distanceDeg;
            
            currentLat = Math.min(Math.max(currentLat, 5.9), 9.9);
            currentLng = Math.min(Math.max(currentLng, 79.7), 81.9);
          } else if (!slot.isNight) {
             heading = 0; // Daytime parking or stationary/idling
          }

          lastSpeed = speed;

          pingDocs.push({
            tukTuk: tuktuk._id,
            latitude: Number(currentLat.toFixed(6)),
            longitude: Number(currentLng.toFixed(6)),
            speed: Number(speed.toFixed(1)),
            heading,
            timestamp,
            createdAt: timestamp,
            updatedAt: timestamp
          });
          
          totalPings++;
        }
      }
    }

    // Insert in batches of 2000 to prevent memory exhaustion
    const batchSize = 2000;
    for (let i = 0; i < pingDocs.length; i += batchSize) {
      await LocationPing.insertMany(pingDocs.slice(i, i + batchSize));
    }

    console.log(`\n--- FINAL SUMMARY ---`);
    console.log(`Seed period: ${startDate.toISOString()} to ${new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString()}`);
    console.log(`Ping interval: uniform 10 minutes (144 slots/tuktuk/day)`);
    console.log(`Total pings inserted: ${totalPings}`);
    console.log(`---`);
    console.log(`TukTuks flagged as night runners: ${nightRunnerCount}`);
    console.log(`TukTuks flagged as jumped: ${jumpedCount}`);
    console.log(`TukTuks flagged as erratic movement: ${erraticCount}`);
    console.log(`---`);
    console.log(`Total ping gaps: ${pingGapsTotal}`);
    console.log(`Total stationary days: ${stationaryDaysTotal}`);
    console.log(`Total idling days: ${idlingDaysTotal}`);
    console.log(`Total speeding pings: ${speedingPingsTotal}`);
    console.log(`Total erratic pings: ${erraticPingsTotal}`);
    console.log(`Total night movement pings: ${nightMovementPingsTotal}`);
    console.log(`---`);
    console.log('Demo credentials:');
    console.log('admin@slpolice.lk      / Admin@1234      (HQ_ADMIN)');
    console.log('provincial@slpolice.lk / Provincial@1234 (PROVINCIAL)');
    console.log('station@slpolice.lk    / Station@1234    (STATION)');
    console.log('device001@slpolice.lk  / Device@1234     (DEVICE)');


    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seedDB();