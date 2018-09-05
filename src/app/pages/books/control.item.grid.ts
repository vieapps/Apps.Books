import { Component, Input } from "@angular/core";
import { AppUtility } from "../../components/app.utility";
import { PlatformUtility } from "../../components/app.utility.platform";
import { ConfigurationService } from "../../providers/configuration.service";
import { BooksService } from "../../providers/books.service";
import { Book } from "../../models/book";

@Component({
	selector: "control-book-grid-item",
	templateUrl: "./control.item.grid.html",
	styleUrls: ["./control.item.grid.scss"]
})
export class BookGridItemControl {

	constructor (
		public configSvc: ConfigurationService,
		public booksSvc: BooksService
	) {
	}

	@Input() book: Book;
	@Input() hideAuthor: boolean;
	@Input() hideCategory: boolean;

	open() {
		this.configSvc.navigateForward(this.book.routerURI);
	}
}
