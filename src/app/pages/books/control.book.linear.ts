import { Component, Input } from "@angular/core";
import { AppUtility } from "../../components/app.utility";
import { BooksService } from "../../providers/books.service";
import { Book } from "../../models/book";

@Component({
	selector: "control-book-linear",
	templateUrl: "./control.book.linear.html",
	styleUrls: ["./control.book.linear.scss"]
})
export class BookLinearControl {

	constructor (
		public booksSvc: BooksService
	) {
	}

	@Input() book: Book;
	@Input() hideAuthor: boolean;
	@Input() hideCategory: boolean;

	get routerLink() {
		return this.booksSvc.getBookURI(this.book);
	}

	get queryParams() {
		return this.booksSvc.getBookQueryParams(this.book);
	}

}
