import { Component, OnInit } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";

import { Platform, NavController } from "@ionic/angular";

import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { StatusBar } from "@ionic-native/status-bar/ngx";
import { Device } from "@ionic-native/device/ngx";

import { AppRTU } from "./components/app.rtu";
import { AppEvents } from "./components/app.events";
import { AppUtility } from "./components/app.utility";
import { PlatformUtility } from "./components/app.utility.platform";
import { TrackingUtility } from "./components/app.utility.trackings";
import { AppFormsService } from "./components/forms.service";
import { ConfigurationService } from "./providers/configuration.service";
import { AuthenticationService } from "./providers/authentication.service";
import { UsersService } from "./providers/users.service";
import { BooksService } from "./providers/books.service";

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
		public usersSvc: UsersService,
		public booksSvc: BooksService
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
					queryParams: { [key: string]: any },
					direction: string
				},
				items: Array<{
					title: string,
					url: string,
					queryParams: { [key: string]: any },
					icon: string,
					thumbnail: string,
					direction: string,
					detail: boolean
				}>
			}>()
		}
	};

	ngOnInit() {
		console.log("<AppComponent>: Initializing", this.configSvc.isDebug ? this.configSvc.appConfig.app : "");

		// capture router info
		this.configSvc.addUrl("/home", {});
		this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				this.configSvc.addUrl((event as NavigationEnd).url, this.router.routerState.snapshot.root.queryParams);
			}
		});

		// initliaze app
		this.platform.ready().then(() => {
			if (this.platform.is("cordova")) {
				// prepare status bar (native app only)
				if (this.device.platform !== "browser") {
					this.statusBar.styleDefault();
					if ("iOS" === this.device.platform && this.device.model.startsWith("iPhone1") && AppUtility.toInt(this.device.model.substring(this.device.model.length - 1)) > 2) {
						this.statusBar.backgroundColorByHexString("f8f8f8");
					}
					this.statusBar.overlaysWebView(false);
				}
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

	get sidebarItems() {
		return {
			home: {
				title: "Màn hình chính",
				url: "/home",
				queryParams: undefined as { [key: string]: any },
				direction: "root",
				icon: "home",
				thumbnail: undefined as string,
				detail: false
			},
			login: {
				title: "Đăng nhập",
				url: "/log-in",
				queryParams: undefined as { [key: string]: any },
				direction: "forward",
				icon: "log-in",
				thumbnail: undefined as string,
				detail: false
			},
			register: {
				title: "Đăng ký tài khoản",
				url: "/register-account",
				queryParams: undefined as { [key: string]: any },
				direction: "forward",
				icon: "person-add",
				thumbnail: undefined as string,
				detail: false
			},
			profile: {
				title: "Thông tin tài khoản",
				url: "/account-profile/0",
				queryParams: undefined as { [key: string]: any },
				direction: "forward",
				icon: "person",
				thumbnail: undefined as string,
				detail: false
			}
		};
	}

	trackSidebarItem(index: number, item: any) {
		return item.title;
	}

	updateSidebarItem(menuIndex: number = -1, itemIndex: number = -1, itemInfo: any = {}) {
		if (menuIndex > -1 && menuIndex < this.sidebar.left.menu.length) {
			const item = {
				title: itemInfo.title,
				url: itemInfo.url,
				queryParams: itemInfo.queryParams as { [key: string]: any },
				direction: itemInfo.direction || "forward",
				icon: itemInfo.icon,
				thumbnail: itemInfo.thumbnail,
				detail: !!itemInfo.detail
			};
			AppUtility.insertAt(this.sidebar.left.menu[menuIndex].items, item, itemIndex);
		}
	}

	updateSidebar(info: any = {}) {
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

		const reset = info.reset !== undefined ? info.reset as boolean : true;
		if (reset) {
			this.sidebar.left.menu[index].items = [];
		}

		if (index === 0) {
			this.updateSidebarItem(index, -1, this.sidebarItems.home);

			if (this.configSvc.isAuthenticated) {
				this.updateSidebarItem(index, -1, this.sidebarItems.profile);
			}
			else {
				this.updateSidebarItem(index, -1, this.sidebarItems.login);
			}

			if (this.authSvc.canRegisterNewAccounts) {
				this.updateSidebarItem(index, -1, this.sidebarItems.register);
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
						detail: item.detail,
					};
				})
				.filter(item => AppUtility.isNotEmpty(item.title) && AppUtility.isNotEmpty(item.url))
				.forEach(item => this.updateSidebarItem(index, -1, item));
		}
	}

	setupEventHandlers() {
		AppEvents.on("Navigate", info => this.navController.navigateForward(info.args.url || "/home", info.args.animated, info.args.extras));
		AppEvents.on("NavigateForward", info => this.navController.navigateForward(info.args.url || "/home", info.args.animated, info.args.extras));
		AppEvents.on("NavigateBack", info => this.navController.navigateBack(info.args.url || "/home", info.args.animated, info.args.extras));
		AppEvents.on("NavigateHome", info => this.navController.navigateRoot("/home", info.args.animated, info.args.extras));

		AppEvents.on("UpdateSidebar", info => this.updateSidebar(info.args));
		AppEvents.on("AddSidebarItem", info => this.updateSidebarItem(info.args.MenuIndex !== undefined ? info.args.MenuIndex : -1, -1, info.args.ItemInfo));
		AppEvents.on("UpdateSidebarItem", info => this.updateSidebarItem(info.args.MenuIndex !== undefined ? info.args.MenuIndex : -1, info.args.ItemIndex !== undefined ? info.args.ItemIndex : -1, info.args.ItemInfo));

		AppEvents.on("UpdateSidebarTitle", info => {
			if (AppUtility.isNotEmpty(info.args.title)) {
				this.sidebar.left.title = info.args.title;
			}
		});

		AppEvents.on("Session", info => {
			if ("Loaded" === info.args.Type || "Updated" === info.args.Type) {
				const profile = this.configSvc.getAccount().profile;
				this.sidebar.left.title = profile ? profile.Name : this.configSvc.appConfig.app.name;
				this.sidebar.left.avatar = profile ? profile.avatarUri : undefined;

				const items = this.sidebar.left.menu[0].items;
				if (this.configSvc.isAuthenticated) {
					AppUtility.removeAt(items, items.findIndex(item => item.url.startsWith(this.sidebarItems.register.url)));
					const index = items.findIndex(item => item.url.startsWith(this.sidebarItems.login.url));
					if (index > -1) {
						items[index] = this.sidebarItems.profile;
					}
					else if (items.findIndex(item => item.url.startsWith(this.sidebarItems.profile.url)) < 0) {
						AppUtility.insertAt(items, this.sidebarItems.profile);
					}
				}
				else {
					if (items.findIndex(item => item.url.startsWith(this.sidebarItems.login.url)) < 0) {
						const index = items.findIndex(item => item.url.startsWith(this.sidebarItems.profile.url));
						if (index > -1) {
							items[index] = this.sidebarItems.login;
						}
						else {
							AppUtility.insertAt(items, this.sidebarItems.login);
						}
					}
					if (this.authSvc.canRegisterNewAccounts && items.findIndex(item => item.url.startsWith(this.sidebarItems.register.url)) < 0) {
						const index = items.findIndex(item => item.url.startsWith(this.sidebarItems.login.url));
						AppUtility.insertAt(items, this.sidebarItems.register, index > -1 ? index + 1 : -1);
					}
				}
			}
		});
	}

	async activateAsync() {
		const mode = this.configSvc.queryParams["mode"];
		const code = this.configSvc.queryParams["code"];
		if (AppUtility.isNotEmpty(mode) && AppUtility.isNotEmpty(code)) {
			await this.usersSvc.activateAsync(mode, code,
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

	async initializeAsync(onCompleted?: () => void, noInitializeSession?: boolean) {
		await this.configSvc.initializeAsync(
			async () => {
				if (this.configSvc.isReady && this.configSvc.isAuthenticated) {
					console.log("<AppComponent>: The session is initialized & registered (user)", this.configSvc.isDebug ? this.configSvc.appConfig.session : "");
					this.onInitialized(onCompleted);
				}
				else {
					console.log("<AppComponent>: Register the initialized session (anonymous)", this.configSvc.isDebug ? this.configSvc.appConfig.session : "");
					await this.configSvc.registerSessionAsync(
						() => {
							console.log("<AppComponent>: The session is registered (anonymous)", this.configSvc.isDebug ? this.configSvc.appConfig.session : "");
							this.onInitialized(onCompleted);
						},
						async error => {
							if (AppUtility.isGotSecurityException(error)) {
								console.warn("<AppComponent>: Cannot register, the session is need to be re-initialized (anonymous)");
								await this.configSvc.resetSessionAsync(() => {
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
					await this.configSvc.resetSessionAsync(() => {
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

	onInitialized(onCompleted?: () => void) {
		AppRTU.start(async () => {
			if (this.configSvc.isWebApp) {
				PlatformUtility.setPWAEnvironment(() => this.configSvc.watchFacebookConnect());
			}
			if (this.configSvc.isAuthenticated) {
				this.configSvc.patchAccount(() => this.configSvc.getProfile());
			}
			console.log("<AppComponent>: The app is initialized", this.configSvc.isDebug ? this.configSvc.appConfig.app : "");
			AppEvents.broadcast("AppIsInitialized", this.configSvc.appConfig.app);
			await this.appFormsSvc.hideLoadingAsync(onCompleted);
		});
	}

}
