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

	async openAsync() {
		await this.configSvc.navigateForwardAsync(this.book.routerURI || this.book.routerLink + "?x-request=" + this.book.routerParams["x-request"]);
	}

}
