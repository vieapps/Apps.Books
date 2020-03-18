import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { ImageCropperControlModule } from "../../controls/image.cropper.module";
import { UsersAvatarPage } from "./avatar.page";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		ImageCropperControlModule
	],
	exports: [],
	providers: [],
	declarations: [UsersAvatarPage],
	entryComponents: [UsersAvatarPage]
})

export class UsersAvatarPageModule {}
