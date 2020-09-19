import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { CommonControlsModule } from "@controls/common.controls.module";
import { UsersAvatarPage } from "./avatar.page";

@NgModule({
	providers: [],
	imports: [
		CommonModule,
		IonicModule,
		CommonControlsModule
	],
	exports: [],
	declarations: [UsersAvatarPage],
	entryComponents: [UsersAvatarPage]
})

export class UsersAvatarPageModule {}
