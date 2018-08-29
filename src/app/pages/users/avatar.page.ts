import { Component, OnInit, ViewChild } from "@angular/core";
import { ImageCropperComponent, CropperSettings } from "ng2-img-cropper";
import { AppUtility } from "../../components/app.utility";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../providers/configuration.service";
import { UserService } from "../../providers/user.service";
import { FileService } from "../../providers/file.service";
import { UserProfile } from "../../models/user";

@Component({
	selector: "page-account-avatar",
	templateUrl: "./avatar.page.html",
	styleUrls: ["./avatar.page.scss"]
})
export class AccountAvatarPage implements OnInit {

	constructor (
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public fileSvc: FileService,
		public userSvc: UserService
	) {
	}

	title = "Cập nhật ảnh đại diện";
	mode = "Avatar";
	profile: UserProfile;
	cropper = {
		settings: new CropperSettings(),
		data: {
			image: "",
			original: undefined
		}
	};
	processing = false;
	@ViewChild("imgcropper") cropperComponent: ImageCropperComponent;

	public ngOnInit() {
		this.profile = this.configSvc.getAccount().profile;
		this.mode = this.profile.Avatar === "" || this.profile.Avatar === this.profile.Gravatar
			? "Gravatar"
			: "Avatar";

		this.cropper.data.image = this.profile.Avatar;
		this.cropper.settings.width = 100;
		this.cropper.settings.height = 100;
		this.cropper.settings.croppedWidth = 300;
		this.cropper.settings.croppedHeight = 300;
		this.cropper.settings.canvasWidth = 242;
		this.cropper.settings.canvasHeight = 242;
		this.cropper.settings.noFileInput = true;
	}

	public prepareImage($event) {
		const image = new Image();
		const fileReader = new FileReader();
		fileReader.onloadend = (loadEvent: any) => {
			image.src = loadEvent.target.result;
			this.cropperComponent.setImage(image);
		};
		fileReader.readAsDataURL($event.target.files[0]);
	}

	public get imageUri() {
		return this.mode === "Gravatar" ? this.profile.Gravatar : this.cropper.data.image;
	}

	private async updateProfileAsync() {
		await this.userSvc.updateProfileAsync({
				ID: this.profile.ID,
				Avatar: this.profile.Avatar
			},
			async () => {
				await this.configSvc.storeProfileAsync(async () => {
					await TrackingUtility.trackAsync(this.title, "account/avatar");
					await this.cancelAsync(async () => await this.appFormsSvc.showToastAsync("Ảnh đại diện đã được cập nhật..."));
				});
			},
			async error => {
				this.processing = false;
				console.error("Error occurred while updating profile with new avatar image => " + AppUtility.getErrorMessage(error), error);
			}
		);
	}

	public async updateAsync() {
		this.processing = true;
		if (this.mode === "Avatar" && this.cropper.data.original !== undefined) {
			await this.fileSvc.uploadAvatarAsync(this.cropper.data.image,
				async data => {
					this.profile.Avatar = data.Uri;
					this.cropper.data = {
						image: data.Uri,
						original: undefined
					};
					await this.updateProfileAsync();
				},
				error => {
					console.error("Error occurred while uploading avatar image => " + AppUtility.getErrorMessage(error));
					this.processing = false;
				}
			);
		}
		else if (this.mode === "Gravatar" && this.profile.Avatar !== "") {
			this.profile.Avatar = "";
			await this.updateProfileAsync();
		}
		else {
			await this.cancelAsync();
		}
	}

	public async cancelAsync(onDismiss?: () => void) {
		await this.appFormsSvc.hideModalAsync(onDismiss);
	}

}
