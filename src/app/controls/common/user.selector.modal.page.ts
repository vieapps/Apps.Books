import { Subscription } from "rxjs";
import { List } from "linqts";
import { Component, OnInit, OnDestroy, Input, ViewChild } from "@angular/core";
import { IonSearchbar, IonInfiniteScroll } from "@ionic/angular";
import { AppUtility, HashSet } from "@components/app.utility";
import { PlatformUtility } from "@components/app.utility.platform";
import { AppPagination, AppDataPagination, AppDataRequest } from "@components/app.pagination";
import { AppFormsService } from "@components/forms.service";
import { ConfigurationService } from "@services/configuration.service";
import { AuthenticationService } from "@services/authentication.service";
import { UsersService } from "@services/users.service";
import { UserProfile } from "@models/user";

@Component({
	selector: "page-users-selector",
	templateUrl: "./user.selector.modal.page.html",
	styleUrls: ["./user.selector.modal.page.scss"]
})

export class UsersSelectorModalPage implements OnInit, OnDestroy {

	constructor(
		public configSvc: ConfigurationService,
		private appFormsSvc: AppFormsService,
		private authSvc: AuthenticationService,
		private usersSvc: UsersService
	) {
	}

	/** Set to 'true' to allow select multiple users */
	@Input() private multiple: boolean;

	/** Set to 'true' to hide all email addresses */
	@Input() hideEmails: boolean;

	@ViewChild(IonSearchbar, { static: true }) private searchCtrl: IonSearchbar;
	@ViewChild(IonInfiniteScroll, { static: true }) private infiniteScrollCtrl: IonInfiniteScroll;

	private subscription: Subscription;

	profiles = new Array<UserProfile>();
	results = new Array<UserProfile>();
	searching = false;
	pageNumber = 0;
	pagination: AppDataPagination;
	request: AppDataRequest;
	filterBy = {
		Query: undefined as string,
		And: new Array<{ [key: string]: any }>()
	};
	sortBy = { Name: "Ascending" };
	labels = {
		select: "Select",
		cancel: "Cancel",
		search: "Search"
	};
	selected = new HashSet<string>();

	ngOnInit() {
		this.multiple = this.multiple === undefined ? true : this.multiple;
		this.hideEmails = this.hideEmails === undefined ? !this.authSvc.isSystemAdministrator() : this.hideEmails;
		this.initializeAsync();
	}

	ngOnDestroy() {
		if (this.subscription !== undefined) {
			this.subscription.unsubscribe();
		}
	}

	async initializeAsync() {
		this.searchCtrl.placeholder = await this.configSvc.getResourceAsync("users.list.searchbar");
		this.labels = {
			select: await this.configSvc.getResourceAsync("common.buttons.select"),
			cancel: await this.configSvc.getResourceAsync("common.buttons.cancel"),
			search: await this.configSvc.getResourceAsync("common.buttons.search")
		};
		await this.appFormsSvc.showLoadingAsync();
		await this.startSearchAsync(async () => await this.appFormsSvc.hideLoadingAsync());
	}

	track(index: number, profile: UserProfile) {
		return `${profile.ID}@${index}`;
	}

	openSearch() {
		this.results = [];
		this.searching = true;
		PlatformUtility.focus(this.searchCtrl);
	}

	onStartSearch(event: any) {
		this.cancelSearch();
		if (AppUtility.isNotEmpty(event.detail.value)) {
			this.filterBy.Query = event.detail.value;
			this.results = [];
			this.selected.clear();
			this.startSearchAsync(() => this.infiniteScrollCtrl.disabled = false, AppPagination.getDefault());
		}
	}

	onClearSearch() {
		this.cancelSearch();
		this.filterBy.Query = undefined;
		this.results = [];
		this.selected.clear();
	}

	onCancelSearch() {
		this.onClearSearch();
		this.searching = false;
	}

	async onInfiniteScrollAsync() {
		if (this.pagination.PageNumber < this.pagination.TotalPages) {
			await this.searchAsync(async () => await (this.infiniteScrollCtrl !== undefined ? this.infiniteScrollCtrl.complete() : new Promise<void>(() => {})));
		}
		else if (this.infiniteScrollCtrl !== undefined) {
			await this.infiniteScrollCtrl.complete();
			this.infiniteScrollCtrl.disabled = true;
		}
	}

	private async startSearchAsync(onNext?: () => void, pagination?: AppDataPagination) {
		this.pagination = pagination || AppPagination.get({ FilterBy: this.filterBy, SortBy: this.sortBy }, `profile@${this.usersSvc.name}`.toLowerCase()) || AppPagination.getDefault();
		this.pagination.PageNumber = this.pageNumber = 0;
		await this.searchAsync(onNext);
	}

	private async searchAsync(onNext?: () => void) {
		this.request = AppPagination.buildRequest(this.filterBy, this.searching ? undefined : this.sortBy, this.pagination);
		const onNextAsync = async (data: any) => {
			this.pageNumber++;
			this.pagination = data !== undefined ? AppPagination.getDefault(data) : AppPagination.get(this.request, `profile@${this.usersSvc.name}`.toLowerCase());
			this.pagination.PageNumber = this.pageNumber;
			if (this.searching) {
				(data !== undefined ? data.Objects as Array<any> : []).forEach(o => this.results.push(UserProfile.get(o.ID)));
			}
			else {
				const objects = new List(data !== undefined ? (data.Objects as Array<any>).map(o => UserProfile.get(o.ID)) : UserProfile.instances.toArray().map(o => o as UserProfile)).OrderBy(o => o.Name).ThenByDescending(o => o.LastAccess);
				this.profiles = data === undefined
					? objects.Take(this.pageNumber * this.pagination.PageSize).ToArray()
					: this.profiles.concat(objects.ToArray());
			}
			if (onNext !== undefined) {
				onNext();
			}
		};
		if (this.searching) {
			this.subscription = this.usersSvc.search(this.request, onNextAsync);
		}
		else {
			await this.usersSvc.searchAsync(this.request, onNextAsync);
		}
	}

	private cancelSearch(dontDisableInfiniteScroll?: boolean) {
		if (this.subscription !== undefined) {
			this.subscription.unsubscribe();
			this.subscription = undefined;
		}
		if (AppUtility.isFalse(dontDisableInfiniteScroll)) {
			this.infiniteScrollCtrl.disabled = true;
		}
	}

	select(event: any, id: string) {
		if (event.detail.checked) {
			if (!this.multiple) {
				this.selected.clear();
			}
			this.selected.add(id);
		}
		else {
			this.selected.remove(id);
		}
	}

	closeAsync(ids?: Array<string>) {
		return ids === undefined || ids.length > 0
			? this.appFormsSvc.hideModalAsync(ids)
			: new Promise<void>(() => {});
	}

}
