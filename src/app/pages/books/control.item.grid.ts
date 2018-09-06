import { Component, Input } from "@angular/core";
import { ConfigurationService } from "../../providers/configuration.service";
import { Book } from "../../models/book";

@Component({
	selector: "control-book-grid-item",
	templateUrl: "./control.item.grid.html",
	styleUrls: ["./control.item.grid.scss"]
})
export class BookGridItemControl {

	constructor (
		public configSvc: ConfigurationService
	) {
	}

	@Input() book: Book;
	@Input() hideAuthor: boolean;
	@Input() hideCategory: boolean;

	open() {
		this.configSvc.navigateForward(this.book.routerURI);
	}
}
