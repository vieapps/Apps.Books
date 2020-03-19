import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../../components/forms.module";
import { TimePipeModule } from "../../../components/time.pipe";
import { BookControlsModule } from "../../../controls/books.controls.module";
import { CommonControlsModule } from "../../../controls/common.controls.module";
import { UsersAvatarPageModule } from "../avatar/avatar.module";
import { UsersProfilePage } from "./profile.page";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		TimePipeModule,
		BookControlsModule,
		CommonControlsModule,
		UsersAvatarPageModule,
		RouterModule.forChild([{ path: "", component: UsersProfilePage }])
	],
	exports: [],
	providers: [],
	declarations: [UsersProfilePage]
})

export class UsersProfilePageModule {}
