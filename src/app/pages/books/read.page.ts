import * as Rx from "rxjs";
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from "@angular/core";
import { Content } from "@ionic/angular";
import { AppEvents } from "../../components/app.events";
import { AppUtility } from "../../components/app.utility";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { PlatformUtility } from "../../components/app.utility.platform";
import { AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";
import { BooksService } from "../../providers/books.service";
import { Book } from "../../models/book";
import { RatingPoint } from "../../models/ratingpoint";

@Component({
	selector: "page-read-book",
	templateUrl: "./read.page.html",
	styleUrls: ["./read.page.scss"]
})
export class ReadBookPage implements OnInit, OnDestroy, AfterViewInit {
	constructor(
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public booksSvc: BooksService
	) {
	}

	requestParams: { [key: string]: any };
	rxSubscriptions = new Array<Rx.Subscription>();
	title = "";
	book: Book;
	actions: Array<{
		text: string,
		role: string,
		icon: string,
		handler: () => void
	}>;
	@ViewChild(Content) contentCtrl: Content;

	ngOnInit() {
		this.requestParams = this.configSvc.requestParams;
		this.book = Book.instances.getValue(this.requestParams["ID"]);
		if (this.book !== undefined) {
			this.title = this.configSvc.appTitle = this.book.Title + " - " + this.book.Author;
		}
		this.prepareBookAsync();
		// AppEvents.on("Session", info => {
		// 	if ("Updated" === info.args.Type) {
		// 		this.prepareActions();
		// 	}
		// }, "AccountEventHandlerOfListBooksPage");
	}

	ngOnDestroy() {
		this.rxSubscriptions.forEach(subscription => subscription.unsubscribe());
		// AppEvents.off("Session", "AccountEventHandlerOfListBooksPage");
	}

	ngAfterViewInit() {
	}

	async prepareBookAsync() {
		await this.booksSvc.getAsync(
			this.requestParams["ID"],
			() => {
				this.book = Book.instances.getValue(this.requestParams["ID"]);
				this.title = this.configSvc.appTitle = this.book.Title + " - " + this.book.Author;
				this.prepareActions();
			}
		);
	}

	prepareActions() {
		this.actions = [
			this.appFormsSvc.getActionSheetButton("Mở tìm kiếm", "search", () => this.configSvc.navigateForward("/books/search")),
			this.appFormsSvc.getActionSheetButton("Cùng tác giả", "bookmarks", () => this.configSvc.navigateForward("/books/list-by-author/" + AppUtility.toANSI(this.book.Author, true) + "?x-request=" + AppUtility.toBase64Url({ Author: this.book.Author }))),
			// this.appFormsSvc.getActionSheetButton("Thay đổi cách sắp xếp", "list-box", async () => await this.showSortsAsync())
		];

		if (this.authSvc.isServiceModerator()) {
			this.actions.push(this.appFormsSvc.getActionSheetButton("Lấy dữ liệu", "build", async () => await this.showCrawlAsync()));
		}
	}

	async showActionsAsync() {
		await this.appFormsSvc.showActionSheetAsync(this.actions);
	}

	async showCrawlAsync() {
		await this.appFormsSvc.showAlertAsync(
			"Crawl",
			undefined,
			"Crawl dữ liệu từ nguồn chỉ định",
			async data => {
				if (AppUtility.isNotEmpty(data.SourceUrl)) {
					this.booksSvc.sendRequestToCrawl(data.SourceUrl);
					await this.appFormsSvc.showToastAsync("Đã gửi yêu cầu lấy dữ liệu...", 2000);
				}
			},
			"Lấy dữ liệu",
			"Huỷ bỏ",
			[
				{
					type: "text",
					name: "SourceUrl",
					placeholder: "Url nguồn dữ liệu",
					value: ""
				}
			]
		);
	}

}
