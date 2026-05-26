import { Injectable } from '@angular/core';
import { Project } from '../models/project.model';

const STORAGE_KEY = 'ponta_qa_projects';

@Injectable({ providedIn: 'root' })
export class StorageService {
  getProjects(): Project[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  saveProjects(projects: Project[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }

  getProject(id: string): Project | undefined {
    return this.getProjects().find(p => p.id === id);
  }

  updateProject(project: Project): void {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
      projects[index] = project;
    } else {
      projects.push(project);
    }
    this.saveProjects(projects);
  }

  deleteProject(id: string): void {
    this.saveProjects(this.getProjects().filter(p => p.id !== id));
  }
}
