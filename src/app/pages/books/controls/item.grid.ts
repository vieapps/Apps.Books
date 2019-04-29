import { Component, Input } from "@angular/core";
import { ConfigurationService } from "../../../services/configuration.service";
import { Book } from "../../../models/book";

@Component({
	selector: "control-book-grid-item",
	templateUrl: "./item.grid.html",
	styleUrls: ["./item.grid.scss"]
})

export class BookGridItemControl {

	constructor (
		public configSvc: ConfigurationService
	) {
	}

	@Input() book: Book;
	@Input() hideAuthor: boolean;
	@Input() hideCategory: boolean;

	get coverBackground() {
		return `url(${this.book.Cover})`;
	}

	openAsync() {
		return this.configSvc.navigateForwardAsync(this.book.routerURI || (this.book.routerLink + "?x-request=" + this.book.routerParams["x-request"]));
	}

}
