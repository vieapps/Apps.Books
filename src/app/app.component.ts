import { Component } from "@angular/core";
import { Platform } from "@ionic/angular";
import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { StatusBar } from "@ionic-native/status-bar/ngx";

import { AppEvents } from "./components/app.events";
import { AppRTU } from "./components/app.rtu";
import { ConfigurationService } from "./providers/configuration.service";

@Component({
	selector: "app-root",
	templateUrl: "app.component.html"
})
export class AppComponent {
	public appPages = [
		{
			title: "Home",
			url: "/home",
			icon: "home"
		},
		{
			title: "List",
			url: "/list-items",
			icon: "list"
		},
		{
			title: "Sign In",
			url: "/sign-in",
			icon: "log-in"
		}
	];

	constructor(
		private platform: Platform,
		private splashScreen: SplashScreen,
		private statusBar: StatusBar,
		private configSvc: ConfigurationService
	) {
		this.platform.ready().then(() => this.initialize());
	}

	initialize() {
		this.statusBar.styleDefault();
		this.splashScreen.hide();
		this.configSvc.initializeAsync(
			data => {
				this.configSvc.registerSessionAsync(session => {
					console.log("Registered session", this.configSvc.appConfig.session);
					AppRTU.start();
				});
			},
			error => {

			}
		);
	}

}
