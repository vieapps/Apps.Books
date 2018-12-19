import { Subscription } from "rxjs";
import { List } from "linqts";
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { registerLocaleData } from "@angular/common";
import { IonContent, IonSearchbar, IonInfiniteScroll } from "@ionic/angular";
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
	selector: "page-books-list",
	templateUrl: "./list.page.html",
	styleUrls: ["./list.page.scss"]
})

export class ListBooksPage implements OnInit, OnDestroy, AfterViewInit {
	constructor(
		public router: Router,
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public booksSvc: BooksService
	) {
		this.configSvc.locales.forEach(locale => registerLocaleData(this.configSvc.getLocaleData(locale)));
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
			label: "Last updated",
			value: "LastUpdated"
		},
		{
			label: "Title (A - Z)",
			value: "Title"
		},
		{
			label: "Chapters",
			value: "Chapters"
		}
	];
	sort = this.sorts[0].value;
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
	uri = "";

	asGrid = true;
	filtering = false;
	searching = false;
	actions: Array<{
		text: string,
		role: string,
		icon: string,
		handler: () => void
	}>;
	routerSubscription: Subscription;
	searchSubscription: Subscription;

	@ViewChild(IonContent) contentCtrl: IonContent;
	@ViewChild(IonSearchbar) searchCtrl: IonSearchbar;
	@ViewChild(IonInfiniteScroll) scrollCtrl: IonInfiniteScroll;

	ngOnInit() {
		this.initializeAsync();
		this.routerSubscription = this.router.events.subscribe(async event => {
			if (event instanceof NavigationEnd) {
				if (this.configSvc.currentUrl.startsWith(this.uri)) {
					this.configSvc.appTitle = this.title;
					await TrackingUtility.trackAsync(this.title, this.uri);
				}
			}
		});
		if (!this.searching) {
			AppEvents.on("Session", async info => {
				if ("Updated" === info.args.Type) {
					await this.prepareActionsAsync();
				}
			}, `AccountEventHandlers${this.eventIdentity}`);
			AppEvents.on("Books", async info => {
				const reprepareResults = "Deleted" === info.args.Type
					? this.filterBy.And.Category.Equals !== undefined
						? this.filterBy.And.Category.Equals === info.args.Category
						: this.filterBy.And.Author.Equals !== undefined
							? this.filterBy.And.Author.Equals === info.args.Author
							: false
					: "Moved" === info.args.Type
						? this.filterBy.And.Category.Equals !== undefined && (this.filterBy.And.Category.Equals === info.args.From || this.filterBy.And.Category.Equals === info.args.To)
						: false;
				if (reprepareResults) {
					this.prepareResults();
				}
			}, `BookEventHandlers${this.eventIdentity}`);
		}
	}

	ngOnDestroy() {
		this.routerSubscription.unsubscribe();
		this.cancel(true);
		if (!this.searching) {
			AppEvents.off("Session", `AccountEventHandlers${this.eventIdentity}`);
			AppEvents.off("Books", `BookEventHandlers${this.eventIdentity}`);
		}
	}

	ngAfterViewInit() {
		this.initializeSearchbarAsync();
	}

	get sortBy() {
		return { LastUpdated: "Descending" };
	}

	get showBackButton() {
		return this.searching || this.filtering || this.filterBy.And.Author.Equals !== undefined;
	}

	get hideCategory() {
		return this.searching ? true : this.filterBy.And.Category.Equals !== undefined;
	}

	get hideAuthor() {
		return this.searching ? false : this.filterBy.And.Author.Equals !== undefined;
	}

	get displayAsGrid() {
		return this.asGrid && !this.searching;
	}

	get totalRecords() {
		return AppPagination.computeTotal(this.pageNumber, this.pagination);
	}

	get eventIdentity() {
		return "@Books:" + (this.filterBy.And.Category.Equals !== undefined ? this.filterBy.And.Category.Equals : this.filterBy.And.Author.Equals !== undefined ? this.filterBy.And.Author.Equals : "Search");
	}

	get locale() {
		return this.configSvc.locale;
	}

	async initializeAsync() {
		this.requestParams = this.configSvc.requestParams;
		this.filterBy.And.Category.Equals = this.requestParams["Category"];
		this.filterBy.And.Author.Equals = this.requestParams["Author"];
		this.searching = this.configSvc.currentUrl.startsWith("/books/search");

		this.configSvc.appTitle = this.title = this.searching
			? await this.configSvc.getResourceAsync("books.list.title.search")
			: this.filterBy.And.Category.Equals !== undefined
				? await this.configSvc.getResourceAsync("books.list.title.category", { category: this.filterBy.And.Category.Equals })
				: await this.configSvc.getResourceAsync("books.list.title.author", { author: this.filterBy.And.Author.Equals });

		this.sorts.forEach(async sort => sort.label = await this.configSvc.getResourceAsync("books.list.sort.labels." + sort.value));

		this.uri = this.searching
				? "/books/search"
				: this.filterBy.And.Category.Equals !== undefined
					? "/books/list-by-category/" + AppUtility.toANSI(this.filterBy.And.Category.Equals, true) + "?x-request="
					: "/books/list-by-author/" + AppUtility.toANSI(this.filterBy.And.Author.Equals, true) + "?x-request=";

		if (!this.searching) {
			if (this.filterBy.And.Category.Equals === undefined && this.filterBy.And.Author.Equals === undefined) {
				await Promise.all([
					this.appFormsSvc.showToastAsync("Hmmm..."),
					this.configSvc.navigateHomeAsync()
				]);
			}
			else {
				this.ratings = {};
				this.pagination = AppPagination.get({ FilterBy: this.filterBy, SortBy: this.sortBy }, this.booksSvc.serviceName) || AppPagination.getDefault();
				this.pagination.PageNumber = this.pageNumber;
				await this.searchAsync(async () => await this.prepareActionsAsync());
			}
		}
	}

	async initializeSearchbarAsync() {
		this.searchCtrl.placeholder = await this.configSvc.getResourceAsync("books.list.searchbar." + (this.searching ? "search" : "filter"));
		if (this.searching) {
			PlatformUtility.focus(this.searchCtrl);
		}
	}

	onStartSearch($event: any) {
		this.cancel();
		if (AppUtility.isNotEmpty($event.detail.value)) {
			this.filterBy.Query = $event.detail.value;
			if (this.searching) {
				this.books = [];
				this.ratings = {};
				this.pageNumber = 0;
				this.pagination = AppPagination.getDefault();
				this.searchAsync(() => this.scrollCtrl.disabled = false);
			}
			else {
				this.prepareResults();
			}
		}
	}

	onCancelSearch(back?: boolean) {
		this.cancel();
		this.filterBy.Query = undefined;
		if (this.searching) {
			this.books = [];
			this.ratings = {};
		}
		else {
			if (back) {
				this.filtering = false;
				this.prepareResults(() => this.scrollCtrl.disabled = false);
			}
			else {
				this.prepareResults();
			}
		}
	}

	onScroll() {
		if (this.pagination.PageNumber < this.pagination.TotalPages) {
			this.searchAsync(() => this.scrollCtrl.complete());
		}
		else {
			this.scrollCtrl.complete();
			this.scrollCtrl.disabled = true;
		}
	}

	async searchAsync(onNext?: () => void) {
		this.request = AppPagination.buildRequest(this.filterBy, this.searching ? undefined : this.sortBy, this.pagination);
		const onNextAsync = async (data: any) => {
			this.pageNumber++;
			this.pagination = data !== undefined ? AppPagination.getDefault(data) : AppPagination.get(this.request, this.booksSvc.serviceName);
			this.pagination.PageNumber = this.pageNumber;
			this.prepareResults(onNext, data !== undefined ? data.Objects : undefined);
			await TrackingUtility.trackAsync(this.title + ` [${this.pageNumber}]`, this.uri);
		};
		if (this.searching) {
			this.searchSubscription = this.booksSvc.search(this.request, onNextAsync);
		}
		else {
			await this.booksSvc.searchAsync(this.request, onNextAsync);
		}
	}

	cancel(dontDisableInfiniteScroll?: boolean) {
		if (this.searchSubscription !== undefined) {
			this.searchSubscription.unsubscribe();
			this.searchSubscription = undefined;
		}
		if (AppUtility.isFalse(dontDisableInfiniteScroll)) {
			this.scrollCtrl.disabled = true;
		}
	}

	prepareResults(onNext?: () => void, results?: Array<any>) {
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
						return (query !== "" ? o.ansiTitle.indexOf(query) > -1 : true)
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
		if (onNext !== undefined) {
			onNext();
		}
	}

	async prepareActionsAsync() {
		this.actions = [
			this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("books.list.actions.search"), "search", async () => await this.configSvc.navigateForwardAsync("/books/search")),
			this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("books.list.actions.filter"), "funnel", () => this.showFilter()),
			this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("books.list.actions.sort"), "list-box", async () => await this.showSortsAsync())
		];

		const pagination = AppPagination.get({ FilterBy: this.filterBy, SortBy: this.sortBy }, this.booksSvc.serviceName);
		if (pagination !== undefined && this.pageNumber < pagination.PageNumber) {
			this.actions.push(this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("books.list.actions.show", { totalRecords: AppPagination.computeTotal(pagination.PageNumber, pagination) }), "eye", () => {
				this.pagination = AppPagination.get({ FilterBy: this.filterBy, SortBy: this.sortBy }, this.booksSvc.serviceName);
				this.pageNumber = this.pagination.PageNumber;
				this.prepareResults(async () => await this.prepareActionsAsync());
			}));
		}

		if (this.authSvc.isServiceModerator()) {
			this.actions.push(this.appFormsSvc.getActionSheetButton(await this.configSvc.getResourceAsync("books.list.actions.crawl"), "build", async () => await this.showCrawlAsync()));
		}
	}

	async showActionsAsync() {
		await this.appFormsSvc.showActionSheetAsync(this.actions);
	}

	showFilter() {
		this.filtering = true;
		this.searchCtrl.value = undefined;
		PlatformUtility.focus(this.searchCtrl);
	}

	async showSortsAsync() {
		await this.appFormsSvc.showAlertAsync(
			await this.configSvc.getResourceAsync("books.list.sort.header"),
			undefined,
			undefined,
			data => {
				if (this.sort !== data) {
					this.sort = data;
					this.prepareResults(async () => {
						await this.contentCtrl.scrollToTop(567);
						await this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("books.list.sort.message"));
					});
				}
			},
			await this.configSvc.getResourceAsync("books.list.sort.button"),
			await this.configSvc.getResourceAsync("common.buttons.cancel"),
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
			await this.configSvc.getResourceAsync("books.crawl.header"),
			undefined,
			await this.configSvc.getResourceAsync("books.crawl.label"),
			data => {
				if (AppUtility.isNotEmpty(data.SourceUrl)) {
					this.booksSvc.sendRequestToCrawl(data.SourceUrl, async () => await this.appFormsSvc.showToastAsync(await this.configSvc.getResourceAsync("books.crawl.message"), 2000));
				}
			},
			await this.configSvc.getResourceAsync("books.crawl.button"),
			await this.configSvc.getResourceAsync("common.buttons.cancel"),
			[
				{
					type: "text",
					name: "SourceUrl",
					placeholder: await this.configSvc.getResourceAsync("books.crawl.placeholder"),
					value: ""
				}
			]
		);
	}

	track(index: number, book: Book) {
		return `${book.ID}@${index}`;
	}

}
