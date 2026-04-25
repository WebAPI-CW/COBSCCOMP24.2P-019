import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- EXACT DATA FROM seed.js ---

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
  { name: 'Colombo', code: 'COL', province: 'WP' },
  { name: 'Gampaha', code: 'GAM', province: 'WP' },
  { name: 'Kalutara', code: 'KAL', province: 'WP' },
  { name: 'Kandy', code: 'KAN', province: 'CP' },
  { name: 'Matale', code: 'MAT', province: 'CP' },
  { name: 'Nuwara Eliya', code: 'NUW', province: 'CP' },
  { name: 'Galle', code: 'GAL', province: 'SP' },
  { name: 'Matara', code: 'MTA', province: 'SP' },
  { name: 'Hambantota', code: 'HAM', province: 'SP' },
  { name: 'Jaffna', code: 'JAF', province: 'NP' },
  { name: 'Kilinochchi', code: 'KIL', province: 'NP' },
  { name: 'Mannar', code: 'MAN', province: 'NP' },
  { name: 'Vavuniya', code: 'VAV', province: 'NP' },
  { name: 'Mullaitivu', code: 'MUL', province: 'NP' },
  { name: 'Batticaloa', code: 'BAT', province: 'EP' },
  { name: 'Ampara', code: 'AMP', province: 'EP' },
  { name: 'Trincomalee', code: 'TRI', province: 'EP' },
  { name: 'Kurunegala', code: 'KUR', province: 'NWP' },
  { name: 'Puttalam', code: 'PUT', province: 'NWP' },
  { name: 'Anuradhapura', code: 'ANU', province: 'NCP' },
  { name: 'Polonnaruwa', code: 'POL', province: 'NCP' },
  { name: 'Badulla', code: 'BAD', province: 'UP' },
  { name: 'Monaragala', code: 'MON', province: 'UP' },
  { name: 'Ratnapura', code: 'RAT', province: 'SGP' },
  { name: 'Kegalle', code: 'KEG', province: 'SGP' }
];

const stations = [
  { name: 'Colombo Fort Police Station', code: 'ST001', district: 'COL', province: 'WP' },
  { name: 'Nugegoda Police Station', code: 'ST002', district: 'COL', province: 'WP' },
  { name: 'Dehiwala Police Station', code: 'ST003', district: 'COL', province: 'WP' },
  { name: 'Negombo Police Station', code: 'ST004', district: 'GAM', province: 'WP' },
  { name: 'Gampaha Police Station', code: 'ST005', district: 'GAM', province: 'WP' },
  { name: 'Kalutara Police Station', code: 'ST006', district: 'KAL', province: 'WP' },
  { name: 'Kandy Police Station', code: 'ST007', district: 'KAN', province: 'CP' },
  { name: 'Peradeniya Police Station', code: 'ST008', district: 'KAN', province: 'CP' },
  { name: 'Matale Police Station', code: 'ST009', district: 'MAT', province: 'CP' },
  { name: 'Nuwara Eliya Police Station', code: 'ST010', district: 'NUW', province: 'CP' },
  { name: 'Galle Police Station', code: 'ST011', district: 'GAL', province: 'SP' },
  { name: 'Matara Police Station', code: 'ST012', district: 'MTA', province: 'SP' },
  { name: 'Hambantota Police Station', code: 'ST013', district: 'HAM', province: 'SP' },
  { name: 'Jaffna Police Station', code: 'ST014', district: 'JAF', province: 'NP' },
  { name: 'Vavuniya Police Station', code: 'ST015', district: 'VAV', province: 'NP' },
  { name: 'Batticaloa Police Station', code: 'ST016', district: 'BAT', province: 'EP' },
  { name: 'Trincomalee Police Station', code: 'ST017', district: 'TRI', province: 'EP' },
  { name: 'Kurunegala Police Station', code: 'ST018', district: 'KUR', province: 'NWP' },
  { name: 'Puttalam Police Station', code: 'ST019', district: 'PUT', province: 'NWP' },
  { name: 'Anuradhapura Police Station', code: 'ST020', district: 'ANU', province: 'NCP' },
  { name: 'Polonnaruwa Police Station', code: 'ST021', district: 'POL', province: 'NCP' },
  { name: 'Badulla Police Station', code: 'ST022', district: 'BAD', province: 'UP' },
  { name: 'Ratnapura Police Station', code: 'ST023', district: 'RAT', province: 'SGP' },
  { name: 'Kegalle Police Station', code: 'ST024', district: 'KEG', province: 'SGP' },
  { name: 'Ampara Police Station', code: 'ST025', district: 'AMP', province: 'EP' }
];

const users = [
  {
    name: 'HQ Administrator',
    email: 'admin@slpolice.lk',
    password: 'Admin@1234',
    role: 'HQ_ADMIN'
  },
  {
    name: 'Provincial Commander',
    email: 'provincial@slpolice.lk',
    password: 'Provincial@1234',
    role: 'PROVINCIAL'
  },
  {
    name: 'Station OIC',
    email: 'station@slpolice.lk',
    password: 'Station@1234',
    role: 'STATION'
  },
  {
    name: 'Device Unit 001',
    email: 'device001@slpolice.lk',
    password: 'Device@1234',
    role: 'DEVICE'
  }
];

// --- DRIVER NAMES FROM seed.js ---
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

// --- SAME HELPER FUNCTIONS AS seed.js ---
const randomBetween = (min, max) => Math.random() * (max - min) + min;
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomNIC = (index) => {
  const year = randomInt(1970, 2000);
  const days = randomInt(1, 366);
  return `${year}${String(days).padStart(3, '0')}${String(index).padStart(4, '0')}V`;
};

const randomPhone = () =>
  `07${randomInt(0, 9)}${randomInt(1000000, 9999999)}`;

// --- GENERATE 200 VEHICLES ---
// Same logic as seed.js
const vehicles = Array.from({ length: 200 }, (_, i) => {
  const station = stations[i % stations.length];
  return {
    registrationNumber: `${station.province}-${String(i + 1).padStart(4, '0')}`,
    deviceId: `DEV-${String(i + 1).padStart(4, '0')}`,
    driverName: driverNames[i % driverNames.length],
    driverNIC: randomNIC(i + 1),
    driverContact: randomPhone(),
    province: station.province,
    district: station.district,
    station: station.code,
    isActive: true
  };
});

// --- GENERATE SAMPLE PINGS FOR DEV-0001 ---
// Same movement logic as seed.js
// 70 pings = 10 pings per day x 7 days for one vehicle
const now = new Date();
const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
const pingsPerDay = 10;
const days = 7;

let latitude = randomBetween(5.9, 9.9);
let longitude = randomBetween(79.7, 81.9);

const samplePings = [];

for (let day = 0; day < days; day++) {
  for (let ping = 0; ping < pingsPerDay; ping++) {
    const timestamp = new Date(
      oneWeekAgo.getTime() +
      day * 24 * 60 * 60 * 1000 +
      ping * (24 / pingsPerDay) * 60 * 60 * 1000
    );

    // same movement logic as seed.js
    latitude += randomBetween(-0.01, 0.01);
    longitude += randomBetween(-0.01, 0.01);

    // keep within Sri Lanka bounds
    latitude = Math.min(Math.max(latitude, 5.9), 9.9);
    longitude = Math.min(Math.max(longitude, 79.7), 81.9);

    samplePings.push({
      vehicle: 'DEV-0001',
      latitude: parseFloat(latitude.toFixed(6)),
      longitude: parseFloat(longitude.toFixed(6)),
      speed: parseFloat(randomBetween(0, 60).toFixed(1)),
      heading: parseFloat(randomBetween(0, 360).toFixed(1)),
      timestamp: timestamp.toISOString()
    });
  }
}

// --- WRITE JSON FILES ---
const write = (filename, data) => {
  const filepath = path.join(__dirname, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`Written: data/${filename} — ${data.length} records`);
};

write('provinces.json', provinces);
write('districts.json', districts);
write('stations.json', stations);
write('users.json', users);
write('vehicles.json', vehicles);
write('sample-pings.json', samplePings);

console.log('');
console.log('--- Export complete ---');
console.log('Files written to /data folder');
console.log('');
console.log('Note:');
console.log('- users.json shows plain text passwords for reference only');
console.log('- Passwords are hashed by bcrypt before storing in MongoDB');
console.log('- sample-pings.json shows 70 pings for DEV-0001 over 7 days');
console.log('- Full dataset of 14,000 pings generated by npm run seed');