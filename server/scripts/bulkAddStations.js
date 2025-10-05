const mongoose = require('mongoose');
const Station = require('../models/Station');
require('dotenv').config({ path: __dirname + '/../.env' });

const stations = [
  { name: 'COCO ARAMCO 1 - LIBERTY', stationId: '1' },
  { name: 'COCO ARAMCO 2 - EMBASSY', stationId: '2' },
  { name: 'COCO ARAMCO 3 - EXPO', stationId: '3' },
  { name: 'COCO ARAMCO 4 - SHAHDRA', stationId: '4' },
  { name: 'COCO ARAMCO 5 - HAYATABAD', stationId: '5' },
  { name: 'COCO ARAMCO 6 - WAZIRABAD', stationId: '6' },
  { name: 'COCO ARAMCO 7 - UCH NORTH', stationId: '7' },
  { name: 'COCO ARAMCO 8 - UCH SOUTH', stationId: '8' },
  { name: 'COCO ARAMCO 9 - RASHID MINHAS', stationId: '9' },
  { name: 'COCO ARAMCO 10 - WAHDAT', stationId: '10' },
  { name: 'COCO ARAMCO 11 - FAISALABAD', stationId: '11' },
  { name: 'COCO ARAMCO 12 - SABZAZAR', stationId: '12' },
  { name: 'COCO ARAMCO 13 - FAISAL TOWN', stationId: '13' },
  { name: 'COCO ARAMCO 14 - GUJRANWALA', stationId: '14' },
  { name: 'COCO ARAMCO 15 - MULTAN', stationId: '15' },
  { name: 'COCO ARAMCO 16 - SIALKOT', stationId: '16' },
  { name: 'COCO ARAMCO 17 - KAHNEWAL', stationId: '17' },
  { name: 'COCO ARAMCO 18 - SADAR LAHORE', stationId: '18' },
  { name: 'COCO ARAMCO 19 - LYALPUR FAISALABAD', stationId: '19' },
  { name: 'COCO ARAMCO 20 - G1 JOHAR TOWN', stationId: '20' },
  { name: 'COCO ARAMCO 21 SARAI ALAMGIR', stationId: '21' },
  { name: 'COCO ARAMCO 22 SARGODHA ROAD', stationId: '22' },
  { name: 'COCO ARAMCO 23 - WALTON', stationId: '23' },
  { name: 'COCO ARAMCO 24 - MK', stationId: '24' },
  { name: 'COCO ARAMCO 25 - ATTOCK', stationId: '25' },
  { name: 'COCO ARAMCO 26 - TIPU ROAD', stationId: '26' },
  { name: 'COCO ARAMCO  27 - LODHRAN', stationId: '27' },
  { name: 'COCO ARAMCO 28 - RAIWIND', stationId: '28' },
  { name: 'COCO Aramco 29 - SARGODHA', stationId: '29' },
  { name: 'COCO Aramco 30 - HARRAPA', stationId: '30' },
  { name: 'COCO Aramco 31 - COLLEGE ROAD', stationId: '31' },
  { name: 'COCO ARAMCO 32 - ferozpur road', stationId: '32' },
  { name: 'COCO ARAMCO  33 - Shadman', stationId: '33' },
  { name: 'COCO ARAMCO 34 - Bhalwal', stationId: '34' },
  { name: 'COCO Aramco 35 - CANAL ROAD', stationId: '35' },
  { name: 'COCO Aramco 36 - UET', stationId: '36' },
  { name: 'COCO Aramco 37 - SARGODHA ROAD', stationId: '37' },
  { name: 'COCO ARAMCO 38 - CHUNG', stationId: '38' },
  { name: 'COCO ARAMCO 39 - GUJRANWALA 2', stationId: '39' },
  { name: 'COCO ARAMCO 40 - Phool nagar', stationId: '40' },
  { name: 'COCO ARAMCO 41 - Charsadda', stationId: '41' },
  { name: 'COCO ARAMCO 42 - Bahwal Nagar', stationId: '42' },
  { name: 'COCO ARAMCO 43 - rawalpindi PAF Jinnah complex', stationId: '43' },
  { name: 'COCO ARAMCO 44 - Faisalabad Sargodha Road', stationId: '44' },
  { name: 'COCO ARAMCO 45 - Moon Market lahore', stationId: '45' },
  { name: 'COCO ARAMCO 46 - Nazimabad', stationId: '46' },
  { name: 'COCO ARAMCO 47- Mangalla', stationId: '47' },
  { name: 'COCO ARAMCO 48 - Wireless Gate', stationId: '48' },
  { name: 'COCO ARAMCO 49- Sialkot 2', stationId: '49' },
  { name: 'COCO ARAMCO 50- Sahiwal', stationId: '50' }
];

// Dummy coordinates for all stations (Lahore)
const lng = 74.3587;
const lat = 31.5204;

async function run() {
  const dbName = process.env.MONGO_DBNAME || 'admin';
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, dbName });
  for (const s of stations) {
    try {
      const res = await Station.findOneAndUpdate(
        { stationId: s.stationId },
        {
          $set: {
            name: s.name,
            stationId: s.stationId,
            location: { type: 'Point', coordinates: [lng, lat] }
          }
        },
        { upsert: true, new: true }
      );
      if (res) {
        // If upsert created the doc, Mongo returns the doc. We'll assume creation or update succeeded
        console.log('Upserted:', s.name);
      }
    } catch (e) {
      console.log('Error upserting', s.name, e.message);
    }
  }
  await mongoose.disconnect();
  console.log('Done!');
}

run();
