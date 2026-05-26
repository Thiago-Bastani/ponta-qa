import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HistoryEntry } from '../../models/project.model';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-history-detail',
  templateUrl: './history-detail.page.html',
  styleUrls: ['./history-detail.page.scss'],
  standalone: false,
})
export class HistoryDetailPage {
  entry: HistoryEntry | null = null;
  projectId = '';
  endpointId = '';
  showHeaders = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storage: StorageService
  ) {}

  ionViewWillEnter() {
    this.projectId = this.route.snapshot.paramMap.get('projectId')!;
    this.endpointId = this.route.snapshot.paramMap.get('endpointId')!;
    const historyId = this.route.snapshot.paramMap.get('historyId')!;

    const project = this.storage.getProject(this.projectId);
    const endpoint = project?.endpoints.find(e => e.id === this.endpointId);
    this.entry = endpoint?.history?.find(h => h.id === historyId) ?? null;

    if (!this.entry) this.router.navigate(['/endpoint-test', this.projectId, this.endpointId]);
  }

  goBack() {
    this.router.navigate(['/endpoint-test', this.projectId, this.endpointId]);
  }

  get statusColor(): string {
    if (!this.entry) return 'medium';
    if (this.entry.status >= 200 && this.entry.status < 300) return 'success';
    if (this.entry.status >= 300 && this.entry.status < 400) return 'warning';
    return 'danger';
  }

  get formattedBody(): string {
    if (!this.entry) return '';
    try { return JSON.stringify(JSON.parse(this.entry.responseBody), null, 2); } catch { return this.entry.responseBody; }
  }

  get headersList(): { key: string; value: string }[] {
    if (!this.entry) return [];
    return Object.entries(this.entry.responseHeaders).map(([key, value]) => ({ key, value }));
  }

  get formattedDate(): string {
    if (!this.entry) return '';
    return new Date(this.entry.timestamp).toLocaleString('pt-BR');
  }

  methodColor(method: string): string {
    const map: Record<string, string> = { GET: 'success', POST: 'primary', PUT: 'warning', PATCH: 'tertiary', DELETE: 'danger' };
    return map[method] || 'medium';
  }
}
