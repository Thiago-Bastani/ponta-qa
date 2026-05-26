import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectDetailPage } from './project-detail.page';

const routes: Routes = [{ path: '', component: ProjectDetailPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectDetailPageRoutingModule {}
