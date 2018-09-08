import * as Rx from "rxjs";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { AppCrypto } from "../../components/app.crypto";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { AppFormsControl, AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../providers/configuration.service";
import { BooksService } from "../../providers/books.service";

@Component({
	selector: "page-book-reading-options",
	templateUrl: "./options.page.html",
	styleUrls: ["./options.page.scss"]
})
export class BookReadingOptionsPage implements OnInit, OnDestroy {
	constructor(
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public booksSvc: BooksService
	) {
	}

	title = "";
	options: any = {};
	form = new FormGroup({});
	config: Array<any>;
	controls = new Array<AppFormsControl>();
	sample = "";
	hash = "";
	rxSubscriptions = new Array<Rx.Subscription>();

	ngOnInit() {
		this.rxSubscriptions.push(this.form.valueChanges.subscribe(value => this.options = value));
		this.initializeAsync();
	}

	ngOnDestroy() {
		this.rxSubscriptions.forEach(subscription => subscription.unsubscribe());
	}

	async initializeAsync() {
		this.title = await this.configSvc.getResourceAsync("books.options.title");
		this.sample = await this.configSvc.getResourceAsync("books.options.labels.sample");
		const config = new Array<any>();
		["color", "font", "size", "paragraph", "align"].forEach(async key => {
			const resources = await this.configSvc.getResourcesAsync(`books.options.${key}`);
			config.push({
				Key: key,
				Type: "Select",
				Options: {
					Label: await this.configSvc.getResourceAsync(`books.options.labels.${key}`),
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
		this.hash = AppCrypto.md5(JSON.stringify(this.form.value || {}));
	}

	async closeAsync() {
		if (this.hash !== AppCrypto.md5(JSON.stringify(this.form.value || {}))) {
			Object.keys(this.options).forEach(key => this.booksSvc.readingOptions[key] = this.options[key]);
			await this.configSvc.storeOptionsAsync();
		}
		this.configSvc.navigateBack();
	}

}
