import { Component, OnInit } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";

import { Platform } from "@ionic/angular";
import { TranslateService } from "@ngx-translate/core";

import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { StatusBar } from "@ionic-native/status-bar/ngx";

import { AppRTU } from "./components/app.rtu";
import { AppEvents } from "./components/app.events";
import { AppCrypto } from "./components/app.crypto";
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
		public translateSvc: TranslateService,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public usersSvc: UsersService,
		public booksSvc: BooksService
	) {
		if (this.configSvc.isDebug) {
			console.log("<AppComponent>: Initializing...");
		}
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
					direction: string,
					onClick: () => void
				},
				items: Array<{
					title: string,
					url: string,
					queryParams: { [key: string]: any },
					icon: string,
					thumbnail: string,
					direction: string,
					detail: boolean,
					onClick: () => void
				}>
			}>()
		}
	};

	ngOnInit() {
		this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				this.configSvc.appConfig.url.routerParams = this.router.routerState.snapshot.root.params;
				this.configSvc.addUrl((event as NavigationEnd).url, this.router.routerState.snapshot.root.queryParams);
			}
		});

		this.platform.ready().then(async () => {
			await this.configSvc.prepareAsync();
			await this.configSvc.loadOptionsAsync();

			if (this.platform.is("cordova")) {
				this.splashScreen.hide();
				if (this.configSvc.isNativeApp) {
					this.statusBar.styleDefault();
					this.statusBar.overlaysWebView(false);
					if (this.configSvc.isRunningOnIOS) {
						this.statusBar.backgroundColorByHexString("f8f8f8");
					}
				}
			}

			this.translateSvc.addLangs(this.configSvc.languages.map(language => language.Value));
			this.translateSvc.setDefaultLang(this.configSvc.appConfig.language);
			await this.configSvc.setResourceLanguageAsync(this.configSvc.appConfig.language);

			const isActivate = this.configSvc.isWebApp && "activate" === this.configSvc.queryParams["prego"];
			await this.appFormsSvc.showLoadingAsync(await this.configSvc.getResourceAsync(isActivate ? "common.messages.activating" : "common.messages.loading"));

			await this.updateSidebarAsync();
			this.sidebar.left.title = this.configSvc.appConfig.app.name;
			this.setupEventHandlers();

			if (isActivate) {
				await this.activateAsync();
			}
			else {
				await this.initializeAsync();
			}
		});
	}

	trackSidebarItem(index: number, item: any) {
		return `${item.title}@${index}`;
	}

	private async getSidebarItemsAsync() {
		return {
			home: {
				title: await this.configSvc.getResourceAsync("common.sidebar.home"),
				url: "/home",
				queryParams: undefined as { [key: string]: any },
				direction: "root",
				icon: "home",
				thumbnail: undefined as string,
				detail: false,
				onClick: () => {}
			},
			login: {
				title: await this.configSvc.getResourceAsync("common.sidebar.login"),
				url: "/users/login",
				queryParams: undefined as { [key: string]: any },
				direction: "forward",
				icon: "log-in",
				thumbnail: undefined as string,
				detail: false,
				onClick: () => {}
			},
			register: {
				title: await this.configSvc.getResourceAsync("common.sidebar.register"),
				url: "/users/register",
				queryParams: undefined as { [key: string]: any },
				direction: "forward",
				icon: "person-add",
				thumbnail: undefined as string,
				detail: false,
				onClick: () => {}
			},
			profile: {
				title: await this.configSvc.getResourceAsync("common.sidebar.profile"),
				url: "/users/profile/my",
				queryParams: undefined as { [key: string]: any },
				direction: "forward",
				icon: "person",
				thumbnail: undefined as string,
				detail: false,
				onClick: () => {}
			}
		};
	}

	private updateSidebarItem(menuIndex: number = -1, itemIndex: number = -1, itemInfo: any = {}) {
		if (menuIndex > -1 && menuIndex < this.sidebar.left.menu.length) {
			const item = {
				title: itemInfo.title,
				url: itemInfo.url,
				queryParams: itemInfo.queryParams as { [key: string]: any },
				direction: itemInfo.direction || "forward",
				icon: itemInfo.icon,
				thumbnail: itemInfo.thumbnail,
				detail: !!itemInfo.detail,
				onClick: typeof itemInfo.onClick === "function" ? itemInfo.onClick : () => {}
			};
			if (itemIndex > -1 && itemIndex < this.sidebar.left.menu[menuIndex].items.length) {
				this.sidebar.left.menu[menuIndex].items[itemIndex] = item;
			}
			else {
				AppUtility.insertAt(this.sidebar.left.menu[menuIndex].items, item, itemIndex);
			}
		}
	}

	private async updateSidebarAsync(info: any = {}) {
		const index = info.index !== undefined ? info.index : 0;
		while (this.sidebar.left.menu.length < index + 1) {
			this.sidebar.left.menu.push({
				title: undefined,
				icon: undefined,
				thumbnail: undefined,
				parent: undefined,
				items: []
			});
		}

		if (info.reset !== undefined ? info.reset as boolean : true) {
			this.sidebar.left.menu[index].items = [];
		}

		if (index === 0) {
			const sidebarItems = await this.getSidebarItemsAsync();
			this.updateSidebarItem(index, -1, sidebarItems.home);

			if (this.configSvc.isAuthenticated) {
				this.updateSidebarItem(index, -1, sidebarItems.profile);
			}
			else {
				this.updateSidebarItem(index, -1, sidebarItems.login);
			}

			if (this.authSvc.canRegisterNewAccounts) {
				this.updateSidebarItem(index, -1, sidebarItems.register);
			}
		}
		else {
			this.sidebar.left.menu[index].title = info.title;
			this.sidebar.left.menu[index].icon = info.icon;
			this.sidebar.left.menu[index].thumbnail = info.thumbnail;
		}

		(info.items as Array<any> || [])
			.map(item => {
				return {
					title: item.title,
					url: item.url,
					queryParams: item.queryParams,
					direction: item.direction,
					icon: item.icon,
					thumbnail: item.thumbnail,
					detail: item.detail,
					onClick: item.onClick
				};
			})
			.filter(item => AppUtility.isNotEmpty(item.title) && AppUtility.isNotEmpty(item.url))
			.forEach(item => this.updateSidebarItem(index, -1, item));
	}

	private async normalizeSidebarMenuAsync() {
		const sidebarItems = await this.getSidebarItemsAsync();
		const items = this.sidebar.left.menu[0].items;
		if (this.configSvc.isAuthenticated) {
			AppUtility.removeAt(items, items.findIndex(item => item.url.startsWith(sidebarItems.register.url)));
			const index = items.findIndex(item => item.url.startsWith(sidebarItems.login.url));
			if (index > -1) {
				items[index] = sidebarItems.profile;
			}
			else if (items.findIndex(item => item.url.startsWith(sidebarItems.profile.url)) < 0) {
				AppUtility.insertAt(items, sidebarItems.profile);
			}
		}
		else {
			if (items.findIndex(item => item.url.startsWith(sidebarItems.login.url)) < 0) {
				const index = items.findIndex(item => item.url.startsWith(sidebarItems.profile.url));
				if (index > -1) {
					items[index] = sidebarItems.login;
				}
				else {
					AppUtility.insertAt(items, sidebarItems.login);
				}
			}
			if (this.authSvc.canRegisterNewAccounts && items.findIndex(item => item.url.startsWith(sidebarItems.register.url)) < 0) {
				const index = items.findIndex(item => item.url.startsWith(sidebarItems.login.url));
				AppUtility.insertAt(items, sidebarItems.register, index > -1 ? index + 1 : -1);
			}
		}
	}

	private setupEventHandlers() {
		AppEvents.on("UpdateSidebar", async info => await this.updateSidebarAsync(info.args));
		AppEvents.on("AddSidebarItem", info => this.updateSidebarItem(info.args.MenuIndex !== undefined ? info.args.MenuIndex : -1, -1, info.args.ItemInfo));
		AppEvents.on("UpdateSidebarItem", info => this.updateSidebarItem(info.args.MenuIndex !== undefined ? info.args.MenuIndex : -1, info.args.ItemIndex !== undefined ? info.args.ItemIndex : -1, info.args.ItemInfo));
		AppEvents.on("UpdateSidebarTitle", info => this.sidebar.left.title = AppUtility.isNotEmpty(info.args.Title) ? info.args.Title : this.sidebar.left.title);

		AppEvents.on("Session", async info => {
			if ("Loaded" === info.args.Type || "Updated" === info.args.Type) {
				const profile = this.configSvc.getAccount().profile;
				this.sidebar.left.title = profile !== undefined ? profile.Name : this.configSvc.appConfig.app.name;
				this.sidebar.left.avatar = profile !== undefined ? profile.avatarURI : undefined;
				await this.normalizeSidebarMenuAsync();
			}
		});

		AppEvents.on("App", async info => {
			if ("LanguageChanged" === info.args.Type) {
				await this.updateSidebarAsync();
				await this.normalizeSidebarMenuAsync();
			}
		});
	}

	private async activateAsync() {
		const mode = this.configSvc.queryParams["mode"];
		const code = this.configSvc.queryParams["code"];
		if (AppUtility.isNotEmpty(mode) && AppUtility.isNotEmpty(code)) {
			await this.usersSvc.activateAsync(
				mode,
				code,
				async () => await this.initializeAsync(async () => {
					await Promise.all([
						TrackingUtility.trackAsync(await this.configSvc.getResourceAsync("common.loading.activate"), `users/activate/${mode}`),
						this.showActivationResultAsync({
							Status: "OK",
							Mode: mode
						})
					]);
				}, true),
				async error => await this.initializeAsync(async () => await this.showActivationResultAsync({
					Status: "Error",
					Mode: mode,
					Error: error
				}))
			);
		}
		else {
			await this.initializeAsync(async () => await this.showActivationResultAsync({
				Status: "Error",
				Mode: mode,
				Error: {
					Message: await this.configSvc.getResourceAsync("users.activate.messages.error.invalid", { mode: mode, code: code })
				}
			}));
		}
	}

	private async showActivationResultAsync(data: any) {
		await this.appFormsSvc.showAlertAsync(
			await this.configSvc.getResourceAsync("account" === data.Mode ? "users.activate.header.account" : "users.activate.header.password"),
			await this.configSvc.getResourceAsync("OK" === data.Status ? "users.activate.subHeader.success" : "users.activate.subHeader.error"),
			"OK" === data.Status
				? await this.configSvc.getResourceAsync("account" === data.Mode ? "users.activate.messages.success.account" : "users.activate.messages.success.password")
				: await this.configSvc.getResourceAsync("users.activate.messages.error.general", { error: (data.Error ? ` (${data.Error.Message})` : "") }),
			async () => {
				this.configSvc.appConfig.url.stack[this.configSvc.appConfig.url.stack.length - 1] = {
					url: this.configSvc.appConfig.url.home,
					params: {}
				};
				await this.router.navigateByUrl(this.configSvc.appConfig.url.home);
			}
		);
	}

	private async initializeAsync(onNext?: () => void, noInitializeSession?: boolean) {
		await this.configSvc.initializeAsync(
			async () => {
				if (this.configSvc.isReady && this.configSvc.isAuthenticated) {
					console.log("<AppComponent>: The session is initialized & registered (user)", this.configSvc.isDebug ? this.configSvc.appConfig.isNativeApp ? JSON.stringify(this.configSvc.appConfig.session) : this.configSvc.appConfig.session : "");
					this.startRTU(onNext);
				}
				else {
					console.log("<AppComponent>: Register the initialized session (anonymous)", this.configSvc.isDebug ? this.configSvc.appConfig.isNativeApp ? JSON.stringify(this.configSvc.appConfig.session) : this.configSvc.appConfig.session : "");
					await this.configSvc.registerSessionAsync(
						() => {
							console.log("<AppComponent>: The session is registered (anonymous)", this.configSvc.isDebug ? this.configSvc.appConfig.isNativeApp ? JSON.stringify(this.configSvc.appConfig.session) : this.configSvc.appConfig.session : "");
							this.startRTU(onNext);
						},
						async error => {
							if (AppUtility.isGotSecurityException(error)) {
								console.warn("<AppComponent>: Cannot register, the session is need to be re-initialized (anonymous)");
								await this.configSvc.resetSessionAsync(() => PlatformUtility.setTimeout(async () => await this.initializeAsync(onNext, noInitializeSession), 234));
							}
							else {
								await this.appFormsSvc.hideLoadingAsync(() => console.error("<AppComponent>: Cannot initialize the app => " + AppUtility.getErrorMessage(error), error));
							}
						}
					);
				}
			},
			async error => {
				if (AppUtility.isGotSecurityException(error)) {
					console.warn("<AppComponent>: Cannot initialize, the session is need to be re-initialized (anonymous)");
					await this.configSvc.resetSessionAsync(() => PlatformUtility.setTimeout(async () => await this.initializeAsync(onNext, noInitializeSession), 234));
				}
				else {
					await this.appFormsSvc.hideLoadingAsync(() => console.error("<AppComponent>: Cannot initialize the app => " + AppUtility.getErrorMessage(error), error));
				}
			},
			noInitializeSession
		);
	}

	private startRTU(onNext?: () => void) {
		AppRTU.start(async () => {
			if (this.configSvc.isWebApp) {
				PlatformUtility.setPWAEnvironment(() => this.configSvc.watchFacebookConnect());
			}
			if (this.configSvc.isAuthenticated) {
				this.configSvc.patchAccount(() => this.configSvc.getProfile());
			}
			if (this.configSvc.isDebug) {
				console.log("<AppComponent>: The app is initialized", this.configSvc.appConfig.isNativeApp ? JSON.stringify(this.configSvc.appConfig.app) : this.configSvc.appConfig.app);
			}
			AppEvents.broadcast("App", { Type: "Initialized" });
			await this.appFormsSvc.hideLoadingAsync(async () => {
				if (onNext !== undefined) {
					onNext();
				}
				else {
					let redirect = this.configSvc.queryParams["redirect"] as string || this.configSvc.appConfig.url.redirectToWhenReady;
					if (redirect !== undefined) {
						this.configSvc.appConfig.url.redirectToWhenReady = undefined;
						this.configSvc.appConfig.url.stack[this.configSvc.appConfig.url.stack.length - 1] = {
							url: this.configSvc.appConfig.url.home,
							params: {}
						};
						try {
							redirect = AppCrypto.urlDecode(redirect);
							console.log(`<AppComponent>: Redirect to the request url\n=>: ${redirect}`);
							await this.configSvc.navigateForwardAsync(redirect);
						}
						catch (error) {
							console.error(`<AppComponent>: Redirect url is not well-form\n[${redirect}]`, this.configSvc.appConfig.isNativeApp ? JSON.stringify(error) : error);
						}
					}
				}
			});
		});
	}

}
