// RainbowService - ported logic from scripts/rainbow.js to provide data to Angular UI
import { Injectable } from '@angular/core';
import { zoneWeathers, Zone, find } from './weather'
import { zoneNames } from './zone'
import { formatEorzeaDate, formatEorzeaTime } from './utils'

@Injectable({ providedIn: 'root' })
export class RainbowService {

  // Modern Angular style uses inject() but we have no deps here.
  // We'll just keep the class structure clean.

  async getRainbowWindows(): Promise<any[]> {
    const zonesToCheck = [...Object.keys(zoneNames)] as Zone[];
    const results: any[] = [];

    for (const z of zonesToCheck) {
      const preTargets = ['Rain', 'Showers', 'Thunderstorms'];
      const desTargets = ['Clear Skies', 'Fair Skies', 'Clouds', 'Wind'];

      const preIndex = zoneWeathers[z]
        .map((weather, index) => preTargets.includes(String(weather)) ? index : -1)
        .filter(index => index !== -1); // 這裡要過濾的是 -1，保留 0 

      const desIndex = zoneWeathers[z]
        .map((weather, index) => desTargets.includes(String(weather)) ? index : -1)
        .filter(index => index !== -1);

      // ET 00:00 weather block is represented by beginHour: 0
      // FFXIV weather changes at 0, 8, 16.
      const matches = find({
        zone: z,
        previousWeathers: new Set(preIndex),
        desiredWeathers: new Set(desIndex),
        beginHour: 6,
        endHour: 18
      });

      const zoneWindows
        = matches.filter(m => {
          const match = m(true);
          var dt = Number(formatEorzeaDate(match.begin).substring(3) + formatEorzeaTime(match.begin).substring(0, 2));
          return (dt > 2712 || dt < 612)
        })
          .map((m: any) => this.zoneFormat(z, m));
      results.push(...zoneWindows);
    }
    // Sort by real time
    return results.sort((a, b) => a.begin.getTime() - b.begin.getTime());
  }

  zoneFormat(z: Zone, m: any) {
    const match = m(true);
    const etBegin = Math.floor(match.begin.getTime() / 1000 / 175) % 24;
    const etEnd = (etBegin + 8) % 24;

    return {
      zoneName: z,
      zoneNameCn: zoneNames[z],
      begin: match.begin,
      end: match.end,
      etBegin,
      etEnd,
      // Rainbow is visible ET 00:00 ~ 04:00
      visibilityEnd: new Date(match.begin.getTime() + 4 * 175 * 1000),
    };
  }
}