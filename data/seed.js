import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Province from '../src/models/Province.js';
import District from '../src/models/District.js';
import PoliceStation from '../src/models/PoliceStation.js';
import User from '../src/models/User.js';
import Vehicle from '../src/models/Vehicle.js';
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
  { name: 'Ampara Police Station', code: 'ST025', districtName: 'Ampara' }
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
      Vehicle.deleteMany(),
      LocationPing.deleteMany()
    ]);
    console.log('Existing data cleared');

    // seed provinces
    const createdProvinces = await Province.insertMany(provinces);
    console.log(`${createdProvinces.length} provinces seeded`);

    // seed districts
    const districtDocs = districts.map(d => ({
      name: d.name,
      code: d.code,
      province: createdProvinces.find(p => p.name === d.provinceName)._id
    }));
    const createdDistricts = await District.insertMany(districtDocs);
    console.log(`${createdDistricts.length} districts seeded`);

    // seed stations
    const stationDocs = stationsData.map(s => {
      const district = createdDistricts.find(d => d.name === s.districtName);
      const province = createdProvinces.find(
        p => p._id.toString() === district.province.toString()
      );
      return {
        name: s.name,
        code: s.code,
        district: district._id,
        province: province._id
      };
    });
    const createdStations = await PoliceStation.insertMany(stationDocs);
    console.log(`${createdStations.length} stations seeded`);

    // seed admin user
    await User.create({
      name: 'HQ Administrator',
      email: 'admin@slpolice.lk',
      password: 'Admin@1234',
      role: 'HQ_ADMIN'
    });
    console.log('Admin user seeded');

    // seed 200 vehicles
    const vehicleDocs = Array.from({ length: 200 }, (_, i) => {
      const station = createdStations[i % createdStations.length];
      const district = createdDistricts.find(
        d => d._id.toString() === station.district.toString()
      );
      const province = createdProvinces.find(
        p => p._id.toString() === station.province.toString()
      );
      return {
        registrationNumber: `WP-${String(i + 1).padStart(4, '0')}`,
        deviceId: `DEV-${String(i + 1).padStart(4, '0')}`,
        driverName: driverNames[i % driverNames.length],
        driverNIC: randomNIC(i + 1),
        driverContact: randomPhone(),
        province: province._id,
        district: district._id,
        station: station._id,
        isActive: true
      };
    });
    const createdVehicles = await Vehicle.insertMany(vehicleDocs);
    console.log(`${createdVehicles.length} vehicles seeded`);

    // seed 1 week of location pings
    // 1 ping every 5 minutes = 288 pings per day x 7 days = 2016 pings per vehicle
    // for 200 vehicles that is too many - do 10 pings per day per vehicle
    const now = new Date();
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const pingsPerDay = 10;
    const days = 7;

    const pingDocs = [];

    for (const vehicle of createdVehicles) {
      let { latitude, longitude } = randomLatLng();

      for (let day = 0; day < days; day++) {
        for (let ping = 0; ping < pingsPerDay; ping++) {
          const timestamp = new Date(
            oneWeekAgo.getTime() +
            day * 24 * 60 * 60 * 1000 +
            ping * (24 / pingsPerDay) * 60 * 60 * 1000
          );

          // simulate movement - small increments
          latitude += randomBetween(-0.01, 0.01);
          longitude += randomBetween(-0.01, 0.01);

          // keep within Sri Lanka bounds
          latitude = Math.min(Math.max(latitude, 5.9), 9.9);
          longitude = Math.min(Math.max(longitude, 79.7), 81.9);

          pingDocs.push({
            vehicle: vehicle._id,
            latitude,
            longitude,
            speed: randomBetween(0, 60),
            heading: randomBetween(0, 360),
            timestamp
          });
        }
      }
    }

    // insert in batches to avoid memory issues
    const batchSize = 1000;
    for (let i = 0; i < pingDocs.length; i += batchSize) {
      await LocationPing.insertMany(pingDocs.slice(i, i + batchSize));
      console.log(`Inserted pings ${i} to ${Math.min(i + batchSize, pingDocs.length)}`);
    }

    console.log(`${pingDocs.length} location pings seeded`);
    console.log('--- Seed complete ---');
    console.log('Admin login: admin@slpolice.lk / Admin@1234');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seedDB();