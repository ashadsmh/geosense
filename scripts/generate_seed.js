const fs = require('fs');

const cities = [
  // Northeast
  { zips: ['10001', '10002', '10003', '10036', '10128'], county: 'New York', state: 'NY', soil: 'Manhattan Schist', k: 2.8, bed: 30, gw: 15, diff: 'hard', notes: 'Manhattan Schist formation with shallow bedrock.', zone: '4A', hdd: 4700, cdd: 1100, temp: 55 },
  { zips: ['11201', '11215', '11238'], county: 'Kings', state: 'NY', soil: 'Glacial Outwash', k: 1.8, bed: 100, gw: 20, diff: 'moderate', notes: 'Glacial terminal moraine deposits.', zone: '4A', hdd: 4600, cdd: 1150, temp: 56 },
  { zips: ['02101', '02115', '02134', '02139', '02446'], county: 'Suffolk', state: 'MA', soil: 'Cambridge Argillite', k: 2.4, bed: 50, gw: 10, diff: 'hard', notes: 'Boston Basin argillite and glacial till.', zone: '5A', hdd: 5600, cdd: 700, temp: 51 },
  { zips: ['19103', '19107', '19146'], county: 'Philadelphia', state: 'PA', soil: 'Wissahickon Schist', k: 2.6, bed: 25, gw: 15, diff: 'hard', notes: 'Wissahickon Formation mica schist.', zone: '4A', hdd: 4500, cdd: 1200, temp: 56 },
  { zips: ['20001', '20005', '20009', '20016'], county: 'District of Columbia', state: 'DC', soil: 'Piedmont Crystalline', k: 2.2, bed: 50, gw: 20, diff: 'moderate', notes: 'Transition zone between Piedmont and Coastal Plain.', zone: '4A', hdd: 4000, cdd: 1500, temp: 58 },
  { zips: ['21201', '21210', '21218'], county: 'Baltimore', state: 'MD', soil: 'Baltimore Gneiss', k: 2.5, bed: 40, gw: 15, diff: 'hard', notes: 'Baltimore Gneiss and Gabbro complex.', zone: '4A', hdd: 4200, cdd: 1300, temp: 57 },
  { zips: ['15213', '15217', '15232'], county: 'Allegheny', state: 'PA', soil: 'Appalachian Sedimentary', k: 2.1, bed: 20, gw: 30, diff: 'moderate', notes: 'Appalachian Plateau sedimentary rock.', zone: '5A', hdd: 5800, cdd: 700, temp: 51 },
  { zips: ['06103', '06106', '06112'], county: 'Hartford', state: 'CT', soil: 'Portland Arkose', k: 2.3, bed: 60, gw: 15, diff: 'moderate', notes: 'Hartford Basin sedimentary rift deposits.', zone: '5A', hdd: 6000, cdd: 600, temp: 50 },
  { zips: ['02903', '02906', '02908'], county: 'Providence', state: 'RI', soil: 'Rhode Island Formation', k: 2.4, bed: 30, gw: 10, diff: 'hard', notes: 'Narragansett Basin sedimentary rocks.', zone: '5A', hdd: 5800, cdd: 650, temp: 51 },
  { zips: ['07102', '07103', '07104'], county: 'Essex', state: 'NJ', soil: 'Passaic Formation', k: 2.2, bed: 30, gw: 10, diff: 'moderate', notes: 'Newark Basin red beds and shale.', zone: '4A', hdd: 4600, cdd: 1100, temp: 55 },
  { zips: ['07302', '07304', '07306'], county: 'Hudson', state: 'NJ', soil: 'Passaic Formation', k: 2.2, bed: 30, gw: 10, diff: 'moderate', notes: 'Newark Basin red beds and shale.', zone: '4A', hdd: 4600, cdd: 1100, temp: 55 },
  { zips: ['08540', '08542', '08544'], county: 'Mercer', state: 'NJ', soil: 'Stockton Formation', k: 2.4, bed: 15, gw: 20, diff: 'hard', notes: 'Stockton sandstone and Palisades diabase.', zone: '4A', hdd: 4800, cdd: 1000, temp: 54 },

  // Southeast
  { zips: ['33101', '33125', '33130', '33139'], county: 'Miami-Dade', state: 'FL', soil: 'Miami Oolite', k: 1.6, bed: 5, gw: 3, diff: 'easy', notes: 'Biscayne Aquifer porous limestone.', zone: '1A', hdd: 150, cdd: 4200, temp: 76 },
  { zips: ['32801', '32803', '32806'], county: 'Orange', state: 'FL', soil: 'Coastal Plain Sand', k: 1.4, bed: 150, gw: 10, diff: 'easy', notes: 'Deep sandy marine terraces.', zone: '2A', hdd: 600, cdd: 3200, temp: 73 },
  { zips: ['33601', '33606', '33609'], county: 'Hillsborough', state: 'FL', soil: 'Tampa Limestone', k: 1.7, bed: 20, gw: 5, diff: 'moderate', notes: 'Karst limestone with sandy overburden.', zone: '2A', hdd: 700, cdd: 3100, temp: 73 },
  { zips: ['30301', '30306', '30309', '30318'], county: 'Fulton', state: 'GA', soil: 'Piedmont Granite', k: 2.8, bed: 45, gw: 30, diff: 'hard', notes: 'Deeply weathered Piedmont crystalline rock.', zone: '3A', hdd: 2800, cdd: 1800, temp: 63 },
  { zips: ['28201', '28203', '28205'], county: 'Mecklenburg', state: 'NC', soil: 'Carolina Slate Belt', k: 2.6, bed: 40, gw: 25, diff: 'hard', notes: 'Metavolcanic rocks and granitic intrusions.', zone: '3A', hdd: 3100, cdd: 1600, temp: 61 },
  { zips: ['27601', '27605', '27609'], county: 'Wake', state: 'NC', soil: 'Raleigh Gneiss', k: 2.7, bed: 50, gw: 20, diff: 'hard', notes: 'Piedmont metamorphic rocks.', zone: '3A', hdd: 3200, cdd: 1500, temp: 60 },
  { zips: ['37201', '37203', '37206'], county: 'Davidson', state: 'TN', soil: 'Ordovician Limestone', k: 2.4, bed: 15, gw: 15, diff: 'hard', notes: 'Central Basin dense limestone.', zone: '4A', hdd: 3600, cdd: 1800, temp: 60 },
  { zips: ['38103', '38104', '38111'], county: 'Shelby', state: 'TN', soil: 'Mississippi Alluvium', k: 1.5, bed: 3000, gw: 20, diff: 'easy', notes: 'Thick unconsolidated fluvial deposits.', zone: '3A', hdd: 3000, cdd: 2100, temp: 63 },
  { zips: ['23220', '23221', '23225'], county: 'Richmond', state: 'VA', soil: 'Petersburg Granite', k: 2.8, bed: 30, gw: 15, diff: 'hard', notes: 'Fall Line granitic rocks.', zone: '4A', hdd: 3800, cdd: 1400, temp: 59 },
  { zips: ['23451', '23454', '23462'], county: 'Virginia Beach', state: 'VA', soil: 'Coastal Plain Sediments', k: 1.4, bed: 1000, gw: 5, diff: 'easy', notes: 'Unconsolidated marine sands and clays.', zone: '4A', hdd: 3400, cdd: 1600, temp: 61 },

  // Midwest
  { zips: ['60601', '60607', '60614', '60622', '60657'], county: 'Cook', state: 'IL', soil: 'Silurian Dolomite', k: 2.3, bed: 75, gw: 15, diff: 'moderate', notes: 'Thick Wisconsinan glacial till over dolomite.', zone: '5A', hdd: 6300, cdd: 800, temp: 50 },
  { zips: ['48201', '48202', '48207'], county: 'Wayne', state: 'MI', soil: 'Glacial Lacustrine Clay', k: 1.3, bed: 100, gw: 10, diff: 'easy', notes: 'Glacial lake plain clay deposits.', zone: '5A', hdd: 6400, cdd: 750, temp: 50 },
  { zips: ['43201', '43202', '43205'], county: 'Franklin', state: 'OH', soil: 'Devonian Shale', k: 2.1, bed: 50, gw: 20, diff: 'moderate', notes: 'Glacial till over sedimentary bedrock.', zone: '5A', hdd: 5300, cdd: 1000, temp: 53 },
  { zips: ['44101', '44102', '44106'], county: 'Cuyahoga', state: 'OH', soil: 'Berea Sandstone', k: 2.2, bed: 40, gw: 15, diff: 'moderate', notes: 'Lake Erie coastal plain and glacial till.', zone: '5A', hdd: 5900, cdd: 800, temp: 51 },
  { zips: ['46201', '46202', '46204'], county: 'Marion', state: 'IN', soil: 'Glacial Outwash', k: 2.0, bed: 100, gw: 15, diff: 'moderate', notes: 'Thick glacial drift over carbonate rocks.', zone: '5A', hdd: 5400, cdd: 1100, temp: 53 },
  { zips: ['53202', '53203', '53205'], county: 'Milwaukee', state: 'WI', soil: 'Glacial Till', k: 2.4, bed: 50, gw: 20, diff: 'moderate', notes: 'Lake Michigan lobe glacial deposits.', zone: '6A', hdd: 6900, cdd: 600, temp: 48 },
  { zips: ['55401', '55403', '55405'], county: 'Hennepin', state: 'MN', soil: 'St. Peter Sandstone', k: 2.1, bed: 50, gw: 20, diff: 'moderate', notes: 'Glacial outwash over friable sandstone.', zone: '6A', hdd: 7600, cdd: 700, temp: 46 },
  { zips: ['63101', '63103', '63108'], county: 'St. Louis', state: 'MO', soil: 'Mississippian Limestone', k: 2.5, bed: 30, gw: 15, diff: 'hard', notes: 'Karst-prone limestone with loess cover.', zone: '4A', hdd: 4400, cdd: 1600, temp: 57 },
  { zips: ['64101', '64105', '64108'], county: 'Jackson', state: 'MO', soil: 'Pennsylvanian Limestone', k: 2.2, bed: 20, gw: 20, diff: 'moderate', notes: 'Alternating limestone and shale beds.', zone: '4A', hdd: 4800, cdd: 1500, temp: 55 },
  { zips: ['45202', '45203', '45206'], county: 'Hamilton', state: 'OH', soil: 'Ordovician Shale', k: 2.1, bed: 30, gw: 15, diff: 'moderate', notes: 'Highly fossiliferous limestone and shale.', zone: '4A', hdd: 4800, cdd: 1200, temp: 55 },

  // South
  { zips: ['77001', '77002', '77006', '77019'], county: 'Harris', state: 'TX', soil: 'Beaumont Clay', k: 1.3, bed: 5000, gw: 10, diff: 'easy', notes: 'Deep coastal plain clay and sand.', zone: '2A', hdd: 1400, cdd: 2900, temp: 70 },
  { zips: ['75201', '75204', '75206'], county: 'Dallas', state: 'TX', soil: 'Austin Chalk', k: 2.0, bed: 15, gw: 20, diff: 'moderate', notes: 'Upper Cretaceous chalk and marl.', zone: '3A', hdd: 2200, cdd: 2800, temp: 67 },
  { zips: ['78701', '78703', '78704'], county: 'Travis', state: 'TX', soil: 'Edwards Limestone', k: 2.4, bed: 5, gw: 50, diff: 'hard', notes: 'Edwards Aquifer karst limestone.', zone: '2A', hdd: 1600, cdd: 3000, temp: 69 },
  { zips: ['78201', '78205', '78209'], county: 'Bexar', state: 'TX', soil: 'Navarro Group', k: 2.2, bed: 15, gw: 40, diff: 'moderate', notes: 'Transition from Edwards Plateau to Coastal Plain.', zone: '2A', hdd: 1500, cdd: 3100, temp: 70 },
  { zips: ['70112', '70115', '70118'], county: 'Orleans', state: 'LA', soil: 'Mississippi Delta Alluvium', k: 1.2, bed: 10000, gw: 3, diff: 'easy', notes: 'Unconsolidated deltaic silt and clay.', zone: '2A', hdd: 1300, cdd: 2800, temp: 70 },
  { zips: ['73101', '73103', '73106'], county: 'Oklahoma', state: 'OK', soil: 'Permian Red Beds', k: 2.1, bed: 20, gw: 30, diff: 'moderate', notes: 'Garber Sandstone and Wellington Formation.', zone: '3A', hdd: 3600, cdd: 2100, temp: 61 },
  { zips: ['72201', '72205', '72207'], county: 'Pulaski', state: 'AR', soil: 'Jackfork Sandstone', k: 2.3, bed: 20, gw: 20, diff: 'hard', notes: 'Ouachita Mountains folded sedimentary rocks.', zone: '3A', hdd: 3100, cdd: 2000, temp: 63 },
  { zips: ['35203', '35205', '35209'], county: 'Jefferson', state: 'AL', soil: 'Knox Group Dolomite', k: 2.6, bed: 20, gw: 30, diff: 'hard', notes: 'Valley and Ridge folded carbonates.', zone: '3A', hdd: 2600, cdd: 1900, temp: 64 },
  { zips: ['39201', '39202', '39206'], county: 'Hinds', state: 'MS', soil: 'Yazoo Clay', k: 1.2, bed: 3000, gw: 15, diff: 'easy', notes: 'Highly expansive smectitic clay.', zone: '3A', hdd: 2100, cdd: 2300, temp: 66 },

  // Mountain West
  { zips: ['80201', '80203', '80205', '80209'], county: 'Denver', state: 'CO', soil: 'Denver Formation', k: 2.0, bed: 25, gw: 20, diff: 'moderate', notes: 'Alluvial fans over sedimentary bedrock.', zone: '5B', hdd: 6000, cdd: 700, temp: 52 },
  { zips: ['80301', '80302', '80303'], county: 'Boulder', state: 'CO', soil: 'Pierre Shale', k: 2.1, bed: 20, gw: 15, diff: 'moderate', notes: 'Alluvium over steeply dipping sedimentary rocks.', zone: '5B', hdd: 6200, cdd: 600, temp: 51 },
  { zips: ['84101', '84102', '84103'], county: 'Salt Lake', state: 'UT', soil: 'Lake Bonneville Deposits', k: 1.6, bed: 500, gw: 10, diff: 'easy', notes: 'Thick lacustrine gravel, sand, and clay.', zone: '5B', hdd: 5600, cdd: 1100, temp: 53 },
  { zips: ['85001', '85003', '85006'], county: 'Maricopa', state: 'AZ', soil: 'Basin Fill Alluvium', k: 1.5, bed: 1000, gw: 100, diff: 'easy', notes: 'Deep arid basin alluvial deposits.', zone: '2B', hdd: 1000, cdd: 4500, temp: 74 },
  { zips: ['85701', '85705', '85711'], county: 'Pima', state: 'AZ', soil: 'Basin Fill Alluvium', k: 1.5, bed: 800, gw: 150, diff: 'easy', notes: 'Alluvial fan and basin floor deposits.', zone: '2B', hdd: 1500, cdd: 3500, temp: 70 },
  { zips: ['87101', '87102', '87104'], county: 'Bernalillo', state: 'NM', soil: 'Santa Fe Group Alluvium', k: 1.6, bed: 2000, gw: 200, diff: 'easy', notes: 'Rio Grande rift basin fill.', zone: '4B', hdd: 4200, cdd: 1400, temp: 58 },
  { zips: ['89101', '89102', '89104'], county: 'Clark', state: 'NV', soil: 'Basin Fill / Caliche', k: 1.8, bed: 1000, gw: 50, diff: 'moderate', notes: 'Alluvial deposits with hard caliche layers.', zone: '3B', hdd: 2100, cdd: 3400, temp: 68 },
  { zips: ['83701', '83702', '83705'], county: 'Ada', state: 'ID', soil: 'Idaho Group Sediments', k: 1.7, bed: 500, gw: 30, diff: 'easy', notes: 'Fluvial and lacustrine rift basin deposits.', zone: '5B', hdd: 5700, cdd: 800, temp: 53 },

  // Pacific
  { zips: ['90001', '90012', '90024', '90036'], county: 'Los Angeles', state: 'CA', soil: 'LA Basin Alluvium', k: 1.6, bed: 2000, gw: 30, diff: 'easy', notes: 'Deep marine and non-marine basin fill.', zone: '3C', hdd: 1300, cdd: 600, temp: 65 },
  { zips: ['94102', '94103', '94110', '94117'], county: 'San Francisco', state: 'CA', soil: 'Franciscan Complex', k: 2.5, bed: 30, gw: 15, diff: 'hard', notes: 'Melange of greywacke, shale, and serpentinite.', zone: '3C', hdd: 2800, cdd: 100, temp: 59 },
  { zips: ['92101', '92103', '92116'], county: 'San Diego', state: 'CA', soil: 'San Diego Formation', k: 2.0, bed: 30, gw: 20, diff: 'moderate', notes: 'Marine terrace and coastal plain deposits.', zone: '3C', hdd: 1200, cdd: 800, temp: 65 },
  { zips: ['95814', '95816', '95818'], county: 'Sacramento', state: 'CA', soil: 'Great Valley Alluvium', k: 1.5, bed: 3000, gw: 15, diff: 'easy', notes: 'Thick sequence of alluvial and fluvial deposits.', zone: '3B', hdd: 2600, cdd: 1300, temp: 62 },
  { zips: ['97201', '97202', '97205', '97209'], county: 'Multnomah', state: 'OR', soil: 'Columbia River Basalt', k: 2.2, bed: 75, gw: 20, diff: 'moderate', notes: 'Cataclysmic flood gravels over basalt.', zone: '4C', hdd: 4300, cdd: 400, temp: 54 },
  { zips: ['98101', '98103', '98107', '98115'], county: 'King', state: 'WA', soil: 'Vashon Glacial Till', k: 1.9, bed: 1000, gw: 30, diff: 'moderate', notes: 'Overconsolidated glacial till and outwash.', zone: '4C', hdd: 4700, cdd: 200, temp: 53 },
  { zips: ['99201', '99202', '99203'], county: 'Spokane', state: 'WA', soil: 'Columbia River Basalt', k: 2.4, bed: 20, gw: 50, diff: 'hard', notes: 'Massive flood basalt flows.', zone: '5B', hdd: 6600, cdd: 500, temp: 49 },
  { zips: ['96813', '96814', '96816'], county: 'Honolulu', state: 'HI', soil: 'Honolulu Volcanics', k: 2.1, bed: 10, gw: 5, diff: 'moderate', notes: 'Basaltic lava flows and raised coral reefs.', zone: '1A', hdd: 0, cdd: 3800, temp: 77 },
  { zips: ['99501', '99502', '99503'], county: 'Anchorage', state: 'AK', soil: 'Bootlegger Cove Formation', k: 1.4, bed: 500, gw: 10, diff: 'easy', notes: 'Glacioestuarine clay and silt.', zone: '7', hdd: 10500, cdd: 0, temp: 36 }
];

let soilSql = `INSERT INTO soil_data (id, zip_code, county, state, soil_class, thermal_conductivity_w_mk, bedrock_depth_ft, groundwater_depth_ft, drilling_difficulty, usgs_notes)\nVALUES\n`;
let climateSql = `INSERT INTO climate_data (id, zip_code, climate_zone, heating_degree_days, cooling_degree_days, avg_ground_temp_f, noaa_station_id)\nVALUES\n`;

const soilValues = [];
const climateValues = [];
let count = 0;

for (const city of cities) {
  for (const zip of city.zips) {
    count++;
    soilValues.push(`  (gen_random_uuid(), '${zip}', '${city.county}', '${city.state}', '${city.soil}', ${city.k}, ${city.bed}, ${city.gw}, '${city.diff}', '${city.notes}')`);
    climateValues.push(`  (gen_random_uuid(), '${zip}', '${city.zone}', ${city.hdd}, ${city.cdd}, ${city.temp}, 'NOAA-${zip}')`);
  }
}

soilSql += soilValues.join(',\n') + `\nON CONFLICT (zip_code) DO UPDATE SET
  soil_class = EXCLUDED.soil_class,
  thermal_conductivity_w_mk = EXCLUDED.thermal_conductivity_w_mk,
  bedrock_depth_ft = EXCLUDED.bedrock_depth_ft,
  groundwater_depth_ft = EXCLUDED.groundwater_depth_ft,
  drilling_difficulty = EXCLUDED.drilling_difficulty,
  usgs_notes = EXCLUDED.usgs_notes;`;

climateSql += climateValues.join(',\n') + `\nON CONFLICT (zip_code) DO UPDATE SET
  climate_zone = EXCLUDED.climate_zone,
  heating_degree_days = EXCLUDED.heating_degree_days,
  cooling_degree_days = EXCLUDED.cooling_degree_days,
  avg_ground_temp_f = EXCLUDED.avg_ground_temp_f;`;

fs.writeFileSync('seed_soil.sql', `-- Total Zip Codes Seeded: ${count}\n\n-- SCRIPT 1: SOIL DATA\n${soilSql}\n`);
fs.writeFileSync('seed_climate.sql', `-- Total Zip Codes Seeded: ${count}\n\n-- SCRIPT 2: CLIMATE DATA\n${climateSql}\n`);
console.log(`Generated ${count} zip codes`);
