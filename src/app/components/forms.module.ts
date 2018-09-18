import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { Ng2CompleterModule } from "ng2-completer";
import { AppFormsService } from "./forms.service";
import { AppFormsComponent } from "./forms.component";
import { AppFormsControlComponent } from "./forms.control.component";

@NgModule({
	declarations: [
		AppFormsComponent,
		AppFormsControlComponent
	],
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		IonicModule,
		Ng2CompleterModule
	],
	exports: [
		AppFormsComponent,
		AppFormsControlComponent
	],
	providers: [
		AppFormsService
	]
})
export class AppFormsModule {}
