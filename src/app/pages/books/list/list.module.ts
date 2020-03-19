import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { BookControlsModule } from "../../../controls/books.controls.module";
import { BooksListPage } from "./list.page";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		BookControlsModule,
		RouterModule.forChild([{ path: "", component: BooksListPage }])
	],
	exports: [],
	providers: [],
	declarations: [BooksListPage]
})

export class BooksListPageModule {}
