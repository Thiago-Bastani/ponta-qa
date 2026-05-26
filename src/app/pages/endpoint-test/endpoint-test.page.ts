import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Project, Endpoint, KeyValuePair } from '../../models/project.model';
import { StorageService } from '../../services/storage.service';
import { ApiService, ApiResponse } from '../../services/api.service';

@Component({
  selector: 'app-endpoint-test',
  templateUrl: './endpoint-test.page.html',
  styleUrls: ['./endpoint-test.page.scss'],
  standalone: false,
})
export class EndpointTestPage {
  project!: Project;
  endpoint!: Endpoint;

  activeTab = 'params';
  bodyTab = 'json';

  response: ApiResponse | null = null;
  loading = false;
  showResponseHeaders = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storage: StorageService,
    private apiService: ApiService,
    private toastCtrl: ToastController
  ) {}

  ionViewWillEnter() {
    this.loadData();
  }

  loadData() {
    const projectId = this.route.snapshot.paramMap.get('projectId')!;
    const endpointId = this.route.snapshot.paramMap.get('endpointId')!;
    const project = this.storage.getProject(projectId);
    if (!project) { this.router.navigate(['/projects']); return; }
    const ep = project.endpoints.find(e => e.id === endpointId);
    if (!ep) { this.router.navigate(['/projects', projectId]); return; }
    this.project = project;
    this.endpoint = JSON.parse(JSON.stringify(ep));
    if (!this.endpoint.headers) this.endpoint.headers = [];
    if (!this.endpoint.params) this.endpoint.params = [];
    if (!this.endpoint.bodyFormData) this.endpoint.bodyFormData = [];
    if (!this.endpoint.bodyParams) this.endpoint.bodyParams = [];
    if (!this.endpoint.bodyJson) this.endpoint.bodyJson = '{}';
    this.response = null;
    this.bodyTab = this.endpoint.bodyType === 'none' ? 'json' : this.endpoint.bodyType;
  }

  get fullUrl(): string {
    const base = this.project.baseUrl.replace(/\/$/, '');
    const path = this.endpoint.path.startsWith('/') ? this.endpoint.path : '/' + this.endpoint.path;
    return base + path;
  }

  addPair(list: KeyValuePair[]) {
    list.push({ key: '', value: '', enabled: true });
  }

  removePair(list: KeyValuePair[], index: number) {
    list.splice(index, 1);
  }

  bodyTabChanged(event: any) {
    this.bodyTab = event.detail.value;
    this.endpoint.bodyType = this.bodyTab as any;
  }

  tabChanged(event: any) {
    this.activeTab = event.detail.value;
  }

  async send() {
    this.loading = true;
    this.response = null;
    try {
      this.response = await this.apiService.execute(this.project, this.endpoint);
    } catch (e: any) {
      const toast = await this.toastCtrl.create({
        message: 'Erro de rede: ' + (e.message || 'Verifique a URL e CORS'),
        duration: 3000,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  save() {
    const idx = this.project.endpoints.findIndex(e => e.id === this.endpoint.id);
    if (idx >= 0) {
      this.project.endpoints[idx] = { ...this.endpoint };
      this.storage.updateProject(this.project);
      this.toast('Endpoint salvo!');
    }
  }

  get statusColor(): string {
    if (!this.response) return 'medium';
    if (this.response.status >= 200 && this.response.status < 300) return 'success';
    if (this.response.status >= 300 && this.response.status < 400) return 'warning';
    return 'danger';
  }

  get formattedBody(): string {
    if (!this.response) return '';
    try { return JSON.stringify(JSON.parse(this.response.body), null, 2); } catch { return this.response.body; }
  }

  get responseHeadersList(): { key: string; value: string }[] {
    if (!this.response) return [];
    return Object.entries(this.response.headers).map(([key, value]) => ({ key, value }));
  }

  methodColor(method: string): string {
    const map: Record<string, string> = { GET: 'success', POST: 'primary', PUT: 'warning', PATCH: 'tertiary', DELETE: 'danger' };
    return map[method] || 'medium';
  }

  hasBody(): boolean {
    return ['POST', 'PUT', 'PATCH'].includes(this.endpoint.method);
  }

  private async toast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2000, position: 'bottom' });
    await t.present();
  }
}
