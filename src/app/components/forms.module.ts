import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { AppFormsService } from "./forms.service";
import { AppFormsComponent } from "./forms.main.component";
import { AppFormsElementComponent } from "./forms.element.component";

@NgModule({
	imports: [
		CommonModule,
		ReactiveFormsModule,
		IonicModule
	],
	providers: [
		AppFormsService
	],
	declarations: [
		AppFormsComponent,
		AppFormsElementComponent
	],
	exports: [
		AppFormsComponent,
		AppFormsElementComponent
	]
})
export class AppFormsModule {}
