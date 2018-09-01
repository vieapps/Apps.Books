import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { RouterModule } from "@angular/router";

import { ListBooksPage } from "./list.page";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		RouterModule.forChild([
			{
				path: "",
				component: ListBooksPage
			}
		])
	],
	declarations: [ListBooksPage]
})
export class ListBooksPageModule {}
