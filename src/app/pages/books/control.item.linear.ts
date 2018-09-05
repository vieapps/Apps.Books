import { Component, Input } from "@angular/core";
import { AppUtility } from "../../components/app.utility";
import { BooksService } from "../../providers/books.service";
import { Book } from "../../models/book";

@Component({
	selector: "control-book-linear-item",
	templateUrl: "./control.item.linear.html",
	styleUrls: ["./control.item.linear.scss"]
})
export class BookLinearItemControl {

	constructor (
		public booksSvc: BooksService
	) {
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

}
