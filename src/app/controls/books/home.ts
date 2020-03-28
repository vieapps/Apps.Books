import { List } from "linqts";
import { Component, OnInit, OnDestroy, OnChanges, Input, Output, EventEmitter } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import { AppUtility } from "../../components/app.utility";
import { AppEvents } from "../../components/app.events";
import { ConfigurationService } from "../../services/configuration.service";
import { BooksService } from "../../services/books.service";
import { Book } from "../../models/book";

@Component({
	selector: "control-book-home-screen",
	templateUrl: "./home.html",
	styleUrls: ["./home.scss"]
})

export class BookHomeScreenControl implements OnInit, OnDestroy, OnChanges {

	constructor(
		public configSvc: ConfigurationService,
		private booksSvc: BooksService
	) {
		this.configSvc.locales.forEach(locale => registerLocaleData(this.configSvc.getLocaleData(locale)));
	}

	/** The flag to known the parent was changed */
	@Input() changes: any;

	/** The event handler to run when the controls was initialized */
	@Output() init: EventEmitter<any> = new EventEmitter();

	/** The event handler to run when the control was changed */
	@Output() change = new EventEmitter<any>();

	introduction = "";
	labels = {
		latest: "Latest",
		statistics: "Statistics:",
		authors: "Authors: ",
		books: "Articles & Books: "
	};
	books: Array<Book>;

	get status() {
		return this.configSvc.isReady ? this.booksSvc.status : undefined;
	}

	get locale() {
		return this.configSvc.locale;
	}

	ngOnInit() {
		if (this.configSvc.isReady) {
			this.initializeAsync();
		}
		else {
			AppEvents.on("App", info => {
				if ("Initialized" === info.args.Type) {
					this.initializeAsync();
				}
			}, "AppReadyEventHandlerOfBookHomeScreen");
		}

		AppEvents.on("App", info => {
			if ("LanguageChanged" === info.args.Type) {
				this.prepareResourcesAsync().then(async () => {
					if (this.booksSvc.introductions[this.configSvc.appConfig.language] === undefined) {
						await this.booksSvc.fetchIntroductionsAsync(() => this.updateIntroduction());
					}
					else {
						this.updateIntroduction();
					}
				});
			}
		}, "LanguageChangedEventHandlerOfBookHomeScreen");

		AppEvents.on("Books", info => {
			if ("InstroductionsUpdated" === info.args.Type) {
				this.updateIntroduction();
			}
		}, "IntroductionsChangedEventHandlerOfBookHomeScreen");
	}

	ngOnChanges() {
		if (this.configSvc.isReady) {
			this.updateBooks();
		}
	}

	ngOnDestroy() {
		this.init.unsubscribe();
		this.change.unsubscribe();
		AppEvents.off("App", "AppReadyEventHandlerOfBookHomeScreen");
		AppEvents.off("App", "LanguageChangedEventHandlerOfBookHomeScreen");
		AppEvents.off("Books", "IntroductionsChangedEventHandlerOfBookHomeScreen");
	}

	private async initializeAsync() {
		await this.prepareResourcesAsync();

		if (this.booksSvc.introductions[this.configSvc.appConfig.language] === undefined) {
			await this.booksSvc.fetchIntroductionsAsync(() => this.updateIntroduction());
		}
		else {
			this.updateIntroduction();
		}

		if (this.books === undefined) {
			await this.booksSvc.searchAsync({ FilterBy: {}, SortBy: {} }, () => this.updateBooks());
		}
		else {
			this.updateBooks();
		}

		this.init.emit(this);
	}

	private async prepareResourcesAsync() {
		this.labels = {
			latest: await this.configSvc.getResourceAsync("books.home.latest"),
			statistics: await this.configSvc.getResourceAsync("books.home.statistics.label"),
			authors: await this.configSvc.getResourceAsync("books.home.statistics.authors"),
			books: await this.configSvc.getResourceAsync("books.home.statistics.books")
		};
	}

	private updateIntroduction() {
		this.introduction = (this.booksSvc.introductions[this.configSvc.appConfig.language] || {}).introduction;
		this.change.emit(this);
	}

	private updateBooks() {
		this.books = AppUtility.getTopScores(new List(Book.instances.values()).OrderByDescending(book => book.LastUpdated).Take(60), 12, book => Book.get(book.ID));
		this.change.emit(this);
	}

	trackBook(index: number, book: Book) {
		return `${book.ID}@${index}`;
	}

}
