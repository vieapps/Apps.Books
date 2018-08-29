import { Component, OnInit } from "@angular/core";
import { Router, Params, NavigationEnd, NavigationExtras } from "@angular/router";

import { Platform, NavController } from "@ionic/angular";

import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { StatusBar } from "@ionic-native/status-bar/ngx";
import { Device } from "@ionic-native/device/ngx";

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
export class AppComponent implements OnInit {

	constructor(
		public router: Router,
		public platform: Platform,
		public splashScreen: SplashScreen,
		public statusBar: StatusBar,
		public device: Device,
		public navController: NavController,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public userSvc: UserService
	) {
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

	public ngOnInit() {
		console.log("<AppComponent>: Initializing the app", this.configSvc.isDebug ? this.configSvc.appConfig.app : "");

		// capture router info
		this.configSvc.setPreviousUrl("/");
		this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				this.configSvc.currentUrl = (event as NavigationEnd).url;
				this.configSvc.queryParams = this.router.routerState.snapshot.root.queryParams;
			}
		});

		// initliaze app
		this.platform.ready().then(() => {
			if (this.platform.is("cordova")) {
				// prepare status bar
				this.statusBar.styleDefault();
				if ("iOS" === this.device.platform && this.device.model.startsWith("iPhone1") && AppUtility.toInt(this.device.model.substring(this.device.model.length - 1)) > 2) {
					this.statusBar.backgroundColorByHexString("f8f8f8");
				}
				this.statusBar.overlaysWebView(false);

				// hide the splash screen
				this.splashScreen.hide();
			}

			// show loading
			const isActivate = "activate" === this.configSvc.queryParams["prego"];
			this.appFormsSvc.showLoadingAsync(isActivate ? "Kích hoạt..." : "Tải dữ liệu...");

			// prepare sidebars
			this.sidebar.left.title = this.configSvc.appConfig.app.name;
			this.updateSidebar();

			// setup event handlers
			this.setupEventHandlers();

			// prepare the app
			this.configSvc.prepareAsync(async () => {
				if (this.configSvc.isWebApp && isActivate) {
					await this.activateAsync();
				}
				else {
					await this.initializeAsync();
				}
			});
		});
	}

	private get sidebarItems() {
		return {
			home: {
				title: "Màn hình chính",
				url: "/home",
				direction: "root",
				icon: "home"
			},
			login: {
				title: "Đăng nhập",
				url: "/log-in",
				queryParams: undefined as Params,
				direction: "forward",
				icon: "log-in",
				thumbnail: undefined,
				detail: false
			},
			registerAccount: {
				title: "Đăng ký tài khoản",
				url: "/register-account",
				queryParams: undefined as Params,
				direction: "forward",
				icon: "person-add",
				thumbnail: undefined,
				detail: false
			},
			viewAccountProfile: {
				title: "Thông tin tài khoản",
				url: "/account-profile",
				queryParams: undefined as Params,
				direction: "forward",
				icon: "person",
				thumbnail: undefined,
				detail: false
			}
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
				direction: itemInfo.direction || "root",
				icon: itemInfo.icon,
				thumbnail: itemInfo.thumbnail,
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
			this.updateSidebarItem(index, -1, this.sidebarItems.home);

			if (this.configSvc.isAuthenticated) {
				this.updateSidebarItem(index, -1, this.sidebarItems.viewAccountProfile);
			}
			else {
				this.updateSidebarItem(index, -1, this.sidebarItems.login);
			}

			if (this.authSvc.canRegisterNewAccounts) {
				this.updateSidebarItem(index, -1, this.sidebarItems.registerAccount);
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
				this.navController.navigateForward(url, animated, extras);
				break;
			case "Back":
				this.navController.navigateBack(url, animated, extras);
				break;
			default:
				this.navController.navigateRoot(url, animated, extras);
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
		AppEvents.on("UpdateSidebarTitle", info => {
			if (AppUtility.isNotEmpty(info.args.title)) {
				this.sidebar.left.title = info.args.title;
			}
		});

		AppEvents.on("Session", info => {
			const type = info.args["Type"] || "Unknown";
			if (type === "Loaded" || type === "Updated") {
				const profile = this.configSvc.getAccount().profile;
				this.sidebar.left.title = profile ? profile.Name : this.configSvc.appConfig.app.name;
				this.sidebar.left.avatar = profile ? profile.avatarUri : undefined;

				const items = this.sidebar.left.menu[0].items;
				if (this.configSvc.isAuthenticated) {
					AppUtility.removeAt(items, items.findIndex(item => item.url.startsWith(this.sidebarItems.registerAccount.url)));
					const index = items.findIndex(item => item.url.startsWith(this.sidebarItems.login.url));
					if (index > -1) {
						items[index] = this.sidebarItems.viewAccountProfile;
					}
					else if (items.findIndex(item => item.url.startsWith(this.sidebarItems.viewAccountProfile.url)) < 0) {
						AppUtility.insertAt(items, this.sidebarItems.viewAccountProfile);
					}
				}
				else {
					if (items.findIndex(item => item.url.startsWith(this.sidebarItems.login.url)) < 0) {
						const index = items.findIndex(item => item.url.startsWith(this.sidebarItems.viewAccountProfile.url));
						if (index > -1) {
							items[index] = this.sidebarItems.login;
						}
						else {
							AppUtility.insertAt(items, this.sidebarItems.login);
						}
					}
					if (this.authSvc.canRegisterNewAccounts && items.findIndex(item => item.url.startsWith(this.sidebarItems.registerAccount.url)) < 0) {
						const index = items.findIndex(item => item.url.startsWith(this.sidebarItems.login.url));
						AppUtility.insertAt(items, this.sidebarItems.registerAccount, index > -1 ? index + 1 : -1);
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
				async () => {
					await this.initializeAsync(async () => {
						await Promise.all([
							TrackingUtility.trackAsync("Kích hoạt", `activate/${mode}`),
							this.showActivationResultAsync({
								Status: "OK",
								Mode: mode
							})
						]);
					}, true);
				},
				async error => {
					await this.initializeAsync(async () => {
						await this.showActivationResultAsync({
							Status: "Error",
							Mode: mode,
							Error: error
						});
					});
				}
			);
		}
		else {
			await this.initializeAsync(async () => {
				await this.showActivationResultAsync({
					Status: "Error",
					Mode: mode,
					Error: {
						Message: `Thông tin kích hoạt không hợp lệ [${mode} - ${code}]`
					}
				});
			});
		}
	}

	private async showActivationResultAsync(data: any) {
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

	private async initializeAsync(onCompleted?: () => void, noInitializeSession?: boolean) {
		await this.configSvc.initializeAsync(
			async () => {
				if (this.configSvc.isReady && this.configSvc.isAuthenticated) {
					console.log("<AppComponent>: The session is initialized & registered (user)", this.configSvc.isDebug ? this.configSvc.appConfig.session : "");
					await this.prepareAsync(onCompleted);
				}
				else {
					console.log("<AppComponent>: Register the initialized session (anonymous)", this.configSvc.isDebug ? this.configSvc.appConfig.session : "");
					await this.configSvc.registerSessionAsync(
						async () => {
							console.log("<AppComponent>: The session is registered (anonymous)", this.configSvc.isDebug ? this.configSvc.appConfig.session : "");
							await this.prepareAsync(onCompleted);
						},
						async error => {
							if (AppUtility.isGotSecurityException(error)) {
								console.warn("<AppComponent>: Cannot register, the session is need to be re-initialized (anonymous)");
								await this.configSvc.deleteSessionAsync(() => {
									PlatformUtility.setTimeout(async () => {
										await this.initializeAsync(onCompleted, noInitializeSession);
									}, 234);
								});
							}
							else {
								await this.appFormsSvc.hideLoadingAsync();
								console.error("<AppComponent>: Cannot initialize the app => " + AppUtility.getErrorMessage(error), error);
							}
						}
					);
				}
			},
			async error => {
				if (AppUtility.isGotSecurityException(error)) {
					console.warn("<AppComponent>: Cannot initialize, the session is need to be re-initialized (anonymous)");
					await this.configSvc.deleteSessionAsync(() => {
						PlatformUtility.setTimeout(async () => {
							await this.initializeAsync(onCompleted, noInitializeSession);
						}, 234);
					});
				}
				else {
					await this.appFormsSvc.hideLoadingAsync();
					console.error("<AppComponent>: Cannot initialize the app => " + AppUtility.getErrorMessage(error), error);
				}
			},
			noInitializeSession
		);
	}

	private async prepareAsync(onCompleted?: () => void) {
		if (this.configSvc.isWebApp) {
			PlatformUtility.setPWAEnvironment(() => this.configSvc.watchFacebookConnect());
		}

		AppRTU.start(() => {
			if (this.configSvc.isAuthenticated) {
				this.configSvc.patchAccount(() => this.configSvc.getProfile());
			}
			console.log("<AppComponent>: The app is initialized", this.configSvc.isDebug ? this.configSvc.appConfig.app : "");
			AppEvents.broadcast("AppIsInitialized", this.configSvc.appConfig.app);
			this.appFormsSvc.hideLoadingAsync(onCompleted);
		});
	}

}
