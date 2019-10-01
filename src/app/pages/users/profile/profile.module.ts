import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../../components/forms.module";
import { TimePipeModule } from "../../../components/time.pipe";
import { BookControlsModule } from "../../books/controls.module";
import { UserControlsModule } from "../controls.module";
import { UsersAvatarPageModule } from "../avatar/avatar.module";
import { UsersProfilePage } from "./profile.page";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		TimePipeModule,
		BookControlsModule,
		UserControlsModule,
		UsersAvatarPageModule,
		RouterModule.forChild([{ path: "", component: UsersProfilePage }])
	],
	exports: [],
	declarations: [UsersProfilePage]
})

export class UsersProfilePageModule {}
