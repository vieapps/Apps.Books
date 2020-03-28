import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild } from "@angular/core";
import { ImageCropperComponent as HtmlImageCropper, CropperSettings as HtmlImageCropperSettings } from "ng2-img-cropper";
import { Crop as NativeImageCropper } from "@ionic-native/crop/ngx";
import { AppFormsControl, AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../services/configuration.service";
import { FilesService } from "../../services/files.service";

@Component({
	selector: "control-image-cropper",
	templateUrl: "./image.cropper.html",
	styleUrls: ["./image.cropper.scss"]
})

export class ImageCropperControl implements OnInit, OnDestroy {

	constructor(
		public configSvc: ConfigurationService,
		private appFormsSvc: AppFormsService,
		private filesSvc: FilesService,
		private nativeImageCropper: NativeImageCropper
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

	/** The form control that contains this control */
	@Input() control: AppFormsControl;

	/** The event handler to run when the controls was initialized */
	@Output() init: EventEmitter<any> = new EventEmitter();

	/** The event handler to run when the control was changed */
	@Output() change = new EventEmitter<any>();

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

	/** Gets the data of image cropper */
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
		this.init.emit(this);
	}

	ngOnDestroy() {
		this.init.unsubscribe();
		this.change.unsubscribe();
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

	private emitChanges() {
		this.change.emit({
			detail: {
				value: this.data
			}
		});
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
				this.emitChanges();
			},
			this.settings.limitSize || 1024000,
			async () => await this.appFormsSvc.showToastAsync(this.settings.limitExceedMessage || "Too big...")
		);
	}

}
