import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";
import { AccountAvatarPageModule } from "./avatar.module";
import { AccountProfilePage } from "./profile.page";
import { BookControlsModule } from "../books/controls.module";

@NgModule({
	declarations: [AccountProfilePage],
	imports: [
		CommonModule,
		FormsModule,
		IonicModule,
		AppFormsModule,
		AccountAvatarPageModule,
		BookControlsModule,
		RouterModule.forChild([
			{
				path: "",
				component: AccountProfilePage
			}
		])
	]
})
export class AccountProfilePageModule {}
