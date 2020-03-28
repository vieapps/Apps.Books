import { Subscription } from "rxjs";
import { List } from "linqts";
import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import { IonSearchbar, IonInfiniteScroll } from "@ionic/angular";
import { AppUtility } from "../../../components/app.utility";
import { TrackingUtility } from "../../../components/app.utility.trackings";
import { PlatformUtility } from "../../../components/app.utility.platform";
import { AppPagination, AppDataPagination, AppDataRequest } from "../../../components/app.pagination";
import { AppFormsService } from "../../../components/forms.service";
import { ConfigurationService } from "../../../services/configuration.service";
import { AuthenticationService } from "../../../services/authentication.service";
import { UsersService } from "../../../services/users.service";
import { UserProfile } from "../../../models/user";
import { RatingPoint } from "../../../models/ratingpoint";

@Component({
	selector: "page-users-list",
	templateUrl: "./list.page.html",
	styleUrls: ["./list.page.scss"]
})

export class UsersListPage implements OnInit, OnDestroy {

	constructor(
		public appFormsSvc: AppFormsService,
		public configSvc: ConfigurationService,
		public authSvc: AuthenticationService,
		public usersSvc: UsersService
	) {
		this.configSvc.locales.forEach(locale => registerLocaleData(this.configSvc.getLocaleData(locale)));
	}

	title = "Account Profiles";
	profiles = new Array<UserProfile>();
	ratings: { [key: string]: RatingPoint };
	searching = false;
	pageNumber = 0;
	pagination: AppDataPagination;
	request: AppDataRequest;
	filterBy = {
		Query: undefined as string,
		And: new Array<{ [key: string]: any }>()
	};
	sortBy = { Name: "Ascending" };
	subscription: Subscription;

	@ViewChild(IonSearchbar, { static: true }) private searchCtrl: IonSearchbar;
	@ViewChild(IonInfiniteScroll, { static: true }) private infiniteScrollCtrl: IonInfiniteScroll;

	get locale() {
		return this.configSvc.locale;
	}

	get totalRecords() {
		return AppPagination.computeTotal(this.pageNumber, this.pagination);
	}

	ngOnInit() {
		if (this.authSvc.isServiceAdministrator()) {
			this.initializeAsync();
		}
		else {
			Promise.all([
				this.appFormsSvc.showToastAsync("Hmmm..."),
				this.configSvc.navigateHomeAsync()
			]);
		}
	}

	ngOnDestroy() {
		if (this.subscription !== undefined) {
			this.subscription.unsubscribe();
		}
	}

	async initializeAsync() {
		this.searching = this.configSvc.currentUrl.startsWith(this.configSvc.appConfig.url.users.search);
		this.configSvc.appTitle = this.title = this.searching
			? await this.configSvc.getResourceAsync("users.list.title.search")
			: await this.configSvc.getResourceAsync("users.list.title.list");
		if (this.searching) {
			PlatformUtility.focus(this.searchCtrl);
			this.searchCtrl.placeholder = await this.configSvc.getResourceAsync("users.list.searchbar");
		}
		else {
			this.ratings = {};
			this.pagination = AppPagination.get({ FilterBy: this.filterBy, SortBy: this.sortBy }, this.usersSvc.name) || AppPagination.getDefault();
			this.pagination.PageNumber = this.pageNumber;
			await this.appFormsSvc.showLoadingAsync();
			await this.searchAsync(async () => await this.appFormsSvc.hideLoadingAsync());
		}
	}

	track(index: number, profile: UserProfile) {
		return `${profile.ID}@${index}`;
	}

	openSearchAsync() {
		return this.configSvc.navigateForwardAsync(this.configSvc.appConfig.url.users.search);
	}

	onStartSearch(event: any) {
		this.cancelSearch();
		if (AppUtility.isNotEmpty(event.detail.value)) {
			this.filterBy.Query = event.detail.value;
			if (this.searching) {
				this.profiles = [];
				this.ratings = {};
				this.pageNumber = 0;
				this.pagination = AppPagination.getDefault();
				this.searchAsync(() => this.infiniteScrollCtrl.disabled = false);
			}
			else {
				this.prepareResults();
			}
		}
	}

	onClearSearch(event: any) {
		this.cancelSearch();
		this.filterBy.Query = undefined;
		this.profiles = [];
		this.ratings = {};
	}

	onCancelSearch(event: any) {
		this.onClearSearch(event);
		this.prepareResults();
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

	async searchAsync(onNext?: () => void) {
		this.request = AppPagination.buildRequest(this.filterBy, this.searching ? undefined : this.sortBy, this.pagination);
		const onNextAsync = async (data: any) => {
			this.pageNumber++;
			this.pagination = data !== undefined ? AppPagination.getDefault(data) : AppPagination.get(this.request, this.usersSvc.name);
			this.pagination.PageNumber = this.pageNumber;
			this.prepareResults(onNext, data !== undefined ? data.Objects : undefined);
			await TrackingUtility.trackAsync(`${this.title} [${this.pageNumber}]`, this.configSvc.currentUrl);
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
			(results || []).forEach(o => {
				const profile = UserProfile.get(o.ID);
				this.profiles.push(profile);
				this.ratings[profile.ID] = profile.RatingPoints.getValue("General");
			});
		}
		else {
			let objects = new List(results === undefined ? UserProfile.all : results.map(o => UserProfile.get(o.ID))).OrderBy(o => o.Name).ThenByDescending(o => o.LastAccess);
			if (results === undefined) {
				objects = objects.Take(this.pageNumber * this.pagination.PageSize);
				objects.ForEach(o => this.ratings[o.ID] = o.RatingPoints.getValue("General"));
				this.profiles = objects.ToArray();
			}
			else {
				objects.ForEach(o => this.ratings[o.ID] = o.RatingPoints.getValue("General"));
				this.profiles = this.profiles.concat(objects.ToArray());
			}
		}
		if (onNext !== undefined) {
			onNext();
		}
	}

}
