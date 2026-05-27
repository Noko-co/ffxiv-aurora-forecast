import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { DecimalPipe, DatePipe, CommonModule } from '@angular/common';
import { DiamondService } from '../services/diamond.service';
import { RouterLink } from "@angular/router";

@Component({
  standalone: true,
  selector: 'app-diamond',
  imports: [CommonModule, DecimalPipe, DatePipe, RouterLink],
  templateUrl: './diamond.component.html',
  styleUrls: ['./diamond.component.css'],
})
export class DiamondComponent implements OnInit, OnDestroy {
  private readonly diamondService = inject(DiamondService);
  
  // Signals for state management
  loading = signal(true);
  now = signal(new Date());
  allWindows = signal<any[]>([]);
  
  private timer: any;

  // Computed signal for grouped windows - reacts to both allWindows and now signals
  groupedWindows = computed(() => {
    const currentTime = this.now().getTime();
    const activeWindows = this.allWindows().filter((w: any) => w.visibilityEnd.getTime() > currentTime);
    
    const groups: Record<string, any[]> = {};
    activeWindows.forEach((w: any) => {
      if (!groups[w.zoneNameCn]) groups[w.zoneNameCn] = [];
      groups[w.zoneNameCn].push(w);
    });

    const zoneOrder = ['庫爾扎斯西部高地', '舊薩雷安'];
    return Object.entries(groups)
      .map(([name, wins]) => ({
        zoneNameCn: name,
        windows: wins.slice(0, 15)
      }))
      .sort((a, b) => zoneOrder.indexOf(a.zoneNameCn) - zoneOrder.indexOf(b.zoneNameCn));
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

  async initialLoad() {
    this.loading.set(true);
    await this.refresh();
    this.loading.set(false);
  }

  async refresh() {
    const windows = await this.diamondService.getDiamondWindows();
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
