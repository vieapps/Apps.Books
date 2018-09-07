import * as Rx from "rxjs";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { AppEvents } from "../../components/app.events";
import { ConfigurationService } from "../../providers/configuration.service";

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
	rxSubscription: Rx.Subscription;
	changes: any;

	ngOnInit() {
		if (this.configSvc.isReady) {
			this.initializeAsync();
		}
		else {
			AppEvents.on("App", info => {
				if ("Initialized" === info.args.Type) {
					this.initializeAsync();
				}
			}, "AppReadyEventHandlerOfHomePage");
		}

		AppEvents.on("App", async info => {
			if ("LanguageChanged" === info.args.Type) {
				this.initializeAsync();
			}
		}, "LanguageChangedEventHandlerOfHomePage");

		this.rxSubscription = this.router.events.subscribe(event => {
			if (event instanceof NavigationEnd) {
				if (this.configSvc.isNavigateTo(this.configSvc.appConfig.url.home, this.configSvc.currentUrl)) {
					this.setTitle();
					this.changes = new Date();
				}
			}
		});
	}

	ngOnDestroy() {
		AppEvents.off("App", "AppReadyEventHandlerOfHomePage");
		AppEvents.off("App", "LanguageChangedEventHandlerOfHomePage");
		this.rxSubscription.unsubscribe();
	}

	setTitle() {
		this.configSvc.appTitle = this.title;
	}

	async initializeAsync() {
		this.title = await this.configSvc.getResourceAsync("homepage.title");
		this.setTitle();
	}

}
