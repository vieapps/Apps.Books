import { Dictionary } from "typescript-collections";
import { AppConfig } from "../app.config";
import { AppUtility } from "../components/app.utility";
import { Base as BaseModel } from "./base";
import { RatingPoint } from "./ratingpoint";

/** Base user profile */
export class UserProfileBase extends BaseModel {

	constructor() {
		super();
		delete this["Privileges"];
		delete this["OriginalPrivileges"];
	}

	/** All user profile instances */
	public static instances = new Dictionary<string, UserProfileBase>();

	// standard properties
	ID = "";
	Name = "";
	FirstName = "";
	LastName = "";
	BirthDay = "";
	Gender = "NotProvided";
	Address = "";
	County = "";
	Province = "";
	Country = "";
	PostalCode = "";
	Email = "";
	Mobile = "";
	Language = "vi-VN";
	Avatar = "";
	Gravatar = "";
	Alias = "";
	Bio = "";
	Notes = "";
	LastUpdated = new Date();

	// additional properties
	Status = "Activated";
	Joined = new Date();
	LastAccess = new Date();
	IsOnline = false;

	ansiTitle = "";
	fullAddress = "";

	/** Deserializes data to object */
	public static deserialize(json: any, profile?: UserProfileBase) {
		profile = profile || new UserProfileBase();
		profile.copy(json);
		return profile;
	}

	/** Gets by identity */
	public static get(id: string) {
		return id !== undefined
			? this.instances.getValue(id)
			: undefined;
	}

	/** Sets by identity */
	public static set(profile: UserProfileBase) {
		return profile === undefined
			? undefined
			: this.instances.setValue(profile.ID, profile) || profile;
	}

	/** Checks to see the dictionary is contains the object by identity or not */
	public static contains(id: string) {
		return id !== undefined && this.instances.containsKey(id);
	}

	public get avatarURI() {
		return AppUtility.isNotEmpty(this.Avatar) ? this.Avatar : this.Gravatar;
	}

	public get routerLink() {
		return `${AppConfig.url.users.profile}/${AppUtility.toANSI(this.Name, true)}`;
	}

	public copy(source: any, onCompleted?: (data: any) => void) {
		super.copy(source, data => {
			if (AppUtility.isNotEmpty(this.BirthDay)) {
				this.BirthDay = this.BirthDay.replace(/--/g, "01").replace(/\//g, "-");
			}
			this.fullAddress = this.Address
				+ (AppUtility.isNotEmpty(this.Province) ? (AppUtility.isNotEmpty(this.Address) ? ", " : "")
				+ this.County + ", " + this.Province + ", " + this.Country : "");
			this.ansiTitle = AppUtility.toANSI(this.Name + " " + this.fullAddress + " " + this.Email + " " + this.Mobile).toLowerCase();
			if (onCompleted !== undefined) {
				onCompleted(data);
			}
		});
	}

	public getEmail(hideEmail: boolean = true) {
		return hideEmail ? AppUtility.getHiddenEmail(this.Email) : this.Email;
	}

}

/** Full user profile (with related information from main service) */
export class UserProfile extends UserProfileBase {

	constructor() {
		super();
	}

	Level = "Normal";
	Reputation = "Unknown";
	TotalPoints = 0;
	RestPoints = 0;
	TotalRewards = 0;
	TotalContributions = 0;
	LastSync = new Date();
	RatingPoints = new Dictionary<string, RatingPoint>();

	/** Gets all user profile instances */
	public static get all() {
		return this.instances.values() as Array<UserProfile>;
	}

	/** Deserializes data to object */
	public static deserialize(json: any, profile?: UserProfile) {
		profile = profile || new UserProfile();
		profile.copy(json);
		return profile;
	}

	/** Gets by identity */
	public static get(id: string) {
		return super.get(id) as UserProfile;
	}

	/** Sets by identity */
	public static set(profile: UserProfile) {
		return super.set(profile) as UserProfile;
	}

	/** Updates into dictionary */
	public static update(data: any) {
		return AppUtility.isObject(data, true)
			? this.set(data instanceof UserProfile ? data as UserProfile : this.deserialize(data, this.get(data.ID)))
			: undefined;
	}

	public copy(source: any, onCompleted?: (data: any) => void) {
		super.copy(source, data => {
			this.RatingPoints = new Dictionary<string, RatingPoint>();
			if (AppUtility.isArray(data.RatingPoints, true)) {
				(data.RatingPoints as Array<any>).forEach(o => this.RatingPoints.setValue(o.Type, RatingPoint.deserialize(o)));
			}
			if (onCompleted !== undefined) {
				onCompleted(data);
			}
		});
	}

}
