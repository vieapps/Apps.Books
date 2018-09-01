import * as Rx from "rxjs";
import { List } from "linqts";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { AppUtility } from "../../components/app.utility";
import { AppPagination } from "../../components/app.pagination";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../providers/configuration.service";
import { BooksService } from "../../providers/books.service";
import { Book } from "../../models/book";
import { RatingPoint } from "../../models/ratingpoint";

@Component({
	selector: "page-list-books",
	templateUrl: "./list.page.html",
	styleUrls: ["./list.page.scss"]
})
export class ListBooksPage implements OnInit, OnDestroy {
	constructor(
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
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
	pagination = AppPagination.getDefault();

	requestParams = {} as { [key: string]: any };
	request: {
		FilterBy: { [key: string]: any },
		SortBy: { [key: string]: any },
		Pagination: { [key: string]: any }
	};

	title = "";
	books = new Array<Book>();
	ratings = {} as { [key: string]: RatingPoint };

	filtering = false;
	searching = false;

	private _rxSubscriptions = new Array<Rx.Subscription>();

	ngOnInit() {
		if (!this.configSvc.isReady) {
			this.appFormsSvc.showToastAsync("Hmmmmm...");
			this.configSvc.navigateHome();
		}

		this.requestParams = this.configSvc.requestParams;
		this.filterBy.And.Category.Equals = this.requestParams["Category"];
		this.filterBy.And.Author.Equals = this.requestParams["Author"];
		this.pagination = AppPagination.get({ FilterBy: this.filterBy, SortBy: this.sortBy }, this.booksSvc.serviceName);

		this.title = this.filterBy.And.Category.Equals !== undefined
			? "Thể loại: " + this.filterBy.And.Category.Equals
			: "Tác giả: " + this.filterBy.And.Author.Equals;
		this.configSvc.appTitle = this.title;

		if (this.pagination === undefined) {
			this.search();
		}
		else {
			this.build();
		}
	}

	ngOnDestroy() {
		this._rxSubscriptions.forEach(subscription => subscription.unsubscribe());
	}

	trackBook(index: number, book: Book) {
		return book.ID;
	}

	private get sortBy() {
		return this.sort === "Title"
			? { Title: "Ascending" }
			: { LastUpdated: "Descending" };
	}

	private search() {
		this.request = AppPagination.buildRequest(this.filterBy, this.sortBy, this.pagination);
		this.booksSvc.searchAsync(this.request, data => {
			this.pagination = AppPagination.get(this.request, this.booksSvc.serviceName);
			this.build(data !== undefined ? data.Objects : undefined);
		});
	}

	private build(results?: Array<any>, onCompleted?: () => void) {
		const query = this.filtering && AppUtility.isNotEmpty(this.filterBy.Query)
			? AppUtility.toANSI(this.filterBy.Query).trim().toLowerCase()
			: "";
		const filterByCategory = AppUtility.isNotEmpty(this.filterBy.And.Category.Equals);
		const filterByAuthor = AppUtility.isNotEmpty(this.filterBy.And.Author.Equals);

		// filter
		let books = new List(results !== undefined ? results.map(b => Book.instances.getValue(b.ID)) : Book.instances.values());
		if (query !== "" || filterByCategory || filterByAuthor) {
			books = books.Where(book => {
				return (query !== "" ? AppUtility.indexOf(book.ANSITitle, query) > -1 : true)
					&& (filterByCategory ? book.Category.startsWith(this.filterBy.And.Category.Equals) : true)
					&& (filterByAuthor ? book.Author === this.filterBy.And.Author.Equals : true);
			});
		}

		// sort
		if (this.sort !== "LastUpdated") {
			switch (this.sort) {
				case "Chapters":
					books = books.OrderByDescending(book => book.TotalChapters).ThenBy(book => book.LastUpdated);
					break;
				case "Title":
					books = books.OrderBy(book => book.Title).ThenByDescending(book => book.LastUpdated);
					break;
			}
		}

		// pagination
		if (this.pagination.PageNumber > 1) {
			books = books.Take(this.pagination.PageNumber * this.pagination.PageSize);
		}

		// get the array of books
		this.books = books.ToArray();

		// ratings
		this.books.forEach(book => this.ratings[book.ID] = book.RatingPoints.getValue("General"));

		// callback
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

}
