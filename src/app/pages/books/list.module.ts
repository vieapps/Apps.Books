import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { BookControlsModule } from "./controls.module";
import { ListBooksPage } from "./list.page";

@NgModule({
	declarations: [ListBooksPage],
	imports: [
		CommonModule,
		IonicModule,
		BookControlsModule,
		RouterModule.forChild([
			{
				path: "",
				component: ListBooksPage
			}
		])
	]
})

export class ListBooksPageModule {}
