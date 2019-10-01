import { Component, OnInit } from "@angular/core";
import { Router, RoutesRecognized, NavigationEnd } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { Platform, MenuController } from "@ionic/angular";
import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { StatusBar } from "@ionic-native/status-bar/ngx";
import { AppRTU, AppXHR } from "./components/app.apis";
import { AppEvents } from "./components/app.events";
import { AppCrypto } from "./components/app.crypto";
import { AppUtility } from "./components/app.utility";
import { AppFormsService } from "./components/forms.service";
import { PlatformUtility } from "./components/app.utility.platform";
import { TrackingUtility } from "./components/app.utility.trackings";
import { ConfigurationService } from "./services/configuration.service";
import { AuthenticationService } from "./services/authentication.service";
import { UsersService } from "./services/users.service";
import { BooksService } from "./services/books.service";

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html"
})

export class AppComponent implements OnInit {

	constructor(
		public router: Router,
		public http: HttpClient,
		public platform: Platform,
		public menuController: MenuController,
		public splashScreen: SplashScreen,
		public statusBar: StatusBar,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public usersSvc: UsersService,
		public booksSvc: BooksService
	) {
		if (this.configSvc.isDebug) {
			console.log("<AppComponent>: Initializing...");
		}
		AppXHR.initialize(this.http);
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
		},
		home: {
			title: "common.sidebar.home",
			url: this.configSvc.appConfig.url.home,
			queryParams: undefined as { [key: string]: any },
			direction: "root",
			icon: "home",
			thumbnail: undefined as string,
			detail: false,
			onClick: () => {}
		}
	};

	ngOnInit() {
		this.router.events.subscribe(event => {
			if (event instanceof RoutesRecognized) {
				this.configSvc.appConfig.url.routerParams = (event as RoutesRecognized).state.root.params;
				this.configSvc.pushUrl((event as RoutesRecognized).url, (event as RoutesRecognized).state.root.queryParams);
				const current = this.configSvc.getCurrentUrl();
				AppEvents.broadcast("Navigating", { Url: current.url, Params: current.params });
			}
			else if (event instanceof NavigationEnd) {
				if (new Date().getTime() - AppRTU.pingTime > 130000) {
					AppRTU.restart("[Router]: Ping period is too large...");
				}
				const current = this.configSvc.getCurrentUrl();
				AppEvents.broadcast("Navigated", { Url: current.url, Params: current.params });
			}
		});

		this.platform.ready().then(async () => {
			this.configSvc.prepare();
			await this.configSvc.loadOptionsAsync();
			await this.configSvc.prepareLanguagesAsync();
			this.setupEventHandlers();
			AppEvents.broadcast("App", { Type: "PlatformIsReady" });

			if (this.platform.is("cordova")) {
				this.splashScreen.hide();
				if (this.configSvc.isNativeApp) {
					this.statusBar.styleDefault();
					this.statusBar.overlaysWebView(false);
				}
			}

			const isActivate = this.configSvc.isWebApp && "activate" === this.configSvc.queryParams["prego"];
			await this.appFormsSvc.showLoadingAsync(await this.configSvc.getResourceAsync(isActivate ? "common.messages.activating" : "common.messages.loading"));
			await this.updateSidebarAsync();
			this.sidebar.left.title = this.configSvc.appConfig.app.name;

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
				title: await this.configSvc.getResourceAsync(this.sidebar.home.title),
				url: this.sidebar.home.url,
				queryParams: this.sidebar.home.queryParams,
				direction: this.sidebar.home.direction,
				icon: this.sidebar.home.icon,
				thumbnail: this.sidebar.home.thumbnail,
				detail: this.sidebar.home.detail,
				onClick: this.sidebar.home.onClick !== undefined && typeof this.sidebar.home.onClick === "function" ? this.sidebar.home.onClick : () => {}
			},
			login: {
				title: await this.configSvc.getResourceAsync("common.sidebar.login"),
				url: this.configSvc.appConfig.url.users.login,
				queryParams: undefined as { [key: string]: any },
				direction: "forward",
				icon: "log-in",
				thumbnail: undefined as string,
				detail: false,
				onClick: () => {}
			},
			register: {
				title: await this.configSvc.getResourceAsync("common.sidebar.register"),
				url: this.configSvc.appConfig.url.users.register,
				queryParams: undefined as { [key: string]: any },
				direction: "forward",
				icon: "person-add",
				thumbnail: undefined as string,
				detail: false,
				onClick: () => {}
			},
			profile: {
				title: await this.configSvc.getResourceAsync("common.sidebar.profile"),
				url: this.configSvc.appConfig.url.users.profile + "/my",
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
			const oldItem = itemIndex > -1 && itemIndex < this.sidebar.left.menu[menuIndex].items.length
				? this.sidebar.left.menu[menuIndex].items[itemIndex]
				: {
						title: undefined as string,
						url: undefined as string,
						queryParams: undefined as { [key: string]: any },
						icon: undefined as string,
						thumbnail: undefined as string,
						direction: undefined as string
					};
			const updatedItem = {
				title: itemInfo.title || oldItem.title,
				url: itemInfo.url || oldItem.url,
				queryParams: itemInfo.queryParams as { [key: string]: any } || oldItem.queryParams,
				direction: itemInfo.direction || oldItem.direction || "forward",
				icon: itemInfo.icon || oldItem.icon,
				thumbnail: itemInfo.thumbnail || oldItem.thumbnail,
				detail: !!itemInfo.detail,
				onClick: itemInfo.onClick !== undefined && typeof itemInfo.onClick === "function" ? itemInfo.onClick : () => {}
			};
			if (itemIndex > -1 && itemIndex < this.sidebar.left.menu[menuIndex].items.length) {
				this.sidebar.left.menu[menuIndex].items[itemIndex] = updatedItem;
			}
			else {
				AppUtility.insertAt(this.sidebar.left.menu[menuIndex].items, updatedItem, itemIndex);
			}
		}
	}

	private async updateSidebarAsync(info: any = {}) {
		const index = info.index !== undefined ? info.index as number : 0;
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
		AppEvents.on("OpenSidebar", async info => await this.menuController.open(info.args.Type || "start"));
		AppEvents.on("UpdateSidebar", async info => await this.updateSidebarAsync(info.args));

		AppEvents.on("AddSidebarItem", info => this.updateSidebarItem(info.args.MenuIndex !== undefined ? info.args.MenuIndex : -1, -1, info.args.ItemInfo));
		AppEvents.on("UpdateSidebarItem", info => this.updateSidebarItem(info.args.MenuIndex !== undefined ? info.args.MenuIndex : -1, info.args.ItemIndex !== undefined ? info.args.ItemIndex : -1, info.args.ItemInfo));

		AppEvents.on("UpdateSidebarTitle", info => this.sidebar.left.title = AppUtility.isNotEmpty(info.args.Title) ? info.args.Title : this.sidebar.left.title);
		AppEvents.on("UpdateSidebarHome", info => this.sidebar.home = info.args);

		AppEvents.on("Navigate", async info => {
			const url = "LogIn" === info.args.Type
				? this.configSvc.appConfig.url.users.login
				: "Profile" === info.args.Type
					? this.configSvc.appConfig.url.users.profile + "/my"
					: "Accounts" === info.args.Type
						? this.configSvc.appConfig.url.users.list
						: info.args.Url;
			switch ((info.args.Direction as string || "Forward").toLowerCase()) {
				case "home":
					await this.configSvc.navigateHomeAsync(url);
					break;
				case "back":
					await this.configSvc.navigateBackAsync(url);
					break;
				default:
					await this.configSvc.navigateForwardAsync(url);
					break;
			}
		});

		AppEvents.on("Profile", async info => {
			if ("Updated" === info.args.Type) {
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
				AppEvents.sendToElectron("App", { Type: "LanguageChanged", Language: this.configSvc.appConfig.language });
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
				async () => await this.initializeAsync(async () => await Promise.all([
					TrackingUtility.trackAsync(await this.configSvc.getResourceAsync("common.loading.activate"), `users/activate/${mode}`),
					this.showActivationResultAsync({
						Status: "OK",
						Mode: mode
					})
				]), true),
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

	private initializeAsync(onNext?: () => void, noInitializeSession?: boolean) {
		return this.configSvc.initializeAsync(
			async () => {
				if (this.configSvc.isReady && this.configSvc.isAuthenticated) {
					console.log("<AppComponent>: The session is initialized & registered (user)", this.configSvc.isDebug ? this.configSvc.isNativeApp ? JSON.stringify(this.configSvc.appConfig.session) : this.configSvc.appConfig.session : "");
					this.finalize(onNext);
				}
				else {
					console.log("<AppComponent>: Register the initialized session (anonymous)", this.configSvc.isDebug ? this.configSvc.isNativeApp ? JSON.stringify(this.configSvc.appConfig.session) : this.configSvc.appConfig.session : "");
					await this.configSvc.registerSessionAsync(
						() => {
							console.log("<AppComponent>: The session is registered (anonymous)", this.configSvc.isDebug ? this.configSvc.isNativeApp ? JSON.stringify(this.configSvc.appConfig.session) : this.configSvc.appConfig.session : "");
							this.finalize(onNext);
						},
						async error => {
							if (AppUtility.isGotSecurityException(error)) {
								console.warn("<AppComponent>: Cannot register, the session is need to be re-initialized (anonymous)");
								await this.configSvc.resetSessionAsync(() => PlatformUtility.invoke(async () => await this.initializeAsync(onNext, noInitializeSession), 234));
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
					await this.configSvc.resetSessionAsync(() => PlatformUtility.invoke(async () => await this.initializeAsync(onNext, noInitializeSession), 234));
				}
				else {
					await this.appFormsSvc.hideLoadingAsync(() => console.error("<AppComponent>: Cannot initialize the app => " + AppUtility.getErrorMessage(error), error));
				}
			},
			noInitializeSession
		);
	}

	private finalize(onNext?: () => void) {
		const appConfig = this.configSvc.appConfig;
		console.log("<AppComponent>: The app is initialized", this.configSvc.isNativeApp ? JSON.stringify(appConfig.app) : appConfig.app);
		if (this.configSvc.isWebApp) {
			PlatformUtility.preparePWAEnvironment(() => this.configSvc.watchFacebookConnect());
		}

		AppRTU.start(() => {
			AppEvents.broadcast("App", { Type: "Initialized" });
			AppEvents.sendToElectron("App", { Type: "Initialized", Data: {
				URIs: appConfig.URIs,
				app: appConfig.app,
				session: appConfig.session,
				services: appConfig.services,
				organizations: appConfig.organizations,
				accountRegistrations: appConfig.accountRegistrations,
				options: appConfig.options,
				languages: appConfig.languages
			}});
			this.appFormsSvc.hideLoadingAsync(async () => {
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
							if (this.configSvc.isDebug) {
								console.warn(`<AppComponent>: Redirect to the requested url => ${redirect}`);
							}
							await this.configSvc.navigateForwardAsync(redirect);
						}
						catch (error) {
							console.error(`<AppComponent>: Url for redirecting is not well-form => ${redirect}`, this.configSvc.isNativeApp ? JSON.stringify(error) : error);
						}
					}
				}
				AppEvents.broadcast("App", { Type: "FullyInitialized" });
			});
		});
	}

}
