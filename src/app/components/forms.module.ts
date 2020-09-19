import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { Ng2CompleterModule } from "ng2-completer";
import { CKEditorModule } from "@ckeditor/ckeditor5-angular";
import { AppFormsService } from "@components/forms.service";
import { AppFormsComponent } from "@components/forms.component";
import { AppFormsControlComponent } from "@components/forms.control.component";
import { AppFormsViewComponent } from "@components/forms.view.component";
import { CommonControlsModule } from "@controls/common.controls.module";

@NgModule({
	providers: [AppFormsService],
	imports: [
		CommonModule,
		ReactiveFormsModule,
		IonicModule,
		CKEditorModule,
		Ng2CompleterModule,
		CommonControlsModule
	],
	exports: [
		AppFormsComponent,
		AppFormsControlComponent,
		AppFormsViewComponent
	],
	declarations: [
		AppFormsComponent,
		AppFormsControlComponent,
		AppFormsViewComponent
	]
})

export class AppFormsModule {}
