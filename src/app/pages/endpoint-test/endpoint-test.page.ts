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
  project: Project = { id: '', name: '', description: '', baseUrl: '', auth: { type: 'none' }, endpoints: [] };
  endpoint: Endpoint = { id: '', name: '', method: 'GET', path: '', headers: [], params: [], bodyType: 'none', bodyJson: '{}', bodyFormData: [], bodyParams: [] };

  activeTab = 'params';
  bodyTab = 'json';
  variables: { [key: string]: string } = {};

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
    this.variables = { ...(this.endpoint.variables || {}) };
    this.response = null;
    this.showResponseHeaders = false;
    if (this.endpoint.bodyType === 'none' && this.hasBody()) {
      this.endpoint.bodyType = 'json';
    }
    this.bodyTab = this.endpoint.bodyType === 'none' ? 'json' : this.endpoint.bodyType;
  }

  // Detecta todos os {var} nos campos do endpoint
  get detectedVars(): string[] {
    const vars = new Set<string>();
    const scan = (str: string) => {
      const re = /\{([^}]+)\}/g;
      let m;
      while ((m = re.exec(str || '')) !== null) vars.add(m[1]);
    };
    scan(this.endpoint.path);
    scan(this.endpoint.bodyJson || '');
    [...(this.endpoint.params || []), ...(this.endpoint.headers || []),
     ...(this.endpoint.bodyFormData || []), ...(this.endpoint.bodyParams || [])]
      .forEach(p => { scan(p.key); scan(p.value); });
    return [...vars];
  }

  get fullUrl(): string {
    const base = this.project.baseUrl.replace(/\/$/, '');
    const path = this.endpoint.path.startsWith('/') ? this.endpoint.path : '/' + this.endpoint.path;
    return base + this.applyVars(path);
  }

  // Aplica variáveis a uma string
  private applyVars(str: string): string {
    return str.replace(/\{([^}]+)\}/g, (_, key) => this.variables[key] ?? `{${key}}`);
  }

  // Cria cópia do endpoint com todas as variáveis substituídas
  private resolveEndpoint(): Endpoint {
    const ep: Endpoint = JSON.parse(JSON.stringify(this.endpoint));
    const r = (s: string) => this.applyVars(s);
    ep.path = r(ep.path);
    if (ep.bodyJson) ep.bodyJson = r(ep.bodyJson);
    const applyList = (list: KeyValuePair[]) => list.map(p => ({ ...p, key: r(p.key), value: r(p.value) }));
    ep.params = applyList(ep.params);
    ep.headers = applyList(ep.headers);
    ep.bodyFormData = applyList(ep.bodyFormData || []);
    ep.bodyParams = applyList(ep.bodyParams || []);
    return ep;
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
    if (this.loading) return;
    this.loading = true;
    this.response = null;
    this.showResponseHeaders = false;
    if (this.hasBody()) {
      this.endpoint.bodyType = this.bodyTab as any;
    }
    try {
      this.response = await this.apiService.execute(this.project, this.resolveEndpoint());
      this.showResponseHeaders = true;
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
      this.project.endpoints[idx] = { ...this.endpoint, variables: { ...this.variables } };
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
