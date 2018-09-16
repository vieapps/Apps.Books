import { List } from "linqts";
import { Component, OnInit, AfterViewInit, ViewChild } from "@angular/core";
import { registerLocaleData } from "@angular/common";
import { Content, Searchbar, InfiniteScroll } from "@ionic/angular";
import { AppUtility } from "../../components/app.utility";
import { TrackingUtility } from "../../components/app.utility.trackings";
import { PlatformUtility } from "../../components/app.utility.platform";
import { AppPagination } from "../../components/app.pagination";
import { AppFormsService } from "../../components/forms.service";
import { ConfigurationService } from "../../providers/configuration.service";
import { AuthenticationService } from "../../providers/authentication.service";
import { UsersService } from "../../providers/users.service";
import { UserProfile } from "../../models/user";
import { RatingPoint } from "../../models/ratingpoint";

@Component({
	selector: "page-user-profiles",
	templateUrl: "./list.page.html",
	styleUrls: ["./list.page.scss"]
})
export class ListAccountProfilesPage implements OnInit, AfterViewInit {

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
	pagination: { TotalRecords: number, TotalPages: number, PageSize: number, PageNumber: number };
	filterBy = {
		Query: undefined as string
	};
	request: {
		FilterBy: { [key: string]: any },
		SortBy: { [key: string]: any },
		Pagination: { TotalRecords: number, TotalPages: number, PageSize: number, PageNumber: number }
	};

	@ViewChild(Content) contentCtrl: Content;
	@ViewChild(Searchbar) searchCtrl: Searchbar;
	@ViewChild(InfiniteScroll) scrollCtrl: InfiniteScroll;

	ngOnInit() {
		if (!this.authSvc.isServiceAdministrator()) {
			this.appFormsSvc.showToastAsync("Hmmm...");
			this.configSvc.navigateHome();
		}
		else {
			this.initializeAsync();
		}
	}

	ngAfterViewInit() {
		this.initializeSearchbarAsync();
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
			this.pagination = AppPagination.get({ FilterBy: this.filterBy, SortBy: this.sortBy }, this.usersSvc.serviceName) || AppPagination.getDefault();
			this.pagination.PageNumber = this.pageNumber;
			this.searchAsync();
		}
	}

	async initializeSearchbarAsync() {
		this.searchCtrl.placeholder = await this.configSvc.getResourceAsync("users.list.searchbar." + (this.searching ? "search" : "filter"));
		if (this.searching) {
			PlatformUtility.focus(this.searchCtrl);
		}
	}

	openSearch() {
		this.configSvc.navigateForward("/users/search");
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

	onStartSearch($event) {
		this.scrollCtrl.disabled = true;
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

	onCancelSearch($event) {
		this.scrollCtrl.disabled = true;
		this.filterBy.Query = undefined;
		if (this.searching) {
			this.profiles = [];
			this.ratings = {};
		}
		else {
			this.prepareResults();
		}
	}

	onScroll($event) {
		if (this.pagination.PageNumber < this.pagination.TotalPages) {
			this.searchAsync(() => this.scrollCtrl.complete());
		}
		else {
			this.scrollCtrl.complete();
			this.scrollCtrl.disabled = true;
		}
	}

	async searchAsync(onCompleted?: () => void) {
		this.request = AppPagination.buildRequest(this.filterBy, this.searching ? undefined : this.sortBy, this.pagination);
		await this.usersSvc.searchAsync(
			this.request,
			async data => {
				this.pageNumber++;
				this.pagination = data !== undefined ? AppPagination.getDefault(data) : AppPagination.get(this.request, this.usersSvc.serviceName);
				this.pagination.PageNumber = this.pageNumber;
				this.prepareResults(onCompleted, data !== undefined ? data.Objects : undefined);
				await TrackingUtility.trackAsync(this.title, this.configSvc.currentUrl);
			}
		);
	}

	prepareResults(onCompleted?: () => void, results?: Array<any>) {
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

		// callback
		if (onCompleted !== undefined) {
			onCompleted();
		}
	}

	close() {
		if (this.searching) {
			this.configSvc.navigateBack();
		}
		else {
			this.configSvc.navigateHome();
		}
	}

}
