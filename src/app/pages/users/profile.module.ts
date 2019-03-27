import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../components/forms.module";
import { UsersAvatarPageModule } from "./avatar.module";
import { UsersProfilePage } from "./profile.page";
import { BookControlsModule } from "../books/controls.module";

@NgModule({
	declarations: [UsersProfilePage],
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		UsersAvatarPageModule,
		BookControlsModule,
		RouterModule.forChild([
			{
				path: "",
				component: UsersProfilePage
			}
		])
	]
})

export class UsersProfilePageModule {}
