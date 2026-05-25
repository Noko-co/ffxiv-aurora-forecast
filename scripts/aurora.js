// aurora.js - minimal port of needed logic from Asvel/ffxiv-weather (Weather.ts)
const data = {
  'Coerthas Western Highlands': ['Blizzards', 20, 'Snow', 60, 'Fair Skies', 70, 'Clear Skies', 75, 'Clouds', 90, 'Fog'],
  'Old Sharlayan': ['Clear Skies', 10, 'Fair Skies', 50, 'Clouds', 70, 'Fog', 85, 'Snow'],
};

const zones = Object.keys(data);
const zoneWeathers = {};
for (const zone of zones) {
  zoneWeathers[zone] = data[zone].filter((x, i) => i % 2 === 0);
}

function calculateForecastTarget(timestamp) {
  const unix = Math.trunc(timestamp / 1000);
  const bell = Math.trunc(unix / 175);
  const increment = (bell + 8 - (bell % 8)) % 24;
  const totalDays = Math.trunc(unix / 4200) >>> 0;
  const calcBase = totalDays * 0x64 + increment;
  const step1 = ((calcBase << 0xB) ^ calcBase) >>> 0;
  const step2 = ((step1 >>> 8) ^ step1) >>> 0;
  return step2 % 0x64;
}

let state = null;
const weatherDuration = 8 * 175 * 1000;
const future = 60;

function init() {
  const now = Date.now();
  const start = now - (now % (weatherDuration * 3)) - weatherDuration * 7;
  if (state?.start === start) return;

  const futureET = Math.ceil(future * 24 * 60 * 60 / 175 / 8) + 1;
  const forecasts = new Array(futureET);
  for (let i = 0; i < futureET; i++) {
    forecasts[i] = calculateForecastTarget(start + weatherDuration * i);
  }

  const weathers = {};
  for (const zone of zones) {
    const forecastWeathers = new Array(100);
    let forecast = 0;
    for (let i = 0; i < 100; i++) {
      if (i === data[zone][forecast * 2 + 1]) forecast++;
      forecastWeathers[i] = forecast;
    }
    weathers[zone] = new Array(futureET);
    for (let i = 0; i < futureET; i++) {
      weathers[zone][i] = forecastWeathers[forecasts[i]];
    }
  }

  const getter = (zone, i, j, skipWeatherList) => ({
    begin: new Date(start + i * 175 * 1000),
    end: new Date(start + j * 175 * 1000 - 1),
    duration: j - i,
    weathers: skipWeatherList ? [] : weathers[zone]
      .slice(Math.floor(i / 8) - 1, Math.floor((j - 1) / 8) + 1)
      .map(w => zoneWeathers[zone][w]),
  });

  const buffer = new Array(futureET * 8);
  state = { start, weathers, getter, buffer };
}

function isHourIn(begin, end, hour) {
  return (begin <= hour && hour <= end) || (end < begin && (hour <= end || begin <= hour));
}

function hasWeather(weathers, weather) {
  return weathers === undefined || weathers.size === 0 || weathers.has(weather);
}

function find(condition) {
  init();
  const zone = condition.zone;
  const zoneWeatherList = zoneWeathers[zone];
  const desiredWeatherMask = zoneWeatherList.map((_, i) => hasWeather(condition.desiredWeathers, i));
  const previousWeatherMask = zoneWeatherList.map((_, i) => hasWeather(condition.previousWeathers, i));
  const weathers = state.weathers[zone];

  const hourMask = Array.from({ length: 24 }, (_, i) => condition.hours?.has(i) ??
    isHourIn(condition.beginHour ?? 0, condition.endHour ?? 23, i));
  const baseHour = Math.round(state.start / 175 / 100);

  const matched = state.buffer.fill(false);
  for (let i = 8; i < matched.length; i++) {
    const weatherIndex = Math.floor(i / 8);
    if (!desiredWeatherMask[weathers[weatherIndex]]) continue;
    if (!previousWeatherMask[weathers[weatherIndex - 1]]) continue;
    if (!hourMask[(baseHour + i) % 24]) continue;
    matched[i] = true;
  }

  const ret = [];
  let i = 0;
  let j = 0;
  while (true) {
    i = j;
    while (matched[i] === false) i++;
    if (i >= matched.length) break;
    j = i;
    while (matched[j] === true) j++;
    ret.push(state.getter.bind(null, zone, i, j));
  }
  return ret;
}

function listAuroraWindows() {
  const zonesToCheck = ['Coerthas Western Highlands', 'Old Sharlayan'];
  const results = {};
  for (const z of zonesToCheck) {
    const clearIndex = zoneWeathers[z].indexOf('Clear Skies');
    if (clearIndex === -1) {
      results[z] = [];
      continue;
    }
    const matches = find({ zone: z, desiredWeathers: new Set([clearIndex]), beginHour: 8, endHour: 15 });
    results[z] = matches.map(m => m());
  }
  return results;
}

function formatDate(d) {
  return d.toLocaleString('en-US', { timeZoneName: 'short' });
}

function main() {
  console.log('Aurora windows (ET 00:00-08:00 where weather is Clear Skies) -> real times:');
  const res = listAuroraWindows();
  for (const z of Object.keys(res)) {
    console.log('\n== ' + z + ' ==');
    if (res[z].length === 0) {
      console.log('  (no upcoming windows found in search range)');
      continue;
    }
    for (const m of res[z]) {
      // Compute ET hours directly: 1 ET hour = 175 real seconds
      const etBegin = Math.floor(m.begin.getTime() / 1000 / 175) % 24;
      const etEnd = Math.floor(m.end.getTime() / 1000 / 175) % 24;
      console.log(`  ET ${String(etBegin).padStart(2,'0')}:00 - ET ${String(etEnd).padStart(2,'0')}:00 => Real ${formatDate(m.begin)} - ${formatDate(m.end)}`);
      console.log(`    Weathers: ${m.weathers.join(', ')}`);
    }
  }
  console.log('\nAurora appearance conditions (補充):');
  console.log('  1) 在庫爾扎斯西部高地或舊薩雷安');
  console.log('  2) 當日 ET 00:00 為 碧空 (Clear Skies)');
  console.log('  3) 可在 ET 換日時段出現，約 ET 00:00 ~ 04:00 可見');
}

main();
