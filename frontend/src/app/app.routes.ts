import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { LayoutComponent } from './components/layout/layout';
import { DashboardComponent } from './components/dashboard/dashboard';
import { MapComponent } from './components/map/map';
import { FarmsComponent } from './components/farms/farms';
import { TreesComponent } from './components/trees/trees';
import { PipelinesComponent } from './components/pipelines/pipelines';
import { IrrigationAssetsComponent } from './components/irrigation-assets/irrigation-assets';
import { InfrastructureComponent } from './components/infrastructure/infrastructure';
import { ReportsComponent } from './components/reports/reports';
import { SettingsComponent } from './components/settings/settings';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'map', component: MapComponent },
      { path: 'farms', component: FarmsComponent },
      { path: 'trees', component: TreesComponent },
      { path: 'pipelines', component: PipelinesComponent },
      { path: 'valves', component: IrrigationAssetsComponent },
      { path: 'pumps', component: IrrigationAssetsComponent },
      { path: 'tanks', component: IrrigationAssetsComponent },
      { path: 'infrastructure', component: InfrastructureComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'settings', component: SettingsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
