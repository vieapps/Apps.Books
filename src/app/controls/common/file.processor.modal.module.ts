import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { FilesProcessorModalPage } from "./file.processor.modal.page";

@NgModule({
	providers: [],
	imports: [
		CommonModule,
		ReactiveFormsModule,
		IonicModule
	],
	exports: [],
	declarations: [FilesProcessorModalPage],
	entryComponents: [FilesProcessorModalPage]
})

export class FilesProcessorModalPageModule {}
