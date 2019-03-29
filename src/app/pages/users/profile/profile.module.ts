import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../../components/forms.module";
import { BookControlsModule } from "../../books/controls.module";
import { UsersAvatarPageModule } from "../avatar/avatar.module";
import { UsersProfilePage } from "./profile.page";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		UsersAvatarPageModule,
		BookControlsModule,
		RouterModule.forChild([{ path: "", component: UsersProfilePage }])
	],
	exports: [],
	declarations: [UsersProfilePage]
})

export class UsersProfilePageModule {}
