import { Component, OnInit, ViewChild } from "@angular/core";
import { ImageCropperComponent as HtmlImageCropper, CropperSettings as HtmlImageCropperSettings } from "ng2-img-cropper";
import { Crop as NativeImageCropper } from "@ionic-native/crop/ngx";
import { AppFormsService } from "../../../components/forms.service";
import { AppEvents } from "../../../components/app.events";
import { AppUtility } from "../../../components/app.utility";
import { TrackingUtility } from "../../../components/app.utility.trackings";
import { ConfigurationService } from "../../../services/configuration.service";
import { UsersService } from "../../../services/users.service";
import { FilesService } from "../../../services/files.service";
import { UserProfile } from "../../../models/user";

@Component({
	selector: "page-users-avatar",
	templateUrl: "./avatar.page.html",
	styleUrls: ["./avatar.page.scss"]
})

export class UsersAvatarPage implements OnInit {

	constructor (
		public nativeImageCropper: NativeImageCropper,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public filesSvc: FilesService,
		public usersSvc: UsersService
	) {
	}

	title = "Avatar";
	mode = "Avatar";
	profile: UserProfile;
	resources = {
		cancel: "Cancel",
		update: "Update",
		header: "Avatar type",
		avatar: "Uploaded avatar",
		gravatar: "Gravatar picture",
	};
	htmlCropper = {
		settings: new HtmlImageCropperSettings(),
		data: {
			image: "",
			original: undefined
		}
	};
	processing = false;
	@ViewChild(HtmlImageCropper, { static: false }) htmlImageCropper: HtmlImageCropper;

	get imageUri() {
		return this.mode === "Gravatar" ? this.profile.Gravatar : this.htmlCropper.data.image;
	}

	get isNativeApp() {
		return this.configSvc.isNativeApp;
	}

	ngOnInit() {
		this.initializeAsync();
	}

	async initializeAsync() {
		this.profile = this.configSvc.getAccount().profile;
		this.mode = this.profile.Avatar === "" || this.profile.Avatar === this.profile.Gravatar
			? "Gravatar"
			: "Avatar";

		this.htmlCropper.data.image = this.profile.Avatar;
		this.htmlCropper.settings.width = 100;
		this.htmlCropper.settings.height = 100;
		this.htmlCropper.settings.croppedWidth = 300;
		this.htmlCropper.settings.croppedHeight = 300;
		this.htmlCropper.settings.canvasWidth = 242;
		this.htmlCropper.settings.canvasHeight = 242;
		this.htmlCropper.settings.noFileInput = true;

		this.title = await this.configSvc.getResourceAsync("users.profile.avatar.title");
		this.resources = {
			cancel: await this.configSvc.getResourceAsync("common.buttons.cancel"),
			update: await this.configSvc.getResourceAsync("common.buttons.update"),
			header: await this.configSvc.getResourceAsync("users.profile.avatar.header"),
			avatar: await this.configSvc.getResourceAsync("users.profile.avatar.mode.avatar"),
			gravatar: await this.configSvc.getResourceAsync("users.profile.avatar.mode.gravatar")
		};
	}

	prepareAvatarImage($event: any) {
		const file: File = $event.target.files.length > 0 ? $event.target.files[0] : undefined;
		if (file !== undefined && file.type.startsWith("image/")) {
			this.filesSvc.readAsDataURL(file, data => {
				const image = new Image();
				image.src = data;
				this.htmlImageCropper.setImage(image);
			}, 1024000, async () => await this.appFormsSvc.showToastAsync("Too big..."));
		}
	}

	uploadAvatarAsync(onNext: (data?: any) => void, onError: (error?: any) => void) {

	}

	updateProfileAsync() {
		return this.usersSvc.updateProfileAsync(
			{
				ID: this.profile.ID,
				Avatar: this.profile.Avatar
			},
			async () => await this.configSvc.storeSessionAsync(async () => {
				AppEvents.broadcast("Profile", { Type: "Updated" });
				await TrackingUtility.trackAsync(this.title + ` [${this.profile.Name}]`, "users/update/avatar");
				await this.cancelAsync(async () => await this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.avatar.message")));
			}),
			error => {
				this.processing = false;
				console.error("Error occurred while updating profile with new avatar image => " + AppUtility.getErrorMessage(error), error);
			}
		);
	}

	updateAsync() {
		this.processing = true;
		if (this.mode === "Avatar" && this.htmlCropper.data.original !== undefined) {
			return this.filesSvc.uploadAvatarAsync(
				this.htmlCropper.data.image,
				async data => {
					this.profile.Avatar = data.URI;
					this.htmlCropper.data = {
						image: data.URI,
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
			return this.updateProfileAsync();
		}
		else {
			return this.cancelAsync();
		}
	}

	cancelAsync(onNext?: () => void) {
		return this.appFormsSvc.hideModalAsync(onNext);
	}

}
