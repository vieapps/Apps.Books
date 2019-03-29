import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../../components/forms.module";
import { BooksUpdatePage } from "./update.page";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		RouterModule.forChild([{ path: "", component: BooksUpdatePage }])
	],
	exports: [],
	declarations: [BooksUpdatePage]
})

export class BooksUpdatePageModule {}
