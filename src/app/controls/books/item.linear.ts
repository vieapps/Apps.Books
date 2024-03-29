import { Component, Input } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import { ConfigurationService } from "@services/configuration.service";
import { Book } from "@models/book";

@Component({
	selector: "control-book-linear-item",
	templateUrl: "./item.linear.html",
	styleUrls: ["./item.linear.scss"]
})

export class BookLinearItemControl {

	constructor(
		private configSvc: ConfigurationService
	) {
		this.configSvc.locales.forEach(locale => registerLocaleData(this.configSvc.getLocaleData(locale)));
	}

	@Input() book: Book;
	@Input() hideAuthor: boolean;
	@Input() hideCategory: boolean;

	get color() {
		return this.configSvc.color;
	}

	get locale() {
		return this.configSvc.locale;
	}

	openAsync() {
		return this.configSvc.navigateForwardAsync(this.book.routerURI);
	}

}
