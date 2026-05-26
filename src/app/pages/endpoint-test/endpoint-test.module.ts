import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { EndpointTestPageRoutingModule } from './endpoint-test-routing.module';
import { EndpointTestPage } from './endpoint-test.page';

@NgModule({
  imports: [CommonModule, FormsModule, IonicModule, EndpointTestPageRoutingModule],
  declarations: [EndpointTestPage],
})
export class EndpointTestPageModule {}
