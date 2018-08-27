import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { ImageCropperModule } from "ng2-img-cropper";
import { AccountAvatarPage } from "./avatar.page";

@NgModule({
	declarations: [AccountAvatarPage],
	imports: [
		CommonModule,
		IonicModule,
		ImageCropperModule
	],
	entryComponents: [AccountAvatarPage]
})
export class AccountAvatarPageModule {}
