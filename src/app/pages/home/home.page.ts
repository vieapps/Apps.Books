import { Component, OnInit } from "@angular/core";
import { AppUtility } from "../../components/app.utility";
import { ConfigurationService } from "../../providers/configuration.service";

@Component({
	selector: "page-home",
	templateUrl: "home.page.html",
	styleUrls: ["home.page.scss"],
})
export class HomePage implements OnInit {

	constructor(
		public configSvc: ConfigurationService
	) {
	}

	public ngOnInit() {
		this.configSvc.appTitle = "Màn hình chính";
		this.configSvc.resetUrl();
	}

}
