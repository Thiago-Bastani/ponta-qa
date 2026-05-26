import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Project } from '../../models/project.model';
import { StorageService } from '../../services/storage.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.page.html',
  styleUrls: ['./projects.page.scss'],
  standalone: false,
})
export class ProjectsPage {
  projects: Project[] = [];
  showModal = false;
  newProject = { name: '', description: '', baseUrl: '' };

  showEditModal = false;
  editingProjectId = '';
  editProject = { name: '', description: '', baseUrl: '' };

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private storage: StorageService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private cdr: ChangeDetectorRef
  ) {}

  ionViewWillEnter() {
    this.reload();
  }

  private reload() {
    this.projects = this.storage.getProjects();
    this.cdr.detectChanges();
  }

  openModal() {
    this.newProject = { name: '', description: '', baseUrl: '' };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  createProject() {
    if (!this.newProject.name.trim() || !this.newProject.baseUrl.trim()) return;
    const project: Project = {
      id: Date.now().toString(),
      name: this.newProject.name.trim(),
      description: this.newProject.description.trim(),
      baseUrl: this.newProject.baseUrl.trim(),
      auth: { type: 'none' },
      endpoints: [],
    };
    this.storage.updateProject(project);
    this.showModal = false;
    this.reload();
  }

  openProject(project: Project) {
    this.router.navigate(['/projects', project.id]);
  }

  openEditModal(project: Project, event: Event) {
    event.stopPropagation();
    this.editingProjectId = project.id;
    this.editProject = { name: project.name, description: project.description || '', baseUrl: project.baseUrl };
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
  }

  saveEdit() {
    if (!this.editProject.name.trim() || !this.editProject.baseUrl.trim()) return;
    const project = this.storage.getProject(this.editingProjectId);
    if (project) {
      project.name = this.editProject.name.trim();
      project.baseUrl = this.editProject.baseUrl.trim();
      project.description = this.editProject.description.trim();
      this.storage.updateProject(project);
    }
    this.showEditModal = false;
    this.reload();
  }

  async duplicateProject(project: Project, event: Event) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Duplicar projeto',
      message: `Duplicar "${project.name}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Duplicar',
          handler: () => {
            const copy: Project = JSON.parse(JSON.stringify(project));
            copy.id = Date.now().toString();
            copy.name = project.name + ' (cópia)';
            copy.endpoints = copy.endpoints.map(ep => ({ ...ep, id: Date.now().toString() + Math.random() }));
            this.storage.updateProject(copy);
            this.reload();
          },
        },
      ],
    });
    await alert.present();
  }

  exportAll() {
    this.download(this.storage.getProjects(), `ponta-qa-all-${new Date().toISOString().slice(0, 10)}.json`);
  }

  exportProject(project: Project, event: Event) {
    event.stopPropagation();
    const slug = project.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    this.download([project], `ponta-qa-${slug}-${new Date().toISOString().slice(0, 10)}.json`);
  }

  private download(projects: Project[], filename: string) {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  triggerImport() {
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    let imported: Project[];
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      imported = Array.isArray(parsed) ? parsed : [parsed];
      if (!imported.every(p => p.id && p.name && p.baseUrl !== undefined)) throw new Error();
    } catch {
      this.toast('Arquivo inválido ou corrompido.', 'danger');
      return;
    }

    const existing = this.storage.getProjects();
    const existingNames = new Set(existing.map(p => p.name));

    for (const p of imported) {
      p.id = Date.now().toString() + Math.random().toString(36).slice(2);
      if (existingNames.has(p.name)) {
        p.name = '(Novo) ' + p.name;
      }
      this.storage.updateProject(p);
    }
    this.reload();
    this.toast(`${imported.length} projeto(s) importado(s).`);
  }

  private async toast(message: string, color: string = 'success') {
    const t = await this.toastCtrl.create({ message, duration: 2500, position: 'bottom', color });
    await t.present();
  }

  async confirmDelete(project: Project, event: Event) {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Excluir projeto',
      message: `Deseja excluir "${project.name}"? Todos os endpoints serão removidos.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.storage.deleteProject(project.id);
            this.reload();
          },
        },
      ],
    });
    await alert.present();
  }
}
