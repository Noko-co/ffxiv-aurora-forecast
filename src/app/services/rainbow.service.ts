// RainbowService - ported logic from scripts/rainbow.js to provide data to Angular UI
import { Injectable } from '@angular/core';
import { zoneWeathers, Zone, find } from './weather'
import { zoneNames, zoneGroup } from './zone'
import { formatEorzeaDate, formatEorzeaTime } from './utils'

@Injectable({ providedIn: 'root' })
export class RainbowService {

  // Modern Angular style uses inject() but we have no deps here.
  // We'll just keep the class structure clean.

  readonly preTargets = ['Rain', 'Showers', 'Thunderstorms'];
  readonly desTargets = ['Clear Skies', 'Fair Skies', 'Clouds', 'Wind', 'Dust Storms'];

  getGroupedEligibleZones(): { nameCn: string, zones: { name: Zone, nameCn: string }[] }[] {
    const eligible = this.getEligibleZones();
    const eligibleNames = new Set(eligible.map(z => z.name));

    return Object.entries(zoneGroup)
      .map(([groupName, groupZones]) => {
        const filteredZones = (groupZones as Zone[])
          .filter(z => eligibleNames.has(z))
          .map(z => ({ name: z, nameCn: zoneNames[z] }));

        if (filteredZones.length === 0) return null;

        return {
          nameCn: groupName,
          zones: filteredZones
        };
      })
      .filter((g): g is { nameCn: string, zones: { name: Zone, nameCn: string }[] } => g !== null);
  }

  getEligibleZones(): { name: Zone, nameCn: string }[] {
    return ([...Object.keys(zoneNames)] as Zone[])
      .filter(z => {
        const preIndex = zoneWeathers[z]
          .map((weather, index) => this.preTargets.includes(String(weather)) ? index : -1)
          .filter(index => index !== -1);

        const desIndex = zoneWeathers[z]
          .map((weather, index) => this.desTargets.includes(String(weather)) ? index : -1)
          .filter(index => index !== -1);

        return preIndex.length > 0 && desIndex.length > 0;
      })
      .map(z => ({ name: z, nameCn: zoneNames[z] }));
  }

  async getRainbowWindows(): Promise<any[]> {
    const zonesToCheck = this.getEligibleZones().map(z => z.name);
    const results: any[] = [];

    for (const z of zonesToCheck) {
      const preIndex = zoneWeathers[z]
        .map((weather, index) => this.preTargets.includes(String(weather)) ? index : -1)
        .filter(index => index !== -1);

      const desIndex = zoneWeathers[z]
        .map((weather, index) => this.desTargets.includes(String(weather)) ? index : -1)
        .filter(index => index !== -1);

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
    const ffm = ((175 * 1000) / 60)+1

    const match = m();
    const begin10 = new Date(match.begin.getTime() + 10 * ffm)
    const etBegin = formatEorzeaDate(begin10) + " " + formatEorzeaTime(begin10);
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
      begin: new Date(match.begin.getTime() + 10 * ffm),
      end: match.end,
      etBegin,
      etEnd,
      visibilityEnd: new Date(match.begin.getTime() + 30 * ffm),
      weathers:match.weathers,
      light:
        (level == 6) ? 'green' :
          (level >= 4) ? 'yellow' :
            (level >= 2) ? 'orange' :
              'red'
    };
  }
}