import { Subscription } from "rxjs";
import { List } from "linqts";
import { Set } from "typescript-collections";
import { Component, OnInit, OnDestroy, Input, ViewChild } from "@angular/core";
import { IonSearchbar, IonInfiniteScroll } from "@ionic/angular";
import { AppUtility } from "../../components/app.utility";
import { PlatformUtility } from "../../components/app.utility.platform";
import { AppPagination, AppDataPagination, AppDataRequest } from "../../components/app.pagination";
import { AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../services/configuration.service";
import { UsersService } from "../../services/users.service";
import { UserProfile } from "../../models/user";

@Component({
	selector: "page-users-selector",
	templateUrl: "./user.selector.modal.page.html",
	styleUrls: ["./user.selector.modal.page.scss"]
})

export class UsersSelectorModalPage implements OnInit, OnDestroy {

	constructor(
		public configSvc: ConfigurationService,
		private appFormsSvc: AppFormsService,
		private usersSvc: UsersService
	) {
	}

	/** Set to 'true' to allow select multiple users */
	@Input() multiple: boolean;

	/** Set to 'true' to hide all email addresses */
	@Input() hideEmails: boolean;

	profiles = new Array<UserProfile>();
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
	selected = new Set<string>();
	subscription: Subscription;

	@ViewChild(IonSearchbar, { static: true }) private searchCtrl: IonSearchbar;
	@ViewChild(IonInfiniteScroll, { static: true }) private infiniteScrollCtrl: IonInfiniteScroll;

	ngOnInit() {
		if (this.multiple === undefined) {
			this.multiple = true;
		}
		if (this.hideEmails === undefined) {
			this.hideEmails = true;
		}
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
		return this.searching ? `${index}.${profile.ID}` : `${profile.ID}@${index}`;
	}

	getEmail(profile: UserProfile) {
		return this.hideEmails ? AppUtility.getHiddenEmail(profile.Email) : profile.Email;
	}

	openSearch() {
		this.profiles = [];
		this.searching = true;
		PlatformUtility.focus(this.searchCtrl);
	}

	onStartSearch(event: any) {
		this.cancelSearch();
		if (AppUtility.isNotEmpty(event.detail.value)) {
			this.filterBy.Query = event.detail.value;
			this.profiles = [];
			this.startSearchAsync(() => this.infiniteScrollCtrl.disabled = false, AppPagination.getDefault());
		}
	}

	onClearSearch(event: any) {
		this.cancelSearch();
		this.filterBy.Query = undefined;
		this.profiles = [];
	}

	onCancelSearch(event: any) {
		this.searching = false;
		this.onClearSearch(event);
		this.startSearchAsync();
	}

	async onInfiniteScrollAsync() {
		if (this.pagination.PageNumber < this.pagination.TotalPages) {
			await this.searchAsync(async () => {
				if (this.infiniteScrollCtrl !== undefined) {
					await this.infiniteScrollCtrl.complete();
				}
			});
		}
		else if (this.infiniteScrollCtrl !== undefined) {
			await this.infiniteScrollCtrl.complete();
			this.infiniteScrollCtrl.disabled = true;
		}
	}

	async startSearchAsync(onNext?: () => void, pagination?: AppDataPagination) {
		this.pagination = pagination || AppPagination.get({ FilterBy: this.filterBy, SortBy: this.sortBy }, this.usersSvc.name) || AppPagination.getDefault();
		this.pagination.PageNumber = this.pageNumber = 0;
		await this.searchAsync(onNext);
	}

	async searchAsync(onNext?: () => void) {
		this.request = AppPagination.buildRequest(this.filterBy, this.searching ? undefined : this.sortBy, this.pagination);
		const onNextAsync = async (data: any) => {
			this.pageNumber++;
			this.pagination = data !== undefined ? AppPagination.getDefault(data) : AppPagination.get(this.request, this.usersSvc.name);
			this.pagination.PageNumber = this.pageNumber;
			this.prepareResults(onNext, data !== undefined ? data.Objects : undefined);
		};
		if (this.searching) {
			this.subscription = this.usersSvc.search(this.request, onNextAsync);
		}
		else {
			await this.usersSvc.searchAsync(this.request, onNextAsync);
		}
	}

	cancelSearch(dontDisableInfiniteScroll?: boolean) {
		if (this.subscription !== undefined) {
			this.subscription.unsubscribe();
			this.subscription = undefined;
		}
		if (AppUtility.isFalse(dontDisableInfiniteScroll)) {
			this.infiniteScrollCtrl.disabled = true;
		}
	}

	prepareResults(onNext?: () => void, results?: Array<any>) {
		if (this.searching) {
			(results || []).forEach(o => this.profiles.push(UserProfile.get(o.ID)));
		}
		else {
			const objects = new List(results === undefined ? UserProfile.all : results.map(o => UserProfile.get(o.ID))).OrderBy(o => o.Name).ThenByDescending(o => o.LastAccess);
			this.profiles = results === undefined
				? objects.Take(this.pageNumber * this.pagination.PageSize).ToArray()
				: this.profiles.concat(objects.ToArray());
		}
		if (onNext !== undefined) {
			onNext();
		}
	}

	select(id: string, event: any) {
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

	closeAsync(users?: Array<string>) {
		return users === undefined || users.length > 0
			? this.appFormsSvc.hideModalAsync(users)
			: new Promise<void>(() => {});
	}

}
