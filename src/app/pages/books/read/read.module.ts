import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { BooksReadPage } from "./read.page";

@NgModule({
	providers: [],
	imports: [
		CommonModule,
		IonicModule,
		RouterModule.forChild([{ path: "", component: BooksReadPage }])
	],
	exports: [],
	declarations: [BooksReadPage]
})

export class BooksReadPageModule {}
