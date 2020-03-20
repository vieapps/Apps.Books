import { Component, OnInit, OnDestroy } from "@angular/core";
import { AppEvents } from "../components/app.events";
import { TrackingUtility } from "../components/app.utility.trackings";
import { ConfigurationService } from "../services/configuration.service";

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
	titleResource = "homepage.title";
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

		AppEvents.on("Navigated", async info => {
			if (this.configSvc.appConfig.url.home === info.args.Url) {
				await this.setTitleAsync();
				await this.trackAsync("return");
				AppEvents.broadcast("App", { Type: "HomePageIsOpened" });
				this.changes = new Date();
			}
		}, "NavigatingEventHandlerOfHomePage");

		AppEvents.on("SetHomepageTitleResource", info => {
			this.titleResource = info.args.ResourceID || "homepage.title";
		}, "SetTitleResourceEventHandlerOfHomePage");
	}

	ngOnDestroy() {
		AppEvents.off("App", "AppReadyEventHandlerOfHomePage");
		AppEvents.off("App", "LanguageChangedEventHandlerOfHomePage");
		AppEvents.off("Navigated", "NavigatingEventHandlerOfHomePage");
		AppEvents.off("SetHomepageTitleResource", "SetTitleResourceEventHandlerOfHomePage");
	}

	private async initializeAsync() {
		await this.setTitleAsync();
		await this.trackAsync();
	}

	private async setTitleAsync() {
		this.configSvc.appTitle = this.title = await this.configSvc.getResourceAsync(this.titleResource);
	}

	private trackAsync(section?: string) {
		return TrackingUtility.trackAsync(this.title, `${this.configSvc.appConfig.url.home}/${section || "initialize"}`);
	}

}
