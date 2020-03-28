import { Component, OnInit, ViewChild } from "@angular/core";
import { IonInput } from "@ionic/angular";
import { TrackingUtility } from "../../../components/app.utility.trackings";
import { PlatformUtility } from "../../../components/app.utility.platform";
import { AppFormsService } from "../../../components/forms.service";
import { ConfigurationService } from "../../../services/configuration.service";
import { AuthenticationService } from "../../../services/authentication.service";
import { UsersService } from "../../../services/users.service";

@Component({
	selector: "page-users-otp",
	templateUrl: "./otp.page.html",
	styleUrls: ["./otp.page.scss"]
})

export class UsersOtpPage implements OnInit {

	constructor(
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public usersSvc: UsersService
	) {
	}

	title = "OTP";
	providers = new Array<{ Type: string, Label: string, Time: Date, Info: string }>();
	required = false;
	status = "off";
	provision = {
		info: "",
		uri: "",
		value: ""
	};
	password = "";
	labels = {
		status: "status",
		providers: "providers",
		buttons: {
			on: "Power on",
			delete: "Delete",
			verify: "Verify",
			done: "Done"
		},
		qrcode: {
			image: "QR code",
			control: "QR code"
		},
		instruction: {
			main: "Open authenticator app",
			app: "Google Authenticator/Microsoft Authenticator"
		},
		password: {
			label: "Old password",
			show: false
		}
	};
	@ViewChild(IonInput, { static: false }) private otpCtrl: IonInput;

	get locale() {
		return this.configSvc.locale;
	}

	ngOnInit() {
		Promise.all([
			this.prepareResourcesAsync(),
			this.prepareAsync()
		]);
	}

	async prepareAsync(onNext?: () => void) {
		const account = this.configSvc.getAccount();
		this.required = account.twoFactors !== undefined ? account.twoFactors.required : false;
		this.providers = account.twoFactors !== undefined ? account.twoFactors.providers : [];
		this.password = "";
		this.provision = {
			info: "",
			uri: "",
			value: ""
		};
		await this.prepareStatusAsync();
		this.configSvc.appTitle = this.title = await this.configSvc.getResourceAsync("users.profile.otp.title");
		if (onNext !== undefined) {
			onNext();
		}
	}

	async prepareResourcesAsync() {
		this.labels = {
			status: await this.configSvc.getResourceAsync("users.profile.otp.status.label"),
			providers: await this.configSvc.getResourceAsync("users.profile.otp.labels.providers"),
			buttons: {
				on: await this.configSvc.getResourceAsync("users.profile.otp.buttons.on"),
				delete: await this.configSvc.getResourceAsync("users.profile.otp.buttons.delete"),
				verify: await this.configSvc.getResourceAsync("users.profile.otp.buttons.verify"),
				done: await this.configSvc.getResourceAsync("common.buttons.done")
			},
			qrcode: {
				image: await this.configSvc.getResourceAsync("users.profile.otp.labels.qrcode.image"),
				control: await this.configSvc.getResourceAsync("users.profile.otp.labels.qrcode.control")
			},
			instruction: {
				main: await this.configSvc.getResourceAsync("users.profile.otp.labels.instruction.main"),
				app: await this.configSvc.getResourceAsync("users.profile.otp.labels.instruction.app")
			},
			password: {
				label: await this.configSvc.getResourceAsync("users.profile.password.controls.OldPassword"),
				show: false
			}
		};
	}

	async prepareStatusAsync() {
		this.status = this.required
			? await this.configSvc.getResourceAsync("users.profile.otp.status.on")
			: this.provision.uri === ""
				? await this.configSvc.getResourceAsync("users.profile.otp.status.off")
				: await this.configSvc.getResourceAsync("users.profile.otp.status.provisioning");
	}

	provisonAsync() {
		this.appFormsSvc.showLoadingAsync(this.title);
		return this.usersSvc.prepare2FAMethodAsync(
			async data => {
				this.provision.info = data.Provisioning;
				this.provision.uri = data.URI;
				await Promise.all([
					this.prepareStatusAsync(),
					this.appFormsSvc.hideLoadingAsync(() => {
						this.provision.value = "";
						this.password = "";
						PlatformUtility.focus(this.otpCtrl);
					})
				]);
			},
			async error => await this.appFormsSvc.showErrorAsync(error)
		);
	}

	async addAsync() {
		await this.appFormsSvc.showLoadingAsync(this.title);
		await this.usersSvc.add2FAMethodAsync(
			this.password,
			this.provision.info,
			this.provision.value,
			async () => await this.prepareAsync(async () => await Promise.all([
				TrackingUtility.trackAsync(this.title, `${this.configSvc.appConfig.url.users.update}/otp`),
				this.appFormsSvc.hideLoadingAsync()
			])),
			async error => await this.appFormsSvc.showErrorAsync(error, undefined, () => {
				this.provision.value = "";
				this.password = "";
				PlatformUtility.focus(this.otpCtrl);
			})
		);
	}

	async deleteAsync(provider: { Type: string, Label: string, Time: Date, Info: string }) {
		await this.appFormsSvc.showAlertAsync(
			await this.configSvc.getResourceAsync("users.profile.otp.buttons.delete"),
			undefined,
			await this.configSvc.getResourceAsync("users.profile.otp.messages.confirm", { label: provider.Label }),
			async data => await this.usersSvc.delete2FAMethodAsync(
				data.password + "",
				provider.Info,
				async () => await this.prepareAsync(async () => await Promise.all([
					TrackingUtility.trackAsync(this.title, `${this.configSvc.appConfig.url.users.update}/otp`),
					this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("users.profile.otp.messages.success", { label: provider.Label }))
				])),
				async error => await this.appFormsSvc.showErrorAsync(error)
			),
			await this.configSvc.getResourceAsync("common.buttons.yes"),
			await this.configSvc.getResourceAsync("common.buttons.no"),
			[
				{
					name: "password",
					type: "password",
					placeholder: await this.configSvc.getResourceAsync("users.profile.password.controls.OldPassword")
				}
			]
		);
	}

	doneAsync(onNext?: () => void) {
		return this.appFormsSvc.hideLoadingAsync(async () => {
			if (onNext !== undefined) {
				onNext();
			}
			await this.configSvc.navigateBackAsync(!this.configSvc.previousUrl.startsWith(this.configSvc.appConfig.url.users.profile) ? `${this.configSvc.appConfig.url.users.profile}/my` : undefined);
		});
	}

}
