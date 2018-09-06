import * as Rx from "rxjs";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { AppEvents } from "../../components/app.events";
import { ConfigurationService } from "../../providers/configuration.service";

@Component({
	selector: "page-home",
	templateUrl: "./home.page.html",
	styleUrls: ["./home.page.scss"],
})
export class HomePage implements OnInit, OnDestroy {

	constructor(
		public configSvc: ConfigurationService
	) {
	}

	title = "Home";

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

		AppEvents.on("Navigate", info => {
			if (this.configSvc.isNavigateTo(this.configSvc.appConfig.url.home, info.args.url, info.args.direction)) {
				this.setTitle();
			}
		}, "NavigateEventHandlersOfHomePage");
	}

	ngOnDestroy() {
		AppEvents.off("App", "AppReadyEventHandlerOfHomePage");
		AppEvents.off("App", "LanguageChangedEventHandlerOfHomePage");
		AppEvents.off("Navigate", "NavigateEventHandlersOfHomePage");
	}

	setTitle() {
		this.configSvc.appTitle = this.title;
	}

	async initializeAsync() {
		this.title = await this.configSvc.getResourceAsync("app.homepage.title");
		this.setTitle();
	}

}
