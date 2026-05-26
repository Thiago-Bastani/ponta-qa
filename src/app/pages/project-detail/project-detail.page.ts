import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Project, Endpoint, AuthConfig } from '../../models/project.model';
import { StorageService } from '../../services/storage.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-project-detail',
  templateUrl: './project-detail.page.html',
  styleUrls: ['./project-detail.page.scss'],
  standalone: false,
})
export class ProjectDetailPage {
  project: Project = { id: '', name: '', description: '', baseUrl: '', auth: { type: 'none' }, endpoints: [] };
  activeTab = 'endpoints';

  auth: AuthConfig = { type: 'none' };
  loginTestResponse = '';
  testingLogin = false;

  showEndpointModal = false;
  newEndpoint = { name: '', method: 'GET', path: '' };

  showEditModal = false;
  editingEndpointId = '';
  editEndpoint = { name: '', method: 'GET', path: '' };

  readonly methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storage: StorageService,
    private apiService: ApiService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) {}

  ionViewWillEnter() {
    this.loadProject();
  }

  loadProject() {
    const id = this.route.snapshot.paramMap.get('projectId')!;
    const project = this.storage.getProject(id);
    if (!project) { this.router.navigate(['/projects']); return; }
    this.project = project;
    this.auth = { ...project.auth };
    this.loginTestResponse = '';
  }

  private reloadProject() {
    const id = this.route.snapshot.paramMap.get('projectId')!;
    const project = this.storage.getProject(id);
    if (project) {
      this.project = project;
      this.cdr.detectChanges();
    }
  }

  goBack() {
    this.router.navigate(['/projects']);
  }

  openEndpoint(endpoint: Endpoint) {
    this.router.navigate(['/endpoint-test', this.project.id, endpoint.id]);
  }

  openEndpointModal() {
    this.newEndpoint = { name: '', method: 'GET', path: '' };
    this.showEndpointModal = true;
  }

  closeEndpointModal() {
    this.showEndpointModal = false;
  }

  openEditEndpointModal(endpoint: Endpoint, event: Event) {
    event.stopPropagation();
    this.editingEndpointId = endpoint.id;
    this.editEndpoint = { name: endpoint.name, method: endpoint.method, path: endpoint.path };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  saveEditEndpoint() {
    if (!this.editEndpoint.name.trim() || !this.editEndpoint.path.trim()) return;
    const ep = this.project.endpoints.find(e => e.id === this.editingEndpointId);
    if (ep) {
      ep.name = this.editEndpoint.name.trim();
      ep.method = this.editEndpoint.method as any;
      ep.path = this.editEndpoint.path.trim();
      this.storage.updateProject(this.project);
      this.reloadProject();
    }
    this.showEditModal = false;
  }

  addEndpoint() {
    if (!this.newEndpoint.name.trim() || !this.newEndpoint.path.trim()) return;
    const endpoint: Endpoint = {
      id: Date.now().toString(),
      name: this.newEndpoint.name.trim(),
      method: this.newEndpoint.method as any,
      path: this.newEndpoint.path.trim(),
      headers: [],
      params: [],
      bodyType: 'none',
      bodyJson: '{}',
      bodyFormData: [],
      bodyParams: [],
    };
    this.project.endpoints.push(endpoint);
    this.storage.updateProject(this.project);
    this.showEndpointModal = false;
    this.reloadProject();
  }

  async confirmDeleteEndpoint(endpoint: Endpoint, event: Event) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Excluir endpoint',
      message: `Deseja excluir "${endpoint.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.project.endpoints = this.project.endpoints.filter(e => e.id !== endpoint.id);
            this.storage.updateProject(this.project);
            this.reloadProject();
          },
        },
      ],
    });
    await alert.present();
  }

  saveAuth() {
    this.project.auth = { ...this.auth };
    this.storage.updateProject(this.project);
    this.reloadProject();
    this.toast('Autenticação salva!');
  }

  async testLogin() {
    this.testingLogin = true;
    this.loginTestResponse = '';
    try {
      this.loginTestResponse = await this.apiService.testLogin(this.auth, this.project.baseUrl);
    } catch (e: any) {
      this.loginTestResponse = 'Erro: ' + (e.message || 'Falha na requisição');
    } finally {
      this.testingLogin = false;
    }
  }

  methodColor(method: string): string {
    const map: Record<string, string> = { GET: 'success', POST: 'primary', PUT: 'warning', PATCH: 'tertiary', DELETE: 'danger' };
    return map[method] || 'medium';
  }

  segmentChanged(event: any) {
    this.activeTab = event.detail.value;
  }

  private async toast(message: string) {
    const t = await this.toastCtrl.create({ message, duration: 2000, position: 'bottom' });
    await t.present();
  }
}
