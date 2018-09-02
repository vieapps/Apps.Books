import { Component, Input } from "@angular/core";
import { AppUtility } from "../../components/app.utility";
import { Book } from "../../models/book";

@Component({
	selector: "control-book-linear",
	templateUrl: "./control.book.linear.html",
	styleUrls: ["./control.book.linear.scss"]
})
export class BookLinearControl {

	constructor (
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

}
