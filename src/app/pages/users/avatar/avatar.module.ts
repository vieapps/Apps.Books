import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { ImageCropperModule as HtmlImageCropper } from "ng2-img-cropper";
import { Crop as NativeImageCropper } from "@ionic-native/crop/ngx";
import { UsersAvatarPage } from "./avatar.page";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		HtmlImageCropper
	],
	exports: [],
	providers: [NativeImageCropper],
	declarations: [UsersAvatarPage],
	entryComponents: [UsersAvatarPage]
})

export class UsersAvatarPageModule {}
