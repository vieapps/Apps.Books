import { Subscription } from "rxjs";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { AppEvents } from "../components/app.events";
import { TrackingUtility } from "../components/app.utility.trackings";
import { ConfigurationService } from "../providers/configuration.service";

@Component({
	selector: "page-home",
	templateUrl: "./home.page.html",
	styleUrls: ["./home.page.scss"],
})

export class HomePage implements OnInit, OnDestroy {

	constructor(
		public router: Router,
		public configSvc: ConfigurationService
	) {
	}

	title = "Home";
	routerSubscription: Subscription;
	changes: any;

	ngOnInit() {
		if (this.configSvc.isReady) {
			this.initializeAsync();
		}
		else {
			AppEvents.on("App", async info => {
				if ("Initialized" === info.args.Type) {
					await this.initializeAsync();
				}
			}, "AppReadyEventHandlerOfHomePage");
		}

		AppEvents.on("App", async info => {
			if ("LanguageChanged" === info.args.Type) {
				await this.setTitleAsync();
			}
		}, "LanguageChangedEventHandlerOfHomePage");

		this.routerSubscription = this.router.events.subscribe(async event => {
			if (event instanceof NavigationEnd) {
				if (this.configSvc.isNavigateTo(this.configSvc.appConfig.url.home, this.configSvc.currentUrl)) {
					AppEvents.broadcast("App", { Type: "HomePageIsOpened" });
					this.changes = new Date();
					await this.setTitleAsync();
					await this.trackAsync("return");
				}
			}
		});
	}

	ngOnDestroy() {
		AppEvents.off("App", "AppReadyEventHandlerOfHomePage");
		AppEvents.off("App", "LanguageChangedEventHandlerOfHomePage");
		this.routerSubscription.unsubscribe();
	}

	async initializeAsync() {
		await this.setTitleAsync();
		await this.trackAsync();
	}

	async setTitleAsync() {
		this.configSvc.appTitle = this.title = await this.configSvc.getResourceAsync("homepage.title");
	}

	async trackAsync(section?: string) {
		await TrackingUtility.trackAsync(this.title, this.configSvc.appConfig.url.home + "/" + (section || "initialize"));
	}

}
