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
  
  private timer: any;

  // Computed signal for grouped windows - reacts to both allWindows and now signals
  groupedWindows = computed(() => {
    const currentTime = this.now().getTime();
    const activeWindows = this.allWindows().filter((w: any) => w.visibilityEnd.getTime() > currentTime);
    
    const groups: Record<number, any[]> = {};
    activeWindows.forEach((w: any) => {
      const timestamp = w.begin.getTime();
      if (!groups[timestamp]) groups[timestamp] = [];
      groups[timestamp].push(w);
    });


    return Object.entries(groups).slice(0, 15)
      .map(([timestamp, val]) => ({
        timestamp: Number(timestamp),
        begin: val[0]?.begin,
        end: val[0]?.end,
        etBegin: val[0]?.etBegin,
        etEnd: val[0]?.etEnd,
        visibilityEnd: val[0]?.visibilityEnd,
        zoneName: val.map(z=>z.zoneName),
        zoneNameCn: val.map(z=>z.zoneNameCn),
        light: val[0]?.light,
      }))
  });

  ngOnInit() {
    this.initialLoad();
    this.timer = setInterval(() => {
      this.now.set(new Date());
    }, 1000);
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
