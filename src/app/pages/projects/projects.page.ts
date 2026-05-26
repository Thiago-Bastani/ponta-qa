import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
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

  constructor(
    private storage: StorageService,
    private router: Router,
    private alertCtrl: AlertController,
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
