import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { BooksReadPage } from "./read.page";

@NgModule({
	declarations: [BooksReadPage],
	imports: [
		CommonModule,
		IonicModule,
		RouterModule.forChild([
			{
				path: "",
				component: BooksReadPage
			}
		])
	]
})

export class BooksReadPageModule {}
