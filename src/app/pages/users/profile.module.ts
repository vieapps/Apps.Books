import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";

import { AccountProfilePage } from "./profile.page";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		RouterModule.forChild([
			{
				path: "",
				component: AccountProfilePage
			}
		])
	],
	declarations: [AccountProfilePage],
	schemas: []
})
export class AccountProfilePageModule {}
