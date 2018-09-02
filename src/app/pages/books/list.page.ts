import * as Rx from "rxjs";
import { List } from "linqts";
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from "@angular/core";
import { Searchbar, InfiniteScroll, Content } from "@ionic/angular";
import { AppEvents } from "../../components/app.events";
import { AppPagination } from "../../components/app.pagination";
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
	selector: "page-list-books",
	templateUrl: "./list.page.html",
	styleUrls: ["./list.page.scss"]
})
export class ListBooksPage implements OnInit, OnDestroy, AfterViewInit {
	constructor(
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public booksSvc: BooksService
	) {
	}

	filterBy = {
		Query: undefined as string,
		And: {
			Category: {
				Equals: undefined as string
			},
			Author: {
				Equals: undefined as string
			},
			Status: {
				NotEquals: "Inactive"
			}
		}
	};
	sorts = [
		{
			label: "Tiêu đề (A - Z)",
			value: "Title"
		},
		{
			label: "Mới cập nhật",
			value: "LastUpdated"
		},
		{
			label: "Nhiều chương/phần",
			value: "Chapters"
		}
	];
	sort = this.sorts[1].value;
	pageNumber = 0;
	pagination: { TotalRecords: number, TotalPages: number, PageSize: number, PageNumber: number };
	requestParams: { [key: string]: any };
	request: {
		FilterBy: { [key: string]: any },
		SortBy: { [key: string]: any },
		Pagination: { TotalRecords: number, TotalPages: number, PageSize: number, PageNumber: number }
	};

	books = new Array<Book>();
	ratings: { [key: string]: RatingPoint };

	title = "";
	rxSubscriptions = new Array<Rx.Subscription>();

	asGrid = false;
	filtering = false;
	searching = false;
	processing = false;
	actions: Array<{
		text: string,
		role: string,
		icon: string,
		handler: () => void
	}>;

	@ViewChild(Searchbar) searchCtrl: Searchbar;
	@ViewChild(InfiniteScroll) scrollCtrl: InfiniteScroll;
	@ViewChild(Content) contentCtrl: Content;

	ngOnInit() {
		this.initialize();
		if (!this.searching) {
			AppEvents.on("Session", info => {
				if ("Updated" === info.args.Type) {
					this.prepareActions();
				}
			}, "AccountEventHandlerOfListBooksPage");
		}
	}

	ngOnDestroy() {
		this.rxSubscriptions.forEach(subscription => subscription.unsubscribe());
		if (!this.searching) {
			AppEvents.off("Session", "AccountEventHandlerOfListBooksPage");
		}
	}

	ngAfterViewInit() {
		if (this.searching) {
			this.searchCtrl.placeholder = "Đặt từ khoá trong \"..\" để tìm chính xác (không dấu cũng OK), ví dụ: \"nhóc nicolas\"";
			PlatformUtility.focus(this.searchCtrl);
		}
	}

	get sortBy() {
		return { LastUpdated: "Descending" };
	}

	get hideCategory() {
		return this.searching ? true : this.filterBy.And.Category.Equals === undefined;
	}

	get hideAuthor() {
		return this.searching ? false : this.filterBy.And.Author.Equals === undefined;
	}

	get displayAsGrid() {
		return this.asGrid && !this.searching;
	}

	get totalRecords() {
		return this.pagination === undefined ? 0 : this.pageNumber * this.pagination.PageSize;
	}

	initialize() {
		this.requestParams = this.configSvc.requestParams;
		this.filterBy.And.Category.Equals = this.requestParams["Category"];
		this.filterBy.And.Author.Equals = this.requestParams["Author"];
		this.searching = this.configSvc.currentUrl.startsWith("/books/search");

		this.title = this.searching
			? "Tìm kiếm"
			: this.filterBy.And.Category.Equals !== undefined
				? "Thể loại: " + this.filterBy.And.Category.Equals
				: "Tác giả: " + this.filterBy.And.Author.Equals;
		this.configSvc.appTitle = this.title;

		if (!this.searching) {
			this.ratings = {};
			this.pagination = AppPagination.get({ FilterBy: this.filterBy, SortBy: this.sortBy }, this.booksSvc.serviceName) || AppPagination.getDefault();
			this.pagination.PageNumber = this.pageNumber;
			this.search(() => this.prepareActions());
		}
	}

	onStartSearch($event) {
		this.scrollCtrl.disabled = true;
		if (AppUtility.isNotEmpty($event.detail.value)) {
			this.filterBy.Query = $event.detail.value;
			if (this.searching) {
				this.books = [];
				this.ratings = {};
				this.pageNumber = 0;
				this.pagination = AppPagination.getDefault();
				this.search(() => this.scrollCtrl.disabled = false);
			}
			else {
				this.prepareResults();
			}
		}
		else if (this.filtering) {
			this.filterBy.Query = undefined;
			this.prepareResults();
		}
	}

	onCancelSearch($event) {
		this.scrollCtrl.disabled = true;
		this.filterBy.Query = undefined;
		if (this.searching) {
			this.books = [];
			this.ratings = {};
		}
		else {
			this.prepareResults();
		}
	}

	onScroll($event) {
		if (this.pagination.PageNumber < this.pagination.TotalPages) {
			this.search(() => this.scrollCtrl.complete());
		}
		else {
			this.scrollCtrl.complete();
			this.scrollCtrl.disabled = true;
		}
	}

	search(onCompleted?: () => void) {
		this.request = AppPagination.buildRequest(this.filterBy, this.searching ? undefined : this.sortBy, this.pagination);
		this.booksSvc.searchAsync(
			this.request,
			data => {
				this.pageNumber++;
				this.pagination = data !== undefined ? AppPagination.getDefault(data) : AppPagination.get(this.request, this.booksSvc.serviceName);
				this.pagination.PageNumber = this.pageNumber;
				this.prepareResults(onCompleted, data !== undefined ? data.Objects : undefined);
			}
		);
	}

	prepareResults(onCompleted?: () => void, results?: Array<any>) {
		if (this.searching) {
			(results || []).forEach(o => {
				const book = Book.instances.getValue(o.ID);
				this.books.push(book);
				this.ratings[book.ID] = book.RatingPoints.getValue("General");
			});
		}
		else {
			// initialize the LINQ list
			let objects = new List(results === undefined ? Book.instances.values() : results.map(o => Book.instances.getValue(o.ID)));

			// filter
			if (this.filtering || results === undefined) {
				const query = this.filtering && AppUtility.isNotEmpty(this.filterBy.Query)
					? AppUtility.toANSI(this.filterBy.Query).trim().toLowerCase()
					: "";
				const filterByCategory = AppUtility.isNotEmpty(this.filterBy.And.Category.Equals);
				const filterByAuthor = AppUtility.isNotEmpty(this.filterBy.And.Author.Equals);
				if (query !== "" || filterByCategory || filterByAuthor) {
					objects = objects.Where(o => {
						return (query !== "" ? AppUtility.indexOf(o.ANSITitle, query) > -1 : true)
							&& (filterByCategory ? o.Category.startsWith(this.filterBy.And.Category.Equals) : true)
							&& (filterByAuthor ? o.Author === this.filterBy.And.Author.Equals : true);
					});
				}
			}

			// sort
			switch (this.sort) {
				case "Chapters":
					objects = objects.OrderByDescending(o => o.TotalChapters).ThenBy(o => o.LastUpdated);
					break;
				case "Title":
					objects = objects.OrderBy(o => o.Title).ThenByDescending(o => o.LastUpdated);
					break;
				default:
					objects = objects.OrderByDescending(o => o.LastUpdated);
					break;
			}

			if (results === undefined) {
				if (this.filtering) {
					this.books = objects.ToArray();
				}
				else {
					objects = objects.Take(this.pageNumber * this.pagination.PageSize);
					objects.ForEach(o => this.ratings[o.ID] = o.RatingPoints.getValue("General"));
					this.books = objects.ToArray();
				}
			}
			else {
				objects.ForEach(o => this.ratings[o.ID] = o.RatingPoints.getValue("General"));
				this.books = this.books.concat(objects.ToArray());
			}
		}

		// callback
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	prepareActions() {
		this.actions = [
			this.appFormsSvc.getActionSheetButton("Mở tìm kiếm", "search", () => this.configSvc.navigateForward("/search-books")),
			this.appFormsSvc.getActionSheetButton("Lọc/Tìm nhanh", "funnel", () => {
				this.filtering = true;
				PlatformUtility.focus(this.searchCtrl);
			}),
			this.appFormsSvc.getActionSheetButton("Thay đổi cách sắp xếp", "list-box", async () => await this.showSortsAsync())
		];

		const pagination = AppPagination.get({ FilterBy: this.filterBy, SortBy: this.sortBy }, this.booksSvc.serviceName);
		if (this.pageNumber < pagination.PageNumber) {
			this.actions.push(this.appFormsSvc.getActionSheetButton(`Hiển thị toàn bộ ${AppPagination.computeTotal(pagination.PageNumber, pagination)} kết quả`, "eye", () => {
				this.pagination = AppPagination.get({ FilterBy: this.filterBy, SortBy: this.sortBy }, this.booksSvc.serviceName);
				this.pageNumber = this.pagination.PageNumber;
				this.prepareResults(() => this.prepareActions());
			}));
		}

		if (this.authSvc.isServiceModerator()) {
			this.actions.push(this.appFormsSvc.getActionSheetButton("Lấy dữ liệu", "build", async () => await this.showCrawlAsync()));
		}
	}

	async showActionsAsync() {
		await this.appFormsSvc.showActionSheetAsync(this.actions);
	}

	async showSortsAsync() {
		await this.appFormsSvc.showAlertAsync(
			"Sắp xếp theo",
			undefined,
			undefined,
			async data => {
				if (this.sort !== data) {
					this.sort = data;
					await this.contentCtrl.scrollToTop(500);
					this.prepareResults(async () => await this.appFormsSvc.showToastAsync("Đã thay đổi cách thức sắp xếp..."));
				}
			},
			"Đặt",
			"Huỷ bỏ",
			this.sorts.map(s => {
				return {
					type: "radio",
					label: s.label,
					value: s.value,
					checked: this.sort === s.value
				};
			})
		);
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

	cancel() {
		if (this.filtering) {
			this.filtering = false;
			this.filterBy.Query = undefined;
			this.prepareResults(() => this.scrollCtrl.disabled = false);
		}
		else {
			this.configSvc.navigateBack();
		}
	}

	trackBook(index: number, book: Book) {
		return book.ID;
	}

}
