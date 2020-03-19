import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { CommonControlsModule } from "../../../controls/common.controls.module";
import { UsersAvatarPage } from "./avatar.page";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		CommonControlsModule
	],
	exports: [],
	providers: [],
	declarations: [UsersAvatarPage],
	entryComponents: [UsersAvatarPage]
})

export class UsersAvatarPageModule {}
