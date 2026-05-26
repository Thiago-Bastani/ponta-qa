import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'projects', pathMatch: 'full' },
  {
    path: 'projects',
    loadChildren: () => import('./pages/projects/projects.module').then(m => m.ProjectsPageModule),
  },
  {
    path: 'projects/:projectId',
    loadChildren: () => import('./pages/project-detail/project-detail.module').then(m => m.ProjectDetailPageModule),
  },
  {
    path: 'endpoint-test/:projectId/:endpointId',
    loadChildren: () => import('./pages/endpoint-test/endpoint-test.module').then(m => m.EndpointTestPageModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
