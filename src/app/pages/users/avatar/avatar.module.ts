import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { ImageCropperModule } from "ng2-img-cropper";
import { UsersAvatarPage } from "./avatar.page";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		ImageCropperModule
	],
	exports: [],
	declarations: [UsersAvatarPage],
	entryComponents: [UsersAvatarPage]
})

export class UsersAvatarPageModule {}
