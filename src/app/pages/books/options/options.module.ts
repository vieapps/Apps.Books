import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../../components/forms.module";
import { BooksOptionsPage } from "./options.page";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		RouterModule.forChild([{ path: "", component: BooksOptionsPage }])
	],
	exports: [],
	declarations: [BooksOptionsPage]
})

export class BooksOptionsPageModule {}
