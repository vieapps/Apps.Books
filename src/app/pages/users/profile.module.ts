import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";
import { AccountAvatarPageModule } from "./avatar.module";
import { AccountProfilePage } from "./profile.page";

@NgModule({
	declarations: [AccountProfilePage],
	imports: [
		CommonModule,
		FormsModule,
		IonicModule,
		AppFormsModule,
		AccountAvatarPageModule,
		RouterModule.forChild([
			{
				path: "",
				component: AccountProfilePage
			}
		])
	]
})
export class AccountProfilePageModule {}
