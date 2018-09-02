import { Component, Input } from "@angular/core";
import { AppUtility } from "../../components/app.utility";
import { PlatformUtility } from "../../components/app.utility.platform";
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
		} as { [key: string]: any };
	}

	open() {
		this.configSvc.navigateForward(PlatformUtility.getURI(this.routerLink, this.queryParams));
	}
}
