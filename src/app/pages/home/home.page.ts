import * as Rx from "rxjs";
import { List } from "linqts";
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from "@angular/core";
import { AppEvents } from "../../components/app.events";
import { AppUtility } from "../../components/app.utility";
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
	}

	rxSubscriptions = new Array<Rx.Subscription>();

	ngOnInit() {
		if (this.configSvc.isReady) {
			this.initialize();
		}
		else {
			AppEvents.on("AppIsInitialized", info => this.initialize(), "AppReadyEventHandlerOfHomePage");
		}
	}

	ngOnDestroy() {
		this.rxSubscriptions.forEach(subscription => subscription.unsubscribe());
		AppEvents.off("AppIsInitialized", "AppReadyEventHandlerOfHomePage");
	}

	ngAfterViewInit() {
	}

	initialize() {
		this.configSvc.appTitle = "Màn hình chính";
	}

}
