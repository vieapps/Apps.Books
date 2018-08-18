import { Component } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";

import { Platform, LoadingController, AlertController, NavController } from "@ionic/angular";

import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { StatusBar } from "@ionic-native/status-bar/ngx";
import { Device } from "@ionic-native/device/ngx";

import { AppEvents } from "./components/app.events";
import { AppRTU } from "./components/app.rtu";
import { AppUtility } from "./components/app.utility";
import { PlatformUtility } from "./components/app.utility.platform";

import { ConfigurationService } from "./providers/configuration.service";
import { AuthenticationService } from "./providers/authentication.service";

@Component({
	selector: "app-root",
	templateUrl: "app.component.html"
})
export class AppComponent {
	sidebar = {
		left: {
			title: undefined as string,
			avatar: undefined as string,
			menu: new Array<{
				title: string,
				items: Array<{ title: string, url: string, icon: string, direction: string }>
			}>()
		}
	};

	constructor(
		public router: Router,
		public platform: Platform,
		public splashScreen: SplashScreen,
		public statusBar: StatusBar,
		public device: Device,
		public navController: NavController,
		public loadingController: LoadingController,
		public alertController: AlertController,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService
	) {
		// router state
		this.configSvc.setCurrentUrl("/home");
		this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				this.configSvc.currentUrl = (event as NavigationEnd).url;
			}
		});

		// sidebars
		this.sidebar.left.title = this.configSvc.appConfig.app.name;
		this.initializeSideBars();

		// event handlers
		this.setupEventHandlers();

		// initliaze app
		this.platform.ready().then(() => {
			// prepare status bar
			const iPhoneX = this.device.platform !== undefined && this.device.platform === "iOS"
				&& this.device.model !== undefined && this.device.model !== null
				&& AppUtility.indexOf(this.device.model, "iPhone1") === 0
				&& AppUtility.toInt(this.device.model.substring(this.device.model.length - 1)) > 2;
			this.statusBar.styleDefault();
			if (iPhoneX) {
				this.statusBar.backgroundColorByHexString("f8f8f8");
			}
			this.statusBar.overlaysWebView(false);

			// hide the splash screen
			this.splashScreen.hide();

			// prepare the app
			this.configSvc.prepareAsync(async () => {
				if (this.configSvc.appConfig.isWebApp && "activate" === PlatformUtility.parseURI().searchParams["prego"]) {
					await this.activateAsync();
				}
				else {
					await this.initializeAsync();
				}
			});
		});
	}

	private initializeSideBars(info?: any) {
		const index = AppUtility.isObject(info, true) && AppUtility.isObject(info.args, true)
			? info.args.index || 0
			: 0;

		while (this.sidebar.left.menu.length < index + 1) {
			this.sidebar.left.menu.push({
				title: undefined,
				items: []
			});
		}

		if (index === 0) {
			this.sidebar.left.menu[index].items = [];
			this.sidebar.left.menu[index].items.push({
				title: "Màn hình chính",
				url: "/home",
				icon: "home",
				direction: "root"
			});

			if (this.configSvc.isAuthenticated) {
				this.sidebar.left.menu[index].items.push({
					title: "Thông tin tài khoản",
					url: "/account-profile",
					icon: "person",
					direction: "forward"
				});
			}
			else {
				this.sidebar.left.menu[index].items.push({
					title: "Đăng nhập",
					url: "/log-in",
					icon: "log-in",
					direction: "forward"
				});
			}

			if (this.authSvc.canRegisterNewAccounts) {
				this.sidebar.left.menu[index].items.push({
					title: "Đăng ký tài khoản",
					url: "/register-account",
					icon: "person-add",
					direction: "forward"
				});
			}
		}
		else {
			this.sidebar.left.menu[index].title = AppUtility.isObject(info, true) && AppUtility.isObject(info.args, true)
				? info.args.title
				: undefined;
		}

		if (AppUtility.isObject(info, true) && AppUtility.isObject(info.args, true) && AppUtility.isArray(info.args.items, true)) {
			(info.args.items as Array<any>)
				.map(item => {
					return {
						title: item.title,
						url: item.url,
						icon: item.icon,
						direction: item.direction || "root"
					};
				})
				.filter(item => item.title && item.url)
				.forEach(page => this.sidebar.left.menu[index].items.push(page));
		}
	}

	private setupEventHandlers() {
		AppEvents.on("GoForward", info => {
			this.navController.goForward(info.url, info.animated, info.extras);
		});

		AppEvents.on("GoBack", info => {
			this.navController.goBack(info.url, info.animated, info.extras);
		});

		AppEvents.on("GoRoot", info => {
			this.navController.goRoot(info.url, info.animated, info.extras);
		});

		AppEvents.on("GoHome", info => {
			this.navController.goForward("/home", info.animated, info.extras);
		});

		AppEvents.on("GoPrevious", info => {
			this.navController.goForward(this.configSvc.previousUrl || "/home", info.animated, info.extras);
		});

		AppEvents.on("UpdatePages", info => this.initializeSideBars(info));
	}

	private async activateAsync() {
	}

	private async initializeAsync(onCompleted?: () => void, noInitializeSession?: boolean) {
		// show loading
		const loading = await this.loadingController.create({
			content: "Tải dữ liệu..."
		});
		await loading.present();

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

	private async prepareAsync(onCompleted?: () => void) {
	}

}
