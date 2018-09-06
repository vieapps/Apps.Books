import * as Rx from "rxjs";
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import { AppEvents } from "../../components/app.events";
import { ConfigurationService } from "../../providers/configuration.service";

@Component({
	selector: "page-home",
	templateUrl: "./home.page.html",
	styleUrls: ["./home.page.scss"],
})
export class HomePage implements OnInit, OnDestroy, AfterViewInit {

	constructor(
		public configSvc: ConfigurationService
	) {
		registerLocaleData(this.configSvc.locale);
	}

	title = "Màn hình chính";
	rxSubscriptions = new Array<Rx.Subscription>();

	ngOnInit() {
		this.setTitle();
		AppEvents.on("Navigate", info => {
			if (this.configSvc.appConfig.url.home === info.args.url || ("Back" === info.args.direction && this.configSvc.previousUrl.startsWith(this.configSvc.appConfig.url.home))) {
				this.setTitle();
			}
		}, "NavigateEventHandlersOfHomePage");
	}

	ngOnDestroy() {
		this.rxSubscriptions.forEach(subscription => subscription.unsubscribe());
		AppEvents.off("Navigate", "NavigateEventHandlersOfHomePage");
	}

	ngAfterViewInit() {
	}

	setTitle() {
		this.configSvc.appTitle = this.title;
	}

}
