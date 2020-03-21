import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { AppFormsModule } from "../../../components/forms.module";
import { TimePipeModule } from "../../../components/time.pipe";
import { CommonControlsModule } from "../../../controls/common.controls.module";
import { BookControlsModule } from "../../../controls/books.controls.module";
import { UsersAvatarPageModule } from "../avatar/avatar.module";
import { UsersProfilePage } from "./profile.page";

@NgModule({
	providers: [],
	imports: [
		CommonModule,
		IonicModule,
		AppFormsModule,
		TimePipeModule,
		CommonControlsModule,
		BookControlsModule,
		UsersAvatarPageModule,
		RouterModule.forChild([{ path: "", component: UsersProfilePage }])
	],
	exports: [],
	declarations: [UsersProfilePage]
})

export class UsersProfilePageModule {}
