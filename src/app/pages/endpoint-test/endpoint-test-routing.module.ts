import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EndpointTestPage } from './endpoint-test.page';

const routes: Routes = [{ path: '', component: EndpointTestPage }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EndpointTestPageRoutingModule {}
