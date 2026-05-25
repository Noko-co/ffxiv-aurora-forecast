// AuroraService - ported logic from scripts/aurora.js to provide data to Angular UI
import { Injectable } from '@angular/core';

const data: Record<string, any> = {
  'Coerthas Western Highlands': ['Blizzards', 20, 'Snow', 60, 'Fair Skies', 70, 'Clear Skies', 75, 'Clouds', 90, 'Fog'],
  'Old Sharlayan': ['Clear Skies', 10, 'Fair Skies', 50, 'Clouds', 70, 'Fog', 85, 'Snow'],
};

const zones = Object.keys(data);
const zoneWeathers: Record<string, string[]> = {};
for (const zone of zones) zoneWeathers[zone] = data[zone].filter((x: any, i: number) => i % 2 === 0);

function calculateForecastTarget(timestamp: number) {
  const unix = Math.trunc(timestamp / 1000);
  const bell = Math.trunc(unix / 175);
  const increment = (bell + 8 - (bell % 8)) % 24;
  const totalDays = Math.trunc(unix / 4200) >>> 0;
  const calcBase = totalDays * 0x64 + increment;
  const step1 = ((calcBase << 0xB) ^ calcBase) >>> 0;
  const step2 = ((step1 >>> 8) ^ step1) >>> 0;
  return step2 % 0x64;
}

let state: any = null;
const weatherDuration = 8 * 175 * 1000;
const future = 60;

function init() {
  const now = Date.now();
  const start = now - (now % (weatherDuration * 3)) - weatherDuration * 7;
  if (state?.start === start) return;

  const futureET = Math.ceil(future * 24 * 60 * 60 / 175 / 8) + 1;
  const forecasts = new Array(futureET);
  for (let i = 0; i < futureET; i++) forecasts[i] = calculateForecastTarget(start + weatherDuration * i);

  const weathers: Record<string, number[]> = {} as any;
  for (const zone of zones) {
    const forecastWeathers: number[] = new Array(100);
    let forecast = 0;
    for (let i = 0; i < 100; i++) {
      if (i === data[zone][forecast * 2 + 1]) forecast++;
      forecastWeathers[i] = forecast;
    }
    weathers[zone] = new Array(futureET);
    for (let i = 0; i < futureET; i++) weathers[zone][i] = forecastWeathers[forecasts[i]];
  }

  const getter = (zone: string, i: number, j: number, skipWeatherList?: boolean) => ({
    begin: new Date(start + i * 175 * 1000),
    end: new Date(start + j * 175 * 1000 - 1),
    duration: j - i,
    weathers: skipWeatherList ? [] : weathers[zone]
      .slice(Math.floor(i / 8) - 1, Math.floor((j - 1) / 8) + 1)
      .map((w: number) => zoneWeathers[zone][w]),
  });

  const buffer = new Array(futureET * 8);
  state = { start, weathers, getter, buffer };
}

function isHourIn(begin: number, end: number, hour: number): boolean {
  return (begin <= hour && hour <= end) || (end < begin && (hour <= end || begin <= hour));
}

function hasWeather(weathers: ReadonlySet<number> | undefined, weather: number): boolean {
  return weathers === undefined || weathers.size === 0 || weathers.has(weather);
}

function find(condition: {
  zone: string,
  desiredWeathers?: ReadonlySet<number>,
  previousWeathers?: ReadonlySet<number>,
  hours?: ReadonlySet<number>,
  beginHour?: number,
  endHour?: number,
}) {
  init();
  const zone = condition.zone;
  const desiredWeatherMask = zoneWeathers[zone].map((_: any, i: number) => hasWeather(condition.desiredWeathers, i));
  const previousWeatherMask = zoneWeathers[zone].map((_: any, i: number) => hasWeather(condition.previousWeathers, i));
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

  const ret: any[] = [];
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

@Injectable({ providedIn: 'root' })
export class AuroraService {
  private zoneNames: Record<string, string> = {
    'Coerthas Western Highlands': '庫爾扎斯西部高地',
    'Old Sharlayan': '舊薩雷安',
  };

  // Modern Angular style uses inject() but we have no deps here.
  // We'll just keep the class structure clean.

  async getAuroraWindows(): Promise<any[]> {
    const zonesToCheck = ['Coerthas Western Highlands', 'Old Sharlayan'];
    const results: any[] = [];
    
    for (const z of zonesToCheck) {
      const clearIndex = zoneWeathers[z].indexOf('Clear Skies');
      if (clearIndex === -1) continue;

      // ET 00:00 weather block is represented by beginHour: 0
      // FFXIV weather changes at 0, 8, 16.
      const matches = find({ 
        zone: z, 
        desiredWeathers: new Set([clearIndex]), 
        beginHour: 0, 
        endHour: 0 
      });

      const zoneWindows = matches.map((m: any) => {
        const match = m(true);
        const etBegin = Math.floor(match.begin.getTime() / 1000 / 175) % 24;
        const etEnd = (etBegin + 8) % 24;
        
        return {
          zoneName: z,
          zoneNameCn: this.zoneNames[z],
          begin: match.begin,
          end: match.end,
          etBegin,
          etEnd,
          // Aurora is visible ET 00:00 ~ 04:00
          visibilityEnd: new Date(match.begin.getTime() + 4 * 175 * 1000),
        };
      });
      results.push(...zoneWindows);
    }

    // Sort by real time
    return results.sort((a, b) => a.begin.getTime() - b.begin.getTime());
  }
}
