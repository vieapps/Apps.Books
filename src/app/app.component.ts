import { Component } from "@angular/core";
import { Router, Params, NavigationEnd, NavigationExtras } from "@angular/router";

import { Platform, NavController } from "@ionic/angular";

import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { StatusBar } from "@ionic-native/status-bar/ngx";
import { Device } from "@ionic-native/device/ngx";
import { GoogleAnalytics } from "@ionic-native/google-analytics/ngx";

import { AppEvents } from "./components/app.events";
import { AppRTU } from "./components/app.rtu";
import { AppUtility } from "./components/app.utility";
import { PlatformUtility } from "./components/app.utility.platform";
import { TrackingUtility } from "./components/app.utility.trackings";

import { AppFormsService } from "./components/forms.service";
import { ConfigurationService } from "./providers/configuration.service";
import { AuthenticationService } from "./providers/authentication.service";
import { UserService } from "./providers/user.service";

@Component({
	selector: "app-root",
	templateUrl: "app.component.html"
})
export class AppComponent {

	constructor(
		public router: Router,
		public platform: Platform,
		public splashScreen: SplashScreen,
		public statusBar: StatusBar,
		public device: Device,
		public ga: GoogleAnalytics,
		public navController: NavController,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public userSvc: UserService
	) {
		this.initializeApp();
	}

	sidebar = {
		left: {
			title: undefined as string,
			avatar: undefined as string,
			menu: new Array<{
				title: string,
				icon: string,
				thumbnail: string,
				parent: {
					title: string,
					url: string,
					queryParams: Params,
					direction: string
				},
				items: Array<{
					title: string,
					url: string,
					queryParams: Params,
					icon: string,
					thumbnail: string,
					direction: string,
					detail: boolean
				}>
			}>()
		}
	};

	private initializeApp() {
		// capture router url
		this.configSvc.setPreviousUrl("/home");
		this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				this.configSvc.currentUrl = (event as NavigationEnd).url;
				this.configSvc.queryParams = this.router.routerState.snapshot.root.queryParams;
			}
		});

		// initliaze app
		this.platform.ready().then(() => {
			// show loading
			this.appFormsSvc.showLoadingAsync("activate" === this.configSvc.queryParams["prego"] ? "Kích hoạt..." : "Tải dữ liệu...");

			// prepare sidebars
			this.sidebar.left.title = this.configSvc.appConfig.app.name;
			this.updateSidebar();

			// setup event handlers
			this.setupEventHandlers();

			// prepare status bar
			this.statusBar.styleDefault();
			if ("iOS" === this.device.platform && AppUtility.pos(this.device.model, "iPhone1") === 0 && AppUtility.toInt(this.device.model.substring(this.device.model.length - 1)) > 2) {
				this.statusBar.backgroundColorByHexString("f8f8f8");
			}
			this.statusBar.overlaysWebView(false);

			// hide the splash screen
			this.splashScreen.hide();

			// prepare the app
			this.configSvc.prepareAsync(async () => {
				if (this.configSvc.isWebApp && "activate" === this.configSvc.queryParams["prego"]) {
					await this.activateAsync();
				}
				else {
					await this.initializeAsync();
				}
			});
		});
	}

	private get loginItem() {
		return {
			title: "Đăng nhập",
			url: "/log-in",
			queryParams: undefined as Params,
			icon: "log-in",
			thumbnail: undefined,
			detail: false,
			direction: "forward"
		};
	}

	private get registerAccountItem() {
		return {
			title: "Đăng ký tài khoản",
			url: "/register-account",
			queryParams: undefined as Params,
			icon: "person-add",
			thumbnail: undefined,
			detail: false,
			direction: "forward"
		};
	}

	private get viewAccountProfileItem() {
		return {
			title: "Thông tin tài khoản",
			url: "/account-profile",
			queryParams: undefined as Params,
			icon: "person",
			thumbnail: undefined,
			detail: false,
			direction: "forward"
		};
	}

	public trackSidebarItem(index: number, item: any) {
		return item.title;
	}

	private updateSidebarItem(menuIndex: number = -1, itemIndex: number = -1, itemInfo: any = {}) {
		if (menuIndex > -1 && menuIndex < this.sidebar.left.menu.length) {
			const item = {
				title: itemInfo.title,
				url: itemInfo.url,
				queryParams: itemInfo.queryParams,
				icon: itemInfo.icon,
				thumbnail: itemInfo.thumbnail,
				direction: itemInfo.direction || "root",
				detail: !!itemInfo.detail
			};
			AppUtility.insertAt(this.sidebar.left.menu[menuIndex].items, item, itemIndex);
		}
	}

	private updateSidebar(info: any = {}) {
		const index = info.index || 0;
		while (this.sidebar.left.menu.length < index + 1) {
			this.sidebar.left.menu.push({
				title: undefined,
				icon: undefined,
				thumbnail: undefined,
				parent: undefined,
				items: []
			});
		}

		if (index === 0) {
			this.sidebar.left.menu[index].items = [];
			this.updateSidebarItem(index, -1, {
				title: "Màn hình chính",
				url: "/home",
				icon: "home"
			});

			if (this.configSvc.isAuthenticated) {
				this.updateSidebarItem(index, -1, this.viewAccountProfileItem);
			}
			else {
				this.updateSidebarItem(index, -1, this.loginItem);
			}

			if (this.authSvc.canRegisterNewAccounts) {
				this.updateSidebarItem(index, -1, this.registerAccountItem);
			}
		}
		else {
			this.sidebar.left.menu[index].title = info.title;
			this.sidebar.left.menu[index].icon = info.icon;
			this.sidebar.left.menu[index].thumbnail = info.thumbnail;
		}

		if (AppUtility.isArray(info.items, true)) {
			(info.items as Array<any>)
				.map(item => {
					return {
						title: item.title,
						url: item.url,
						queryParams: item.queryParams,
						direction: item.direction,
						icon: item.icon,
						thumbnail: item.thumbnail,
						detail: !!item.detail,
					};
				})
				.filter(item => AppUtility.isNotEmpty(item.title) && AppUtility.isNotEmpty(item.url))
				.forEach(item => this.updateSidebarItem(index, -1, item));
		}
	}

	private navigate(direction: string = "Root", url: string = "/home", animated: boolean = true, extras?: NavigationExtras) {
		switch (direction) {
			case "Forward":
				this.navController.goForward(url, animated, extras);
				break;
			case "Back":
				this.navController.goBack(url, animated, extras);
				break;
			default:
				this.navController.goRoot(url, animated, extras);
				break;
		}
	}

	private setupEventHandlers() {
		AppEvents.on("Navigate", info => this.navigate(info.args.direction || "Forward", info.args.url, info.args.animated, info.args.extras));
		AppEvents.on("GoForward", info => this.navigate("Forward", info.args.url, info.args.animated, info.args.extras));
		AppEvents.on("GoBack", info => this.navigate("Back", info.args.url, info.args.animated, info.args.extras));
		AppEvents.on("GoRoot", info => this.navigate("Root", info.args.url, info.args.animated, info.args.extras));
		AppEvents.on("GoHome", info => this.navigate("Root", "/home", info.args.animated, info.args.extras));

		AppEvents.on("UpdateSidebar", info => this.updateSidebar(info.args));
		AppEvents.on("AddSidebarItem", info => this.updateSidebarItem(info.args["MenuIndex"] || -1, -1, info.args["ItemInfo"]));
		AppEvents.on("UpdateSidebarItem", info => this.updateSidebarItem(info.args["MenuIndex"] || -1, info.args["ItemIndex"] || -1, info.args["ItemInfo"]));

		AppEvents.on("Session", info => {
			const type = info.args["Type"] || "Unknown";
			if (type === "Loaded" || type === "Updated") {
				const profile = this.configSvc.getAccount().profile;
				this.sidebar.left.title = profile ? profile.Name : this.configSvc.appConfig.app.name;
				this.sidebar.left.avatar = profile ? profile.Avatar : undefined;

				const items = this.sidebar.left.menu[0].items;
				if (this.configSvc.isAuthenticated) {
					if (this.authSvc.canRegisterNewAccounts) {
						AppUtility.removeAt(items, AppUtility.indexOf(items, item => AppUtility.pos(item.url, "/register-account") === 0));
					}
					const index = AppUtility.indexOf(items, item => AppUtility.pos(item.url, "/log-in") === 0);
					if (index > -1) {
						items[index] = this.viewAccountProfileItem;
					}
					else if (AppUtility.indexOf(items, item => AppUtility.pos(item.url, "/account-profile") === 0) < 0) {
						AppUtility.insertAt(items, this.viewAccountProfileItem);
					}
				}
				else {
					if (AppUtility.indexOf(items, item => AppUtility.pos(item.url, "/log-in") === 0) < 0) {
						const index = AppUtility.indexOf(items, item => AppUtility.pos(item.url, "/account-profile") === 0);
						if (index > -1) {
							items[index] = this.loginItem;
						}
						else {
							AppUtility.insertAt(items, this.loginItem);
						}
					}
					if (this.authSvc.canRegisterNewAccounts && AppUtility.indexOf(items, item => AppUtility.pos(item.url, "/register-account") === 0) < 0) {
						const index = AppUtility.indexOf(items, item => AppUtility.pos(item.url, "/log-in") === 0);
						AppUtility.insertAt(items, this.registerAccountItem, index > -1 ? index + 1 : -1);
					}
				}
			}
		});
	}

	private async activateAsync() {
		const mode = this.configSvc.queryParams["mode"];
		const code = this.configSvc.queryParams["code"];
		if (AppUtility.isNotEmpty(mode) && AppUtility.isNotEmpty(code)) {
			await this.userSvc.activateAsync(mode, code,
				async data => {
					await this.initializeAsync(async () => {
						await Promise.all([
							TrackingUtility.trackAsync("Kích hoạt", `activate/${mode}`),
							this.showActivationResultAsync({ Status: "OK", Mode: mode })
						]);
					}, true);
				},
				async error => {
					await this.initializeAsync(async () => {
						await this.showActivationResultAsync({ Status: "Error", Mode: mode, Error: error });
					});
				}
			);
		}
	}

	async showActivationResultAsync(data: any) {
		const header = "password" === data.Mode
			? "Mật khẩu mới"
			: "Tài khoản mới";
		const subHeader = "OK" === data.Status
			? "Kích hoạt thành công"
			: "Không thể kích hoạt";
		const message = "OK" === data.Status
			? "account" === data.Mode
				? "Tài khoản đã được kích hoạt thành công"
				: "Mật khẩu đã được kích hoạt thành công"
			: "Đã xảy ra lỗi, không thể kích hoạt" + (data.Error ? ` (${data.Error.Message})` : "");
		await this.appFormsSvc.showAlertAsync(header, subHeader, message);
	}

	private initializeAsync(onCompleted?: () => void, noInitializeSession?: boolean) {
		return this.configSvc.initializeAsync(
			async data => {
				// got valid sessions, then run next step
				if (this.configSvc.isReady && this.configSvc.isAuthenticated) {
					PlatformUtility.showLog("<AppComponent>: The session is initialized & registered (user)");
					await this.prepareAsync(onCompleted);
				}

				// register new session (anonymous)
				else {
					PlatformUtility.showLog("<AppComponent>: Register the initialized session (anonymous)", this.configSvc.appConfig.session);
					await this.configSvc.registerSessionAsync(
						async () => {
							PlatformUtility.showLog("<AppComponent>: The session is registered (anonymous)");
							await this.prepareAsync(onCompleted);
						},
						async error => {
							if (AppUtility.isGotSecurityException(error)) {
								PlatformUtility.showWarning("<AppComponent>: Cannot register, the session is need to be re-initialized (anonymous)");
								await this.configSvc.deleteSessionAsync(() => {
									PlatformUtility.setTimeout(async () => {
										await this.initializeAsync(onCompleted, noInitializeSession);
									}, 234);
								});
							}
							else {
								await this.appFormsSvc.hideLoadingAsync();
								PlatformUtility.showError("<AppComponent>: Cannot initialize the app", error);
							}
						}
					);
				}
			},
			async error => {
				if (AppUtility.isGotSecurityException(error)) {
					PlatformUtility.showWarning("<AppComponent>: Cannot initialize, the session is need to be re-initialized (anonymous)");
					await this.configSvc.deleteSessionAsync(() => {
						PlatformUtility.setTimeout(async () => {
							await this.initializeAsync(onCompleted, noInitializeSession);
						}, 234);
					});
				}
				else {
					await this.appFormsSvc.hideLoadingAsync();
					PlatformUtility.showError("<AppComponent>: Cannot initialize the app", error);
				}
			},
			noInitializeSession
		);
	}

	private async prepareAsync(onCompleted?: () => void) {
		// setup the environment of PWA
		if (this.configSvc.isWebApp) {
			PlatformUtility.setPWAEnvironment(() => this.configSvc.watchFacebookConnect());
		}

		// setup tracking
		await TrackingUtility.initializeAsync(this.ga);

		// start the real-time updater
		AppRTU.start(async () => {
			// patch account & get profile when already authenticated
			if (this.configSvc.isAuthenticated) {
				this.configSvc.patchAccount(() => {
					this.configSvc.getProfile();
				}, 345);
			}

			// done
			PlatformUtility.showLog("<AppComponent>: The app is initialized", this.configSvc.isDebug ? this.configSvc.appConfig.app : "");
			AppEvents.broadcast("AppIsInitialized", this.configSvc.appConfig.app);
			await this.appFormsSvc.hideLoadingAsync();
			if (onCompleted !== undefined) {
				onCompleted();
			}
		});
	}

}
