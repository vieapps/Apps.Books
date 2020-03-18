import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { ImageCropperModule as HtmlImageCropper } from "ng2-img-cropper";
import { Crop as NativeImageCropper } from "@ionic-native/crop/ngx";
import { ImageCropperControl } from "./image.cropper";

@NgModule({
	imports: [
		CommonModule,
		IonicModule,
		HtmlImageCropper
	],
	exports: [ImageCropperControl],
	providers: [NativeImageCropper],
	declarations: [ImageCropperControl]
})

export class ImageCropperControlModule {}
