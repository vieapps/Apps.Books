import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { Ng2CompleterModule } from "ng2-completer";
import { AppFormsService } from "./forms.service";
import { AppFormsComponent } from "./forms.main.component";
import { AppFormsElementComponent } from "./forms.element.component";

@NgModule({
	imports: [
		CommonModule,
		ReactiveFormsModule,
		IonicModule,
		Ng2CompleterModule
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
