import { Component, OnInit, OnDestroy } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import { AppEvents } from "../../../components/app.events";
import { AppUtility } from "../../../components/app.utility";
import { PlatformUtility } from "../../../components/app.utility.platform";
import { TrackingUtility } from "../../../components/app.utility.trackings";
import { AppFormsService } from "../../../components/forms.service";
import { ConfigurationService } from "../../../services/configuration.service";
import { AuthenticationService } from "../../../services/authentication.service";
import { BooksService } from "../../../services/books.service";
import { Book } from "../../../models/book";
import { CounterInfo } from "../../../models/counters";

@Component({
	selector: "page-books-info",
	templateUrl: "./info.page.html",
	styleUrls: ["./info.page.scss"]
})

export class BooksInfoPage implements OnInit, OnDestroy {
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
		source: "Source",
		chapters: "Number of chapters",
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
		updated: "Updated at",
		link: "Permanent link"
	};

	get locale() {
		return this.configSvc.locale;
	}

	get sourceUrl() {
		return this.book.SourceUrl !== ""
			? this.book.SourceUrl.replace("/mobile/", "/").replace("/mobil/", "/truyen/").replace("http://", "https://")
			: undefined;
	}

	get redirectUrl() {
		return this.book !== undefined ? PlatformUtility.getRedirectURI(this.book.routerURI) : this.configSvc.appConfig.URIs.activations;
	}

	ngOnInit() {
		this.initializeAsync();

		AppEvents.on("App", async info => {
			if ("LanguageChanged" === info.args.Type) {
				await this.prepareResourcesAsync();
			}
		}, "LanguageChangedEventHandlerOfViewBookInfoPage");

		AppEvents.on("Books", info => {
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

	initializeAsync() {
		const id = this.configSvc.requestParams["ID"];
		return this.booksSvc.getAsync(id, async () => {
			this.book = Book.instances.getValue(id);
			if (this.book !== undefined) {
				await this.prepareResourcesAsync();
				this.getStatistics();
				this.title = this.configSvc.appTitle = this.book.Title + " - " + this.book.Author;
				this.qrcode = this.redirectUrl + (this.configSvc.appConfig.isNativeApp ? "" : `&ngxapps=${this.booksSvc.name}&ngxaction=Open&ngxid=${this.book.ID}`);
				if (AppUtility.isObject(this.book.Files, true) && (this.book.Files.Epub.Size === "generating..." || this.book.Files.Mobi.Size === "generating...")) {
					this.booksSvc.generateFiles(this.book.ID);
				}
				await TrackingUtility.trackAsync("Info: " + this.title, this.book.routerLink);
			}
			else {
				await this.configSvc.navigateBackAsync();
			}
		});
	}

	async prepareResourcesAsync() {
		this.resources = {
			category: await this.configSvc.getResourceAsync("books.info.controls.Category"),
			original: await this.configSvc.getResourceAsync("books.info.controls.Original"),
			author: await this.configSvc.getResourceAsync("books.info.controls.Author"),
			translator: await this.configSvc.getResourceAsync("books.info.controls.Translator"),
			publisher: await this.configSvc.getResourceAsync("books.info.controls.Publisher"),
			producer: await this.configSvc.getResourceAsync("books.info.controls.Producer"),
			source: await this.configSvc.getResourceAsync("books.info.controls.Source"),
			chapters: await this.configSvc.getResourceAsync("books.info.chapters"),
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
			updated: await this.configSvc.getResourceAsync("books.info.updated"),
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

	copyLinkAsync() {
		PlatformUtility.copyToClipboard(this.redirectUrl);
		return this.appFormsSvc.showToastAsync("Copied...");
	}

	openSource() {
		PlatformUtility.openURI(this.sourceUrl);
	}

}
