import { Component } from "@angular/core";
import { FormBuilder, FormArray, FormGroup, Validators } from "@angular/forms";
import { AppUtility } from "../../components/app.utility";
import { ConfigurationService } from "../../providers/configuration.service";

@Component({
	selector: "app-home",
	templateUrl: "home.page.html",
	styleUrls: ["home.page.scss"],
})
export class HomePage {
	public form: FormGroup;

	constructor(
		public configSvc: ConfigurationService
	) {
		this.configSvc.appTitle = "Màn hình chính";
	}

}
