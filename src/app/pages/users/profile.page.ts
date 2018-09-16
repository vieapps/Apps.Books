import { Component, OnInit } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppUtility } from "../../components/app.utility";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { AppFormsControl, AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";
import { UsersService } from "../../providers/users.service";
import { UserProfile } from "../../models/user";
import { Privilege } from "./../../models/privileges";
import { AccountAvatarPage } from "./avatar.page";

@Component({
	selector: "page-user-profile",
	templateUrl: "./profile.page.html",
	styleUrls: ["./profile.page.scss"]
})
export class ViewAccountProfilePage implements OnInit {

	constructor (
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public usersSvc: UsersService
	) {
	}

	title = "Profile";
	mode = "profile";
	id: string;
	profile: UserProfile;
	buttons = {
		ok: undefined as {
			text: string,
			icon: string,
			handler: () => void
		},
		cancel: undefined as {
			text: string,
			icon: string,
			handler: () => void
		},
		invite: undefined as {
			text: string,
			icon: string,
			handler: () => void
		}
	};
	actions: Array<{
		text: string,
		role: string,
		icon: string,
		handler: () => void
	}>;
	labels = {
		header: "",
		lastAccess: ""
	};
	invitation = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>()
	};
	privileges = {
		form: new FormGroup({}),
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		hash: undefined as string
	};

	ngOnInit() {
		this.showProfileAsync();
	}

	onFormInitialized($event) {
		Object.keys(($event.form as FormGroup).controls).forEach(key => ($event.form as FormGroup).controls[key].setValue(""));
	}

	async setModeAsync(mode: string, title: string) {
		this.mode = mode;
		this.configSvc.appTitle = this.title = title;
		await Promise.all([
			this.prepareButtonsAsync(),
			this.prepareActionsAsync()
		]);
	}

	async prepareButtonsAsync() {
		this.buttons.cancel = { text: await this.configSvc.getResourceAsync("common.buttons.cancel"), icon: undefined, handler: async () => await this.showProfileAsync() };
		this.buttons.ok = { text: await this.configSvc.getResourceAsync("common.buttons.update"), icon: undefined, handler: undefined };

		if (this.mode === "privileges") {
			this.buttons.ok.handler = async () => await this.updatePrivilegesAsync();
		}
		else if (this.mode === "invitation") {
			this.buttons.ok.text = await this.configSvc.getResourceAsync("users.profile.buttons.invite");
			this.buttons.ok.handler = async () => await this.sendInvitationAsync();
		}
		else {
			this.buttons.cancel = undefined;
			this.buttons.ok = undefined;
		}

		this.buttons.invite = this.mode === "profile" && this.profile.ID === this.configSvc.getAccount().id && this.authSvc.canSendInvitations
			? { text: await this.configSvc.getResourceAsync("users.profile.buttons.invitation"), icon: "people", handler: async () => await this.openSendInvitationAsync() }
			: undefined;
	}

	async prepareActionsAsync() {
		if (this.mode !== "profile") {
			this.actions = undefined;
		}
		else {
			this.actions = [];

			if (this.profile.ID === this.configSvc.getAccount().id) {
				[
					this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.avatar"), "camera", async () => await this.appFormsSvc.showModalAsync(AccountAvatarPage)),
					this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.profile"), "create", () => this.openUpdate("profile")),
					this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.password"), "key", () => this.openUpdate("password")),
					this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.email"), "mail", () => this.openUpdate("email")),
					this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.otp"), "unlock", () => this.configSvc.navigateForward("/users/otp"))
				].forEach(action => this.actions.push(action));
			}

			else if (this.authSvc.canSetPrivileges) {
				this.actions.push(this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.privileges"), "settings", async () => await this.openUpdatePrivilegesAsync()));
			}

			if (this.authSvc.isSystemAdministrator && !this.configSvc.previousUrl.startsWith("/users/list") && !this.configSvc.previousUrl.startsWith("/users/search")) {
				this.actions.push(this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.list"), "contacts", () => this.configSvc.navigateForward("/users/list")));
			}

			if (this.id === undefined || this.id === this.configSvc.getAccount().id) {
				this.actions.push(this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.logout"), "log-out", async () => await this.logoutAsync()));
			}

			if (this.actions.length < 1) {
				this.actions = undefined;
			}
		}
	}

	async showActionsAsync() {
		await this.appFormsSvc.showActionSheetAsync(this.actions);
	}

	async showProfileAsync(onNext?: () => void) {
		this.id = this.configSvc.requestParams["ID"];
		if (this.profile === undefined && this.id !== undefined && !UserProfile.instances.containsKey(this.id)) {
			await this.appFormsSvc.showLoadingAsync();
		}
		const id = this.id || this.configSvc.getAccount().id;
		await this.usersSvc.getProfileAsync(id,
			async () => {
				if (this.profile === undefined) {
					await TrackingUtility.trackAsync(await this.configSvc.getResourceAsync("users.profile.title"), "/users/profile");
				}
				this.profile = UserProfile.get(id);
				this.labels.header = await this.configSvc.getResourceAsync("users.profile.labels.header");
				this.labels.lastAccess = await this.configSvc.getResourceAsync("users.profile.labels.lastAccess");
				await this.setModeAsync("profile", await this.configSvc.getResourceAsync("users.profile.title"));
				await this.appFormsSvc.hideLoadingAsync(onNext);
			},
			async error => await this.appFormsSvc.showErrorAsync(error)
		);
	}

	openUpdate(mode?: string) {
		this.configSvc.navigateForward("/users/update/" + (this.id === undefined ? "my" : this.id) + "?x-request=" + AppUtility.toBase64Url({ ID: this.profile.ID, Mode: mode || "profile" }));
	}

	async openSendInvitationAsync() {
		this.invitation.config = [
			{
				Name: "Name",
				Required: true,
				Options: {
					Label: await this.configSvc.getResourceAsync("users.register.controls.Name.label"),
					MinLength: 1,
					MaxLength: 150,
					AutoFocus: true
				}
			},
			{
				Name: "Email",
				Required: true,
				Options: {
					Type: "email",
					Label: await this.configSvc.getResourceAsync("users.register.controls.Email"),
					MinLength: 1,
					MaxLength: 150
				}
			}
		];
		await this.setModeAsync("invitation", await this.configSvc.getResourceAsync("users.profile.invitation.title"));
	}

	async sendInvitationAsync() {
		if (this.invitation.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.invitation.form);
		}
		else {
			await this.appFormsSvc.showLoadingAsync(this.title);
			const privileges: Array<Privilege> = undefined;
			const relatedInfo: any = undefined;
			await this.usersSvc.sendInvitationAsync(
				this.invitation.form.value.Name,
				this.invitation.form.value.Email,
				privileges,
				relatedInfo,
				async () => await Promise.all([
					TrackingUtility.trackAsync(this.title, "users/invitation"),
					this.showProfileAsync(async () => await this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.invitation.message")))
				]),
				async error => await this.appFormsSvc.showErrorAsync(error)
			);
		}
	}

	async openUpdatePrivilegesAsync() {
		await this.setModeAsync("privileges", await this.configSvc.getResourceAsync("users.profile.privileges.title"));
	}

	async updatePrivilegesAsync() {

	}

	async logoutAsync() {
		await this.appFormsSvc.showAlertAsync(
			await this.configSvc.getResourceAsync("users.profile.buttons.logout"),
			undefined,
			await this.configSvc.getResourceAsync("users.profile.logout.confirm"),
			async () => await this.authSvc.logOutAsync(
				async () => {
					await Promise.all([
						TrackingUtility.trackAsync(await this.configSvc.getResourceAsync("users.profile.buttons.logout"), "users/logout"),
						this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.logout.success"))
					]);
					if (this.configSvc.previousUrl.startsWith("/users")) {
						this.configSvc.navigateHome();
					}
					else {
						this.configSvc.navigateBack();
					}
				},
				async error => await this.appFormsSvc.showErrorAsync(error)
			),
			await this.configSvc.getResourceAsync("users.profile.buttons.logout"),
			await this.configSvc.getResourceAsync("common.buttons.cancel")
		);
	}

}
