import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { DatePipe, CommonModule } from '@angular/common';
import { RainbowService } from '../services/rainbow.service';
import { RouterLink } from "@angular/router";

@Component({
  standalone: true,
  selector: 'app-rainbow',
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './rainbow.component.html',
  styleUrls: ['./rainbow.component.css'],
})
export class RainbowComponent implements OnInit, OnDestroy {

  private readonly rainbowService = inject(RainbowService);

  // Signals for state management
  loading = signal(true);
  now = signal(new Date());
  allWindows = signal<any[]>([]);
  expandedGroups = signal<Set<number>>(new Set());

  groupedEligibleZones = signal<{ nameCn: string, zones: { name: string, nameCn: string }[] }[]>([]);
  isFilterExpanded = signal(false);
  selectedZones = signal<Set<string>>(new Set());

  private timer: any;

  // Computed signal for grouped windows - reacts to both allWindows and now signals
  groupedWindows = computed(() => {
    const currentTime = this.now().getTime();
    const selected = this.selectedZones();

    let activeWindows = this.allWindows().filter((w: any) => w.visibilityEnd.getTime() > currentTime);

    if (selected.size > 0) {
      activeWindows = activeWindows.filter((w: any) => selected.has(w.zoneName));
    }

    const groups: Record<number, any[]> = {};
    activeWindows.forEach((w: any) => {
      const timestamp = w.begin.getTime();
      if (!groups[timestamp]) groups[timestamp] = [];
      groups[timestamp].push(w);
    });


    return Object.entries(groups).slice(0, 30)
      .map(([timestamp, val]) => ({
        timestamp: Number(timestamp),
        begin: val[0]?.begin,
        end: val[0]?.end,
        etBegin: val[0]?.etBegin,
        etEnd: val[0]?.etEnd,
        visibilityEnd: val[0]?.visibilityEnd,
        zone: val.map(z => {
          return {
            zoneName: z.zoneName,
            zoneNameCn: z.zoneNameCn,
            weather: z.weathers?.[1] || ""
          }
        }),
        light: val[0]?.light,
      }))
  });

  weathersCn(name:string) {
    let cn = "";
    switch (name) {
      case "Clear Skies": cn = "碧"; break;
      case "Fair Skies": cn = "晴"; break;
      case "Clouds": cn = "雲"; break;
      case "Wind": cn = "風"; break;
      case "Dust Storms": cn = "沙"; break;
    }
    return (cn) ? `(${cn})` : "";
  }

  ngOnInit() {
    this.groupedEligibleZones.set(this.rainbowService.getGroupedEligibleZones());
    this.initialLoad();
    this.timer = setInterval(() => {
      this.now.set(new Date());
    }, 1000);
  }

  toggleFilter() {
    this.isFilterExpanded.set(!this.isFilterExpanded());
  }

  toggleZone(zoneName: string) {
    const next = new Set(this.selectedZones());
    if (next.has(zoneName)) {
      next.delete(zoneName);
    } else {
      next.add(zoneName);
    }
    this.selectedZones.set(next);
  }

  isSelected(zoneName: string): boolean {
    return this.selectedZones().has(zoneName);
  }

  toggleGroup(group: { nameCn: string, zones: { name: string, nameCn: string }[] }) {
    const next = new Set(this.selectedZones());
    const allSelected = group.zones.every(z => next.has(z.name));

    if (allSelected) {
      group.zones.forEach(z => next.delete(z.name));
    } else {
      group.zones.forEach(z => next.add(z.name));
    }
    this.selectedZones.set(next);
  }

  isGroupSelected(group: { nameCn: string, zones: { name: string, nameCn: string }[] }): boolean {
    return group.zones.every(z => this.selectedZones().has(z.name));
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  toggleExpand(timestamp: number) {
    const next = new Set(this.expandedGroups());
    if (next.has(timestamp)) {
      next.delete(timestamp);
    } else {
      next.add(timestamp);
    }
    this.expandedGroups.set(next);
  }

  isExpanded(timestamp: number): boolean {
    return this.expandedGroups().has(timestamp);
  }

  async initialLoad() {
    this.loading.set(true);
    await this.refresh();
    this.loading.set(false);
  }

  async refresh() {
    const windows = await this.rainbowService.getRainbowWindows();
    this.allWindows.set(windows);
  }

  isUpcoming(w: any): boolean {
    return w.begin.getTime() > this.now().getTime();
  }

  isActive(w: any): boolean {
    const current = this.now().getTime();
    return current >= w.begin.getTime() && current <= w.visibilityEnd.getTime();
  }

  getProgressWidth(w: any): number {
    const current = this.now().getTime();
    const start = w.begin.getTime();
    const end = w.visibilityEnd.getTime();
    const progress = ((current - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  getCountdown(w: any): string {
    const diff = w.begin.getTime() - this.now().getTime();
    if (diff <= 0) return '';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    let result = '';
    if (days > 0) result += `${days}天 `;
    if (hours > 0 || days > 0) result += `${hours}時 `;
    result += `${mins}分${secs}秒`;
    return result;
  }
}
