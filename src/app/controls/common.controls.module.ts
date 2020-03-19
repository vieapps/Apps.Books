import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { ImageCropperModule as HtmlImageCropper } from "ng2-img-cropper";
import { Crop as NativeImageCropper } from "@ionic-native/crop/ngx";
import { AppFormsModule } from "../components/forms.module";
import { ServicePrivilegesControl } from "./common/service.privileges";
import { ImageCropperControl } from "./common/image.cropper";

@NgModule({
	providers: [NativeImageCropper],
	imports: [
		CommonModule,
		IonicModule,
		HtmlImageCropper,
		AppFormsModule
	],
	exports: [
		ServicePrivilegesControl,
		ImageCropperControl
	],
	declarations: [
		ServicePrivilegesControl,
		ImageCropperControl
	]
})

export class CommonControlsModule {}
