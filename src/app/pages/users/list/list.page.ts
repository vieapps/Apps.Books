import { Subscription } from "rxjs";
import { List } from "linqts";
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from "@angular/core";
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

export class UsersListPage implements OnInit, OnDestroy, AfterViewInit {

	constructor (
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
	filtering = false;
	pageNumber = 0;
	pagination: AppDataPagination;
	request: AppDataRequest;
	filterBy = {
		Query: undefined as string,
		And: new Array<{ [key: string]: any }>()
	};
	subscription: Subscription;
	@ViewChild(IonSearchbar, { static: false }) searchCtrl: IonSearchbar;
	@ViewChild(IonInfiniteScroll, { static: false }) scrollCtrl: IonInfiniteScroll;

	ngOnInit() {
		if (!this.authSvc.isServiceAdministrator()) {
			Promise.all([
				this.appFormsSvc.showToastAsync("Hmmm..."),
				this.configSvc.navigateHomeAsync()
			]);
		}
		else {
			this.initializeAsync();
		}
	}

	ngAfterViewInit() {
		this.initializeSearchbarAsync();
	}

	ngOnDestroy() {
		if (this.subscription !== undefined) {
			this.subscription.unsubscribe();
		}
	}

	get locale() {
		return this.configSvc.locale;
	}

	get totalRecords() {
		return AppPagination.computeTotal(this.pageNumber, this.pagination);
	}

	get sortBy() {
		return { Name: "Ascending" };
	}

	async initializeAsync() {
		this.searching = this.configSvc.currentUrl.startsWith("/users/search");
		this.configSvc.appTitle = this.title = this.searching
			? await this.configSvc.getResourceAsync("users.list.title.search")
			: await this.configSvc.getResourceAsync("users.list.title.list");
		if (!this.searching) {
			this.ratings = {};
			this.pagination = AppPagination.get({ FilterBy: this.filterBy, SortBy: this.sortBy }, this.usersSvc.name) || AppPagination.getDefault();
			this.pagination.PageNumber = this.pageNumber;
			await this.searchAsync();
		}
	}

	async initializeSearchbarAsync() {
		this.searchCtrl.placeholder = await this.configSvc.getResourceAsync("users.list.searchbar." + (this.searching ? "search" : "filter"));
		if (this.searching) {
			PlatformUtility.focus(this.searchCtrl);
		}
	}

	openSearchAsync() {
		return this.configSvc.navigateForwardAsync("/users/search");
	}

	track(index: number, profile: UserProfile) {
		return `${profile.ID}@${index}`;
	}

	getRouterLink(profile: UserProfile, index?: number) {
		return "/users/profile/" + AppUtility.toANSI(profile.Name, true) + (index !== undefined ? ":" + index : "");
	}

	getQueryParams(profile: UserProfile) {
		return {
			"x-request": AppUtility.toBase64Url({ ID: profile.ID })
		};
	}

	onStartSearch($event: any) {
		this.cancel();
		if (AppUtility.isNotEmpty($event.detail.value)) {
			this.filterBy.Query = $event.detail.value;
			if (this.searching) {
				this.profiles = [];
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

	onCancelSearch() {
		this.cancel();
		this.filterBy.Query = undefined;
		if (this.searching) {
			this.profiles = [];
			this.ratings = {};
		}
		else {
			this.prepareResults();
		}
	}

	onScroll() {
		if (this.pagination.PageNumber < this.pagination.TotalPages) {
			this.searchAsync(() => {
				if (this.scrollCtrl !== undefined) {
					this.scrollCtrl.complete();
				}
			});
		}
		else if (this.scrollCtrl !== undefined) {
			this.scrollCtrl.complete();
			this.scrollCtrl.disabled = true;
		}
	}

	async searchAsync(onNext?: () => void) {
		this.request = AppPagination.buildRequest(this.filterBy, this.searching ? undefined : this.sortBy, this.pagination);
		const onNextAsync = async (data: any) => {
			this.pageNumber++;
			this.pagination = data !== undefined ? AppPagination.getDefault(data) : AppPagination.get(this.request, this.usersSvc.name);
			this.pagination.PageNumber = this.pageNumber;
			this.prepareResults(onNext, data !== undefined ? data.Objects : undefined);
			await TrackingUtility.trackAsync(this.title + ` [${this.pageNumber}]`, this.configSvc.currentUrl);
		};
		if (this.searching) {
			this.subscription = this.usersSvc.search(this.request, onNextAsync);
		}
		else {
			await this.usersSvc.searchAsync(this.request, onNextAsync);
		}
	}

	cancel(dontDisableInfiniteScroll?: boolean) {
		if (this.subscription !== undefined) {
			this.subscription.unsubscribe();
			this.subscription = undefined;
		}
		if (AppUtility.isFalse(dontDisableInfiniteScroll)) {
			this.scrollCtrl.disabled = true;
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
			// initialize the LINQ list
			let objects = new List(results === undefined ? UserProfile.instances.values() as Array<UserProfile> : results.map(o => UserProfile.get(o.ID)));

			// filter
			if (this.filtering && AppUtility.isNotEmpty(this.filterBy.Query)) {
				const query = AppUtility.toANSI(this.filterBy.Query).trim().toLowerCase();
				objects = objects.Where(o => o.ansiTitle.indexOf(query) > -1);
			}

			// sort
			objects = objects.OrderBy(o => o.Name).ThenByDescending(o => o.LastAccess);

			// get array of profiles
			if (results === undefined) {
				if (this.filtering) {
					this.profiles = objects.ToArray();
				}
				else {
					objects = objects.Take(this.pageNumber * this.pagination.PageSize);
					objects.ForEach(o => this.ratings[o.ID] = o.RatingPoints.getValue("General"));
					this.profiles = objects.ToArray();
				}
			}
			else {
				objects.ForEach(o => this.ratings[o.ID] = o.RatingPoints.getValue("General"));
				this.profiles = this.profiles.concat(objects.ToArray());
			}
		}

		// done
		if (onNext !== undefined) {
			onNext();
		}
	}

}
