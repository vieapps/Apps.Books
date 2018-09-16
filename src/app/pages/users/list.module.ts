import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { ListAccountProfilesPage } from "./list.page";

@NgModule({
	declarations: [ListAccountProfilesPage],
	imports: [
		CommonModule,
		IonicModule,
		RouterModule.forChild([
			{
				path: "",
				component: ListAccountProfilesPage
			}
		])
	]
})
export class ListAccountProfilesPageModule {}
