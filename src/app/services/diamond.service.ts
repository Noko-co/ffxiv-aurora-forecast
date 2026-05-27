// DiamondService - ported logic from scripts/diamond.js to provide data to Angular UI
import { Injectable } from '@angular/core';
import { zoneWeathers, Zone, find } from './weather'

@Injectable({ providedIn: 'root' })
export class DiamondService {
  private zoneNames: Record<string, string> = {
    'Coerthas Western Highlands': '庫爾扎斯西部高地',
  };

  // Modern Angular style uses inject() but we have no deps here.
  // We'll just keep the class structure clean.

  async getDiamondWindows(): Promise<any[]> {
    const zonesToCheck = ['Coerthas Western Highlands'] as Zone[];
    const results: any[] = [];

    for (const z of zonesToCheck) {
      const clearIndex = zoneWeathers[z].indexOf('Fair Skies');
      if (clearIndex === -1) continue;

      // ET 00:00 weather block is represented by beginHour: 0
      // FFXIV weather changes at 0, 8, 16.
      const matches = find({
        zone: z,
        desiredWeathers: new Set([clearIndex]),
        beginHour: 6,
        endHour: 10
      });

      const zoneWindows = matches.map((m: any) => this.zoneFormat(z, m));
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
      zoneNameCn: this.zoneNames[z],
      begin: match.begin,
      end: match.end,
      etBegin,
      etEnd,
      // Diamond is visible ET 00:00 ~ 04:00
      visibilityEnd: new Date(match.begin.getTime() + 2 * 175 * 1000),
    };
  }
}
