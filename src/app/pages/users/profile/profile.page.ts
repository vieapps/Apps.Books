import { Component, OnInit, NgZone } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppUtility } from "../../../components/app.utility";
import { TrackingUtility } from "../../../components/app.utility.trackings";
import { AppFormsControl, AppFormsService } from "../../../components/forms.service";
import { ConfigurationService } from "../../../services/configuration.service";
import { AuthenticationService } from "../../../services/authentication.service";
import { UsersService } from "../../../services/users.service";
import { UserProfile } from "../../../models/user";
import { Privilege } from "../../../models/privileges";
import { UsersAvatarPage } from "../avatar/avatar.page";

@Component({
	selector: "page-users-profile",
	templateUrl: "./profile.page.html",
	styleUrls: ["./profile.page.scss"]
})

export class UsersProfilePage implements OnInit {

	constructor(
		public zone: NgZone,
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
		controls: new Array<AppFormsControl>(),
		config: undefined as Array<any>,
		privileges: undefined as Array<Privilege>,
		relatedInfo: undefined as { [key: string]: any }
	};

	ngOnInit() {
		this.showProfileAsync();
	}

	onFormInitialized($event: any) {
		const controls = ($event.form as FormGroup).controls;
		Object.keys(controls).forEach(key => controls[key].setValue(""));
	}

	get locale() {
		return this.configSvc.locale;
	}

	get canManageUsers() {
		return this.authSvc.isSystemAdministrator() && !this.configSvc.previousUrl.startsWith("/users/list") && !this.configSvc.previousUrl.startsWith("/users/search");
	}

	setModeAsync(mode: string, title: string) {
		this.mode = mode;
		this.configSvc.appTitle = this.title = title;
		return Promise.all([
			this.prepareButtonsAsync(),
			this.prepareActionsAsync()
		]);
	}

	async prepareButtonsAsync() {
		if (this.mode === "invitation") {
			this.buttons.cancel = { text: await this.configSvc.getResourceAsync("common.buttons.cancel"), icon: undefined, handler: async () => await this.showProfileAsync() };
			this.buttons.ok = { text: await this.configSvc.getResourceAsync("users.profile.buttons.invite"), icon: undefined, handler: async () => await this.sendInvitationAsync() };
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
					this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.avatar"), "camera", () => this.zone.run(async () => await this.appFormsSvc.showModalAsync(UsersAvatarPage))),
					this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.profile"), "create", () => this.zone.run(async () => await this.openUpdateAsync("profile"))),
					this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.password"), "key", () => this.zone.run(async () => await this.openUpdateAsync("password"))),
					this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.email"), "at", () => this.zone.run(async () => await this.openUpdateAsync("email"))),
					this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.otp"), "lock-open", () => this.zone.run(async () => await this.openOTPAsync()))
				].forEach(action => this.actions.push(action));
			}

			else if (this.authSvc.canSetServicePrivileges) {
				this.actions.push(this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.privileges"), "settings", () => this.zone.run(async () => await this.openUpdateAsync("privileges"))));
				this.usersSvc.getServicePrivilegesAsync(this.profile.ID);
			}

			if (this.id === undefined || this.id === this.configSvc.getAccount().id) {
				this.actions.push(this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("users.profile.actions.logout"), "log-out", async () => await this.logoutAsync()));
			}

			if (this.actions.length < 1) {
				this.actions = undefined;
			}
		}
	}

	showActionsAsync() {
		return this.appFormsSvc.showActionSheetAsync(this.actions);
	}

	async showProfileAsync(onNext?: () => void) {
		this.id = this.configSvc.requestParams["ID"];
		if (this.profile === undefined && this.id !== undefined && !UserProfile.contains(this.id)) {
			await this.appFormsSvc.showLoadingAsync();
		}
		const id = this.id || this.configSvc.getAccount().id;
		await this.usersSvc.getProfileAsync(id,
			async () => {
				if (this.profile === undefined) {
					this.profile = UserProfile.get(id);
					await TrackingUtility.trackAsync(`${await this.configSvc.getResourceAsync("users.profile.title")} [${this.profile.Name}]`, "/users/profile");
				}
				this.labels.header = await this.configSvc.getResourceAsync("users.profile.labels.header");
				this.labels.lastAccess = await this.configSvc.getResourceAsync("users.profile.labels.lastAccess");
				await this.setModeAsync("profile", await this.configSvc.getResourceAsync("users.profile.title"));
				await this.appFormsSvc.hideLoadingAsync(onNext);
			},
			async error => await this.appFormsSvc.showErrorAsync(error)
		);
	}

	openUpdateAsync(mode?: string) {
		return this.configSvc.navigateForwardAsync("/users/update/" + (this.id === undefined ? "my" : AppUtility.toANSI(this.profile.Name, true)) + "?x-request=" + AppUtility.toBase64Url({ ID: this.profile.ID, Mode: mode || "profile" }));
	}

	openOTPAsync(mode?: string) {
		return this.configSvc.navigateForwardAsync("/users/otp");
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

	onServicePrivilegesChanged($event: any) {
		this.invitation.privileges = $event.privileges;
		this.invitation.relatedInfo = $event.relatedInfo;
	}

	async sendInvitationAsync() {
		if (this.invitation.form.invalid) {
			this.appFormsSvc.highlightInvalids(this.invitation.form);
		}
		else {
			await this.appFormsSvc.showLoadingAsync(this.title);
			await this.usersSvc.sendInvitationAsync(
				this.invitation.form.value.Name,
				this.invitation.form.value.Email,
				this.invitation.privileges,
				this.invitation.relatedInfo,
				async () => await Promise.all([
					TrackingUtility.trackAsync(`${this.title} [${this.profile.Name}]`, "users/invitation"),
					this.showProfileAsync(async () => await this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.invitation.message")))
				]),
				async error => await this.appFormsSvc.showErrorAsync(error)
			);
		}
	}

	async logoutAsync() {
		await this.appFormsSvc.showAlertAsync(
			await this.configSvc.getResourceAsync("users.profile.buttons.logout"),
			undefined,
			await this.configSvc.getResourceAsync("users.profile.logout.confirm"),
			async () => await this.authSvc.logOutAsync(
				async () => await Promise.all([
					TrackingUtility.trackAsync(await this.configSvc.getResourceAsync("users.profile.buttons.logout"), "users/logout"),
					this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.logout.success")),
					this.zone.run(async () => {
						if (this.configSvc.previousUrl.startsWith("/users")) {
							await this.configSvc.navigateHomeAsync();
						}
						else {
							await this.configSvc.navigateBackAsync();
						}
					})
				]),
				async error => await this.appFormsSvc.showErrorAsync(error)
			),
			await this.configSvc.getResourceAsync("users.profile.buttons.logout"),
			await this.configSvc.getResourceAsync("common.buttons.cancel")
		);
	}

}
