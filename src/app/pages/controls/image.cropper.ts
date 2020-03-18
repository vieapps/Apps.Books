import { Component, OnInit, Input, ViewChild } from "@angular/core";
import { ImageCropperComponent as HtmlImageCropper, CropperSettings as HtmlImageCropperSettings } from "ng2-img-cropper";
import { Crop as NativeImageCropper } from "@ionic-native/crop/ngx";
import { AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../services/configuration.service";
import { FilesService } from "../../services/files.service";

@Component({
	selector: "control-image-cropper",
	templateUrl: "./image.cropper.html",
	styleUrls: ["./image.cropper.scss"]
})

export class ImageCropperControl implements OnInit {

	constructor (
		public nativeImageCropper: NativeImageCropper,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public filesSvc: FilesService
	) {
	}

	@Input() settings: {
		currentImage?: string;
		selectorWidth?: number;
		selectorHeight?: number;
		croppedWidth?: number;
		croppedHeight?: number;
		canvasWidth?: number;
		canvasHeight?: number;
		limitSize?: number;
		limitExceedMessage?: string;
	};

	htmlCropper = {
		settings: new HtmlImageCropperSettings(),
		data: {
			image: "",
			original: undefined
		}
	};

	@ViewChild(HtmlImageCropper, { static: false }) private htmlImageCropper: HtmlImageCropper;

	/*** Gets the data of image cropper */
	get data() {
		return this.configSvc.isNativeApp ? undefined : this.htmlCropper.data;
	}

	ngOnInit() {
		this.settings = this.settings || {};
		this.htmlCropper.data.image = this.settings.currentImage;
		this.htmlCropper.settings.width = this.settings.selectorWidth || 100;
		this.htmlCropper.settings.height = this.settings.selectorHeight || 100;
		this.htmlCropper.settings.croppedWidth = this.settings.croppedWidth || 300;
		this.htmlCropper.settings.croppedHeight = this.settings.croppedHeight || 300;
		this.htmlCropper.settings.canvasWidth = this.settings.canvasWidth || 242;
		this.htmlCropper.settings.canvasHeight = this.settings.canvasHeight || 242;
		this.htmlCropper.settings.noFileInput = true;
	}

	prepareImage($event: any) {
		const file: File = $event.target.files.length > 0 ? $event.target.files[0] : undefined;
		if (file !== undefined && file.type.startsWith("image/")) {
			if (this.configSvc.isNativeApp) {
			}
			else {
				this.filesSvc.readAsDataURL(file, data => {
					const image = new Image();
					image.src = data;
					this.htmlImageCropper.setImage(image);
				}, this.settings.limitSize || 1024000, async () => await this.appFormsSvc.showToastAsync(this.settings.limitExceedMessage || "Too big..."));
			}
		}
	}

}
