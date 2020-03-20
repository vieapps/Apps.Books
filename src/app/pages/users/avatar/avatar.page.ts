import { Component, OnInit, ViewChild } from "@angular/core";
import { AppFormsService } from "../../../components/forms.service";
import { AppEvents } from "../../../components/app.events";
import { AppUtility } from "../../../components/app.utility";
import { TrackingUtility } from "../../../components/app.utility.trackings";
import { ConfigurationService } from "../../../services/configuration.service";
import { UsersService } from "../../../services/users.service";
import { FilesService } from "../../../services/files.service";
import { UserProfile } from "../../../models/user";
import { ImageCropperControl } from "../../../controls/common/image.cropper";

@Component({
	selector: "page-users-avatar",
	templateUrl: "./avatar.page.html",
	styleUrls: ["./avatar.page.scss"]
})

export class UsersAvatarPage implements OnInit {

	constructor(
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
	processing = false;
	imageCropperSettings = { currentImage: undefined };
	@ViewChild(ImageCropperControl, { static: false }) imageCropper: ImageCropperControl;

	ngOnInit() {
		this.initializeAsync();
	}

	async initializeAsync() {
		this.profile = this.configSvc.getAccount().profile;
		this.mode = this.profile.Avatar === "" || this.profile.Avatar === this.profile.Gravatar ? "Gravatar" : "Avatar";
		this.imageCropperSettings.currentImage = this.profile.Avatar;

		this.title = await this.configSvc.getResourceAsync("users.profile.avatar.title");
		this.resources = {
			cancel: await this.configSvc.getResourceAsync("common.buttons.cancel"),
			update: await this.configSvc.getResourceAsync("common.buttons.update"),
			header: await this.configSvc.getResourceAsync("users.profile.avatar.header"),
			avatar: await this.configSvc.getResourceAsync("users.profile.avatar.mode.avatar"),
			gravatar: await this.configSvc.getResourceAsync("users.profile.avatar.mode.gravatar")
		};
	}

	updateProfileAsync() {
		return this.usersSvc.updateProfileAsync(
			{
				ID: this.profile.ID,
				Avatar: this.profile.Avatar
			},
			async () => await this.configSvc.storeSessionAsync(async () => {
				AppEvents.broadcast("Profile", { Type: "Updated" });
				await TrackingUtility.trackAsync(`${this.title} [${this.profile.Name}]`, "users/update/avatar");
				await this.cancelAsync(async () => await this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.avatar.message")));
			}),
			error => {
				this.processing = false;
				console.error(`Error occurred while updating profile with new avatar image => ${AppUtility.getErrorMessage(error)}`, error);
			}
		);
	}

	updateAsync() {
		this.processing = true;
		if (this.mode === "Avatar" && this.imageCropper.data.original !== undefined) {
			return this.filesSvc.uploadAvatarAsync(
				this.imageCropper.data.image,
				async data => {
					this.profile.Avatar = data.URI;
					await this.updateProfileAsync();
				},
				error => {
					console.error(`Error occurred while uploading avatar image => ${AppUtility.getErrorMessage(error)}`);
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
