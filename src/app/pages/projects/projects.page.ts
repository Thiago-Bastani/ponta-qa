import { Component } from '@angular/core';
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

  constructor(
    private storage: StorageService,
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  ionViewWillEnter() {
    this.projects = this.storage.getProjects();
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
    this.projects = this.storage.getProjects();
    this.showModal = false;
  }

  openProject(project: Project) {
    this.router.navigate(['/projects', project.id]);
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
            this.projects = this.storage.getProjects();
          },
        },
      ],
    });
    await alert.present();
  }
}
