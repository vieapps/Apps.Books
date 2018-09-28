import { Component, Input } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import { ConfigurationService } from "../../providers/configuration.service";
import { Book } from "../../models/book";

@Component({
	selector: "control-book-linear-item",
	templateUrl: "./control.item.linear.html",
	styleUrls: ["./control.item.linear.scss"]
})

export class BookLinearItemControl {

	constructor (
		public configSvc: ConfigurationService
	) {
		this.configSvc.locales.forEach(locale => registerLocaleData(this.configSvc.getLocaleData(locale)));
	}

	@Input() book: Book;
	@Input() hideAuthor: boolean;
	@Input() hideCategory: boolean;

	get routerLink() {
		return this.book.routerLink;
	}

	get queryParams() {
		return this.book.routerParams;
	}

	get locale() {
		return this.configSvc.locale;
	}

}
