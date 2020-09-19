import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { IonicModule } from "@ionic/angular";
import { ImageCropperModule as HtmlImageCropper } from "ng2-img-cropper";
import { Crop as NativeImageCropper } from "@ionic-native/crop/ngx";
import { DataSelectorControl } from "@controls/common/data.selector";
import { FilesSelectorControl } from "@controls/common/file.selector.control";
import { ImageCropperControl } from "@controls/common/image.cropper";
import { ObjectPrivilegesControl } from "@controls/common/object.privileges";
import { ServicePrivilegesControl } from "@controls/common/service.privileges";
import { FilesProcessorModalPageModule } from "@controls/common/file.processor.modal.module";
import { UsersSelectorModalPageModule } from "@controls/common/user.selector.modal.module";

@NgModule({
	providers: [NativeImageCropper],
	imports: [
		CommonModule,
		IonicModule,
		HtmlImageCropper,
		UsersSelectorModalPageModule,
		FilesProcessorModalPageModule
	],
	exports: [
		DataSelectorControl,
		FilesSelectorControl,
		ImageCropperControl,
		ObjectPrivilegesControl,
		ServicePrivilegesControl
	],
	declarations: [
		DataSelectorControl,
		FilesSelectorControl,
		ImageCropperControl,
		ObjectPrivilegesControl,
		ServicePrivilegesControl
	]
})

export class CommonControlsModule {}
