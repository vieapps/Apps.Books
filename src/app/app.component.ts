import { Component } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { Platform } from "@ionic/angular";
import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { StatusBar } from "@ionic-native/status-bar/ngx";
import { Device } from "@ionic-native/device/ngx";
import { LoadingController, AlertController } from "@ionic/angular";

import { AppEvents } from "./components/app.events";
import { AppRTU } from "./components/app.rtu";
import { AppUtility } from "./components/app.utility";
import { ConfigurationService } from "./providers/configuration.service";

@Component({
	selector: "app-root",
	templateUrl: "app.component.html"
})
export class AppComponent {
	public appPages = [
		{
			title: "Home",
			url: "/home",
			icon: "home"
		},
		{
			title: "List",
			url: "/list-items",
			icon: "list"
		},
		{
			title: "Sign In",
			url: "/sign-in",
			icon: "log-in"
		}
	];

	constructor(
		public router: Router,
		public platform: Platform,
		public splashScreen: SplashScreen,
		public statusBar: StatusBar,
		public device: Device,
		public loadingController: LoadingController,
		public alertController: AlertController,
		public configSvc: ConfigurationService
	) {
		// url
		this.configSvc.setCurrentUrl("/home");
		this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				this.configSvc.currentUrl = (event as NavigationEnd).url;
			}
		});

		// initliaze app
		this.platform.ready().then(() => this.initializeAsync());
	}

	async initializeAsync() {
		// show loading
		const loading = await this.loadingController.create({
			content: "Tải dữ liệu..."
		});
		await loading.present();

		// iPhone X: footers need special paddings
		const iPhoneX = this.device.platform !== undefined && this.device.platform === "iOS"
			&& this.device.model !== undefined && this.device.model !== null
			&& AppUtility.indexOf(this.device.model, "iPhone1") === 0
			&& AppUtility.toInt(this.device.model.substring(this.device.model.length - 1)) > 2;

		// prepare status bar
		this.statusBar.styleDefault();
		if (iPhoneX) {
			this.statusBar.backgroundColorByHexString("f8f8f8");
		}
		this.statusBar.overlaysWebView(false);

		// hide the splash screen
		this.splashScreen.hide();

		// initialize
		this.configSvc.initializeAsync(
			async data => {
				this.configSvc.registerSessionAsync(
					async session => {
						await loading.dismiss();
						AppRTU.start();
					},
					async error => {
						await loading.dismiss();
					}
				);
			},
			async error => {
				await loading.dismiss();
			}
		);
	}

}
