import { Subscription } from "rxjs";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppCrypto } from "../../../components/app.crypto";
import { TrackingUtility } from "../../../components/app.utility.trackings";
import { AppFormsControl, AppFormsService } from "../../../components/forms.service";
import { ConfigurationService } from "../../../services/configuration.service";
import { BooksService } from "../../../services/books.service";

@Component({
	selector: "page-books-options",
	templateUrl: "./options.page.html",
	styleUrls: ["./options.page.scss"]
})

export class BooksOptionsPage implements OnInit, OnDestroy {
	constructor(
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public booksSvc: BooksService
	) {
	}

	title = "";
	options: any = {};
	form = new FormGroup({});
	controls = new Array<AppFormsControl>();
	config: Array<any>;
	sample = "";
	hash = "";
	subscription: Subscription;

	ngOnInit() {
		this.subscription = this.form.valueChanges.subscribe(value => this.options = value);
		this.initializeAsync();
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	async initializeAsync() {
		this.title = await this.configSvc.getResourceAsync("books.options.title");
		this.sample = await this.configSvc.getResourceAsync("books.options.labels.sample");
		const config = new Array<any>();
		["color", "font", "size", "paragraph", "align"].forEach(async name => {
			const resources = await this.configSvc.getResourcesAsync(`books.options.${name}`);
			config.push({
				Name: name,
				Type: "Select",
				Options: {
					Label: await this.configSvc.getResourceAsync(`books.options.labels.${name}`),
					SelectOptions: {
						Values: Object.keys(resources).map(value => {
							return {
								Value: value,
								Label: resources[value]
							};
						})
					}
				}
			});
		});
		this.config = config;
		await TrackingUtility.trackAsync(this.title, "books/options");
	}

	onFormInitialized($event) {
		this.form.patchValue(this.booksSvc.readingOptions);
		this.hash = AppCrypto.hash(this.form.value);
	}

	onClose() {
		if (this.hash !== AppCrypto.hash(this.form.value)) {
			Object.keys(this.options).forEach(key => this.booksSvc.readingOptions[key] = this.options[key]);
			this.configSvc.storeOptionsAsync();
		}
	}

}
