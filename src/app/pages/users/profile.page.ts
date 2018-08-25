import { Component, OnInit, OnDestroy, ViewEncapsulation } from "@angular/core";
import { ActivatedRoute, Params } from "@angular/router";
import { FormGroup } from "@angular/forms";
import * as Rx from "rxjs";
import { first, map } from "rxjs/operators";
import { LoadingController, AlertController } from "@ionic/angular";
import { AppData } from "../../app.data";
import { AppFormsService, AppFormsControl } from "../../components/forms.service";
import { AppUtility } from "../../components/app.utility";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";
import { UserService } from "../../providers/user.service";
import { Profile } from "../../models/profile";

@Component({
	selector: "page-account-profile",
	templateUrl: "./profile.page.html",
	styleUrls: ["./profile.page.scss"]
})
export class AccountProfilePage implements OnInit, OnDestroy {

	constructor (
		public activatedRoute: ActivatedRoute,
		public loadingController: LoadingController,
		public alertController: AlertController,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public userSvc: UserService
	) {
	}

	title = "Thông tin tài khoản";
	mode = "profile";
	actions: Array<{
		title: string,
		icon: string,
		handler: () => void
	}> = [];
	profile: Profile;
	update = {
		form: FormGroup,
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any
	};
	register = {
		form: FormGroup,
		config: undefined as Array<any>,
		controls: new Array<AppFormsControl>(),
		value: undefined as any
	};
	loading = undefined;
	queryParams: Params = {};
	rxSubscriptions = new Array<Rx.Subscription>();

	public ngOnInit() {
		this.rxSubscriptions.push(this.activatedRoute.queryParams.subscribe(params => this.queryParams = params));
		this.mode = this.configSvc.currentUrl.indexOf("/register-account") > -1
			? "register"
			: "profile";
		if (this.mode === "register") {
			this.openRegister();
		}
		else {
			this.openProfile();
		}
	}

	public ngOnDestroy() {
		this.rxSubscriptions.forEach(subscription => subscription.unsubscribe());
	}

	private async showLoadingAsync(message?: string) {
		this.loading = await this.loadingController.create({
			content: message || this.title
		});
		await this.loading.present();
	}

	private async hideLoadingAsync() {
		if (this.loading !== undefined) {
			await this.loading.dismiss();
			this.loading = undefined;
		}
	}

	private async showAlertAsync(message: any, header?: string, subHeader?: string, postProcess?: () => void) {
		const alert = await this.alertController.create({
			header: header || "Chú ý",
			subHeader: subHeader,
			backdropDismiss: false,
			message: message,
			buttons: [{
				text: "Đóng",
				handler: () => {
					if (postProcess !== undefined) {
						postProcess();
					}
				}
			}]
		});
		await alert.present();
	}

	private async showErrorAsync(error: any, subHeader?: string, postProcess?: () => void) {
		await this.hideLoadingAsync();
		await this.showAlertAsync(AppUtility.isNotEmpty(error.Message) ? error.Message : "Đã xảy ra lỗi!", "Lỗi", subHeader, postProcess);
	}

	openProfile() {
		const id = (this.queryParams["info"] ? AppUtility.getJsonOfQuery(this.queryParams["info"]) : {})["ID"] || this.configSvc.getAccount().id;
		this.userSvc.getProfileAsync(id,
			data => this.profile = AppData.profiles.getValue(id),
			error => this.showErrorAsync(error)
		);
	}

	openRegister() {

	}

}
