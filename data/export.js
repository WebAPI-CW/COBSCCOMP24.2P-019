import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import Province from '../src/models/Province.js';
import District from '../src/models/District.js';
import PoliceStation from '../src/models/PoliceStation.js';
import User from '../src/models/User.js';
import TukTuk from '../src/models/TukTuk.js';
import LocationPing from '../src/models/LocationPing.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const exportDir = path.join(__dirname, 'simulated');

// Ensure the export directory exists
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

const writeJSON = (filename, data) => {
  const filepath = path.join(exportDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`Written: data/simulated/${filename} — ${data.length} records`);
};

const exportData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected. Exporting data...');

    // 1. Export smaller collections directly into memory
    const provinces = await Province.find().lean();
    writeJSON('provinces.json', provinces);

    const districts = await District.find().lean();
    writeJSON('districts.json', districts);

    const stations = await PoliceStation.find().lean();
    writeJSON('police-stations.json', stations);

    const tuktuks = await TukTuk.find().lean();
    writeJSON('tuktuks.json', tuktuks);

    // 2. Export the massive LocationPing collection using a Cursor (Streaming)
    console.log('\nStarting LocationPing export... (This might take a minute for 200,000+ records)');
    const pingFilepath = path.join(exportDir, 'location_history.json');
    const writeStream = fs.createWriteStream(pingFilepath, { encoding: 'utf8' });

    writeStream.write('[\n');

    let count = 0;
    const cursor = LocationPing.find().lean().cursor();
    let isFirst = true;

    for await (const ping of cursor) {
      if (!isFirst) {
        writeStream.write(',\n');
      }
      isFirst = false;

      // Convert ObjectId and Date to strings manually for the stream
      writeStream.write(JSON.stringify(ping));

      count++;
      if (count % 50000 === 0) {
        console.log(`... streamed ${count} pings`);
      }
    }

    writeStream.write('\n]');
    writeStream.end();

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    console.log(`Written: data/simulated/location_history.json — ${count} records`);
    console.log('\n--- Export complete ---');
    console.log('All real data has been extracted from the database to /data/simulated/');

    process.exit(0);
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
};

exportData();