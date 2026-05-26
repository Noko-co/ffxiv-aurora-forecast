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
      const desTargets = ['Clear Skies', 'Fair Skies', 'Clouds', 'Wind', 'Dust Storms'];

      const preIndex = zoneWeathers[z]
        .map((weather, index) => preTargets.includes(String(weather)) ? index : -1)
        .filter(index => index !== -1); // 這裡要過濾的是 -1，保留 0 

      const desIndex = zoneWeathers[z]
        .map((weather, index) => desTargets.includes(String(weather)) ? index : -1)
        .filter(index => index !== -1);

      if (preIndex.length == 0 || desIndex.length == 0)
        continue;

      // ET 00:00 weather block is represented by beginHour: 0
      // FFXIV weather changes at 0, 8, 16.
      const matches = find({
        zone: z,
        previousWeathers: new Set(preIndex),
        desiredWeathers: new Set(desIndex),
        beginHour: 8,
        endHour: 16
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
    const etBegin = formatEorzeaDate(match.begin) + " " + formatEorzeaTime(match.begin);
    const etEnd = formatEorzeaDate(match.end) + " " + formatEorzeaTime(match.end);
    var dt = Number(formatEorzeaDate(match.begin).substring(3) + formatEorzeaTime(match.begin).substring(0, 2));
    let level = 0;

    if (dt >= 3212 || dt <= 112)
      level = 6;
    else if (dt >= 3112 || dt < 212)
      level = 5;
    else if (dt >= 3012 || dt <= 312)
      level = 4;
    else if (dt >= 2912 || dt <= 412)
      level = 3;
    else if (dt >= 2812 || dt <= 512)
      level = 2;
    else if (dt >= 2712 || dt <= 612)
      level = 1;

    return {
      zoneName: z,
      zoneNameCn: zoneNames[z],
      begin: match.begin,
      end: match.end,
      etBegin,
      etEnd,
      visibilityEnd: new Date(match.begin.getTime() + 0.5 * 175 * 1000),
      light:
        (level == 6) ? 'green' :
          (level >= 4) ? 'yellow' :
            (level >= 2) ? 'orange' :
              'red'
    };
  }
}