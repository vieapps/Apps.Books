import { List } from "linqts";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import vi_VN from "@angular/common/locales/vi";
import en_US from "@angular/common/locales/en";
import { AppUtility } from "../../components/app.utility";
import { AppEvents } from "../../components/app.events";
import { ConfigurationService } from "../../providers/configuration.service";
import { BooksService } from "../../providers/books.service";
import { Book } from "../../models/book";

@Component({
	selector: "control-book-home-screen",
	templateUrl: "./control.home.html",
	styleUrls: ["./control.home.scss"]
})
export class BookHomeScreenControl implements OnInit, OnDestroy {

	constructor (
		public configSvc: ConfigurationService,
		public booksSvc: BooksService
	) {
		registerLocaleData("vi_VN" === this.locale ? vi_VN : en_US);
	}

	introduction = "";
	title = "Mới cập nhật";
	books = new Array<Book>();

	get status() {
		return this.booksSvc.status;
	}

	get locale() {
		return this.configSvc.appConfig.locale;
	}

	ngOnInit() {
		if (this.configSvc.isReady) {
			this.initialize();
		}
		else {
			AppEvents.on("App", info => {
				if ("Initialized" === info.args.Type) {
					this.initialize();
				}
			}, "AppReadyEventHandlerOfBookHomeScreen");
		}
		AppEvents.on("Navigate", () => this.updateBooks(), "NavigateEventsOfBookHomeScreen");
	}

	ngOnDestroy() {
		AppEvents.off("App", "AppReadyEventHandlerOfBookHomeScreen");
		AppEvents.off("Navigate", "NavigateEventsOfBookHomeScreen");
	}

	initialize() {
		if (this.booksSvc.introductions === undefined) {
			this.booksSvc.fetchIntroductionsAsync(() => {
				this.updateBooks();
				this.updateIntroduction();
			});
		}
		if (this.books.length > 0) {
			this.updateBooks();
			this.updateIntroduction();
		}
		else {
			this.booksSvc.searchAsync({ FilterBy: {}, SortBy: {} }, () => {
				this.updateBooks();
				this.updateIntroduction();
			});
		}
	}

	updateIntroduction() {
		this.introduction = this.booksSvc.introductions.introduction;
	}

	updateBooks() {
		this.books = AppUtility.getTopScores(new List(Book.instances.values()).OrderByDescending(o => o.LastUpdated).Take(40).ToArray(), 12);
	}

	trackBook(index: number, book: Book) {
		return book.ID;
	}

}
