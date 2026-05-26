import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HistoryDetailPageRoutingModule } from './history-detail-routing.module';
import { HistoryDetailPage } from './history-detail.page';

@NgModule({
  imports: [CommonModule, IonicModule, HistoryDetailPageRoutingModule],
  declarations: [HistoryDetailPage],
})
export class HistoryDetailPageModule {}
