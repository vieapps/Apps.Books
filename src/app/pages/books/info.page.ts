import { Component, OnInit, OnDestroy } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import { AppEvents } from "../../components/app.events";
import { AppUtility } from "../../components/app.utility";
import { PlatformUtility } from "../../components/app.utility.platform";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";
import { BooksService } from "../../providers/books.service";
import { Book } from "../../models/book";
import { CounterInfo } from "./../../models/counters";

@Component({
	selector: "page-book-info",
	templateUrl: "./info.page.html",
	styleUrls: ["./info.page.scss"]
})
export class ViewBookInfoPage implements OnInit, OnDestroy {
	constructor(
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public booksSvc: BooksService
	) {
		this.configSvc.locales.forEach(locale => registerLocaleData(this.configSvc.getLocaleData(locale)));
	}

	title = "";
	qrcode = "";
	link = "";
	book = new Book();
	statistics = {
		views: undefined as CounterInfo,
		downloads: undefined as CounterInfo
	};
	resources = {
		category: "Category",
		original: "Original",
		author: "Author",
		translator: "Translator",
		publisher: "Publisher",
		producer: "Producer",
		chapters: "Number of chapters",
		source: "Source",
		download: "Download",
		qrcode: {
			header: "QR Code",
			description: "Scan this QR Code by your smartphone to quick access"
		},
		statistics: {
			views: "Views",
			downloads: "Downloads",
			total: "Total",
			month: "Total of this month",
			week: "Total of this week"
		},
		link: "Permanent link"
	};

	get locale() {
		return this.configSvc.locale;
	}

	ngOnInit() {
		this.initializeAsync();

		AppEvents.on("App", async info => {
			if ("LanguageChanged" === info.args.Type) {
				await this.prepareResourcesAsync();
			}
		}, "LanguageChangedEventHandlerOfViewBookInfoPage");

		AppEvents.on("Books", async info => {
			if (this.book.ID === info.args.ID) {
				if ("StatisticsUpdated" === info.args.Type) {
					this.getStatistics();
				}
			}
		}, "EventHandlerOfViewBookInfoPage");
	}

	ngOnDestroy() {
		AppEvents.off("App", "LanguageChangedEventHandlerOfViewBookInfoPage");
		AppEvents.off("Books", "EventHandlerOfViewBookInfoPage");
	}

	getStatistics() {
		this.statistics = {
			views: this.book.Counters.getValue("View") || new CounterInfo(),
			downloads: this.book.Counters.getValue("Download") || new CounterInfo()
		};
	}

	async initializeAsync() {
		const id = this.configSvc.requestParams["ID"];
		await this.booksSvc.getAsync(id, async () => {
			this.book = Book.instances.getValue(id);
			if (this.book !== undefined) {
				await this.prepareResourcesAsync();
				this.getStatistics();
				this.title = this.configSvc.appTitle = this.book.Title + " - " + this.book.Author;
				this.link = PlatformUtility.getRedirectURI(this.book.routerURI);
				this.qrcode = this.configSvc.appConfig.isNativeApp
					? "vieapps://books/" + this.book.ID
					: this.link;
				if (AppUtility.isObject(this.book.Files, true) && (this.book.Files.Epub.Size === "generating..." || this.book.Files.Mobi.Size === "generating...")) {
					this.booksSvc.generateFiles(this.book.ID);
				}
				await TrackingUtility.trackAsync(this.title, this.book.routerLink);
			}
			else {
				this.configSvc.navigateBack();
			}
		});
	}

	async prepareResourcesAsync() {
		this.resources = {
			category: await this.configSvc.getResourceAsync("books.info.category"),
			original: await this.configSvc.getResourceAsync("books.info.original"),
			author: await this.configSvc.getResourceAsync("books.info.author"),
			translator: await this.configSvc.getResourceAsync("books.info.translator"),
			publisher: await this.configSvc.getResourceAsync("books.info.publisher"),
			producer: await this.configSvc.getResourceAsync("books.info.producer"),
			chapters: await this.configSvc.getResourceAsync("books.info.chapters"),
			source: await this.configSvc.getResourceAsync("books.info.source"),
			download: await this.configSvc.getResourceAsync("books.info.download"),
			qrcode: {
				header: await this.configSvc.getResourceAsync("books.info.qrcode.header"),
				description: await this.configSvc.getResourceAsync("books.info.qrcode.description", { scanner: this.configSvc.appConfig.isNativeApp ? "app" : "smartphone" })
			},
			statistics: {
				views: await this.configSvc.getResourceAsync("books.info.statistics.views"),
				downloads: await this.configSvc.getResourceAsync("books.info.statistics.downloads"),
				total: await this.configSvc.getResourceAsync("books.info.statistics.total"),
				month: await this.configSvc.getResourceAsync("books.info.statistics.month"),
				week: await this.configSvc.getResourceAsync("books.info.statistics.week")
			},
			link: await this.configSvc.getResourceAsync("books.info.link")
		};
	}

	async downloadAsync(type: string) {
		if (this.configSvc.isAuthenticated) {
			await TrackingUtility.trackAsync("Download: " + this.title, "books/download/success");
			await TrackingUtility.trackAsync("Download: " + this.title, "books/download/" + type.toLowerCase());
			PlatformUtility.openURI(this.book.Files[type].Url + "?" + AppUtility.getQueryOfJson(this.configSvc.appConfig.getAuthenticatedHeaders()));
		}
		else {
			await Promise.all([
				TrackingUtility.trackAsync("Download: " + this.title, "books/download/failed"),
				this.appFormsSvc.showAlertAsync(undefined, undefined, await this.configSvc.getResourceAsync("books.info.notAuthenticated"))
			]);
		}
	}

}
