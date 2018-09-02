import { Component, Input } from "@angular/core";
import { AppUtility } from "../../components/app.utility";
import { ConfigurationService } from "../../providers/configuration.service";
import { Book } from "../../models/book";

@Component({
	selector: "control-book-grid",
	templateUrl: "./control.book.grid.html",
	styleUrls: ["./control.book.grid.scss"]
})
export class BookGridControl {

	constructor (
		public configSvc: ConfigurationService
	) {
	}

	@Input() book: Book;
	@Input() hideAuthor: boolean;
	@Input() hideCategory: boolean;

	get routerLink() {
		return `/read-books/${this.book.ID}`;
	}

	get queryParams() {
		return {
			"x-request": AppUtility.toBase64Url({
				ID: this.book.ID
			})
		};
	}

	open() {
		this.configSvc.navigateForward(this.routerLink, true, { queryParams: this.queryParams });
	}
}
