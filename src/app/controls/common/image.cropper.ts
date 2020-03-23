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

	constructor(
		public nativeImageCropper: NativeImageCropper,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public filesSvc: FilesService
	) {
	}

	/** Settings of the image cropper */
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

	htmlCropper: {
		data: {
			/** Gets the cropped image */
			image: string;
			/** Gets the original image */
			original: any
		};
		settings: HtmlImageCropperSettings;
	};

	@ViewChild(HtmlImageCropper, { static: false }) private htmlImageCropper: HtmlImageCropper;

	/*** Gets the data of image cropper */
	get data() {
		return this.configSvc.isNativeApp ? undefined : this.htmlCropper.data;
	}

	ngOnInit() {
		this.settings = this.settings || {};

		if (this.configSvc.isNativeApp) {
			this.prepareNativeCropper();
		}
		else {
			this.prepareHtmlCropper();
		}
	}

	private prepareNativeCropper() {
	}

	private prepareHtmlCropper() {
		const htmlCropperSettings = new HtmlImageCropperSettings();
		htmlCropperSettings.width = this.settings.selectorWidth || 100;
		htmlCropperSettings.height = this.settings.selectorHeight || 100;
		htmlCropperSettings.croppedWidth = this.settings.croppedWidth || 300;
		htmlCropperSettings.croppedHeight = this.settings.croppedHeight || 300;
		htmlCropperSettings.canvasWidth = this.settings.canvasWidth || 242;
		htmlCropperSettings.canvasHeight = this.settings.canvasHeight || 242;
		htmlCropperSettings.noFileInput = true;

		this.htmlCropper = {
			data: {
				image: this.settings.currentImage,
				original: undefined
			},
			settings: htmlCropperSettings
		};
	}

	prepareImage($event: any) {
		const file: File = $event.target.files.length > 0 ? $event.target.files[0] : undefined;
		if (file !== undefined && file.type.startsWith("image/")) {
			if (this.configSvc.isNativeApp) {
				this.prepareImageOfNativeCropper(file);
			}
			else {
				this.prepareImageOfHtmlCropper(file);
			}
		}
	}

	private prepareImageOfNativeCropper(file: File) {
	}

	private prepareImageOfHtmlCropper(file: File) {
		this.filesSvc.readAsDataURL(
			file,
			data => {
				const image = new Image();
				image.src = data;
				this.htmlImageCropper.setImage(image);
			},
			this.settings.limitSize || 1024000,
			async () => await this.appFormsSvc.showToastAsync(this.settings.limitExceedMessage || "Too big...")
		);
	}

}
