import * as Collections from "typescript-collections";
import { AppUtility } from "../components/app.utility";
import { Base as BaseModel } from "./base";
import { RatingPoint } from "./ratingpoint";

/** Base user profile */
export class UserProfileBase extends BaseModel {

	constructor() {
		super();
	}

	/** All user profile instances */
	public static instances = new Collections.Dictionary<string, UserProfileBase>();

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

	Title = "";
	FullAddress = "";
	IsOnline = false;

	public static deserialize(json: any, profile?: UserProfileBase) {
		profile = profile || new UserProfileBase();
		profile.copy(json);
		return profile;
	}

	public static get(id: string) {
		return UserProfile.instances.getValue(id);
	}

	public copy(source: any, onCompleted?: (data: any) => void) {
		super.copy(source, data => {
			if (AppUtility.isNotEmpty(this.BirthDay)) {
				this.BirthDay = this.BirthDay.replace(/--/g, "01").replace(/\//g, "-");
			}
			this.FullAddress = this.Address
				+ (AppUtility.isNotEmpty(this.Province) ? (AppUtility.isNotEmpty(this.Address) ? ", " : "")
				+ this.County + ", " + this.Province + ", " + this.Country : "");
			this.Title = AppUtility.toANSI(this.Name + " " + this.FullAddress + " " + this.Email + " " + this.Mobile).toLowerCase();
			if (onCompleted !== undefined) {
				onCompleted(data);
			}
		});
	}

	public get avatarUri() {
		return AppUtility.isNotEmpty(this.Avatar) ? this.Avatar : this.Gravatar;
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
	RatingPoints = new Collections.Dictionary<string, RatingPoint>();

	public static get(id: string) {
		return super.get(id) as UserProfile;
	}

	public static deserialize(json: any, profile?: UserProfile) {
		profile = profile || new UserProfile();
		profile.copy(json);
		return profile;
	}

	static update(data: any) {
		if (AppUtility.isObject(data, true)) {
			const profile = data instanceof UserProfile
				? data as UserProfile
				: UserProfile.deserialize(data, UserProfile.get(data.ID));
			UserProfile.instances.setValue(profile.ID, profile);
		}
	}

	public copy(source: any, onCompleted?: (data: any) => void) {
		super.copy(source, data => {
			this.RatingPoints = new Collections.Dictionary<string, RatingPoint>();
			if (AppUtility.isArray(data.RatingPoints, true)) {
				(data.RatingPoints as Array<any>).forEach(o => this.RatingPoints.setValue(o.Type, RatingPoint.deserialize(o)));
			}
			if (onCompleted !== undefined) {
				onCompleted(data);
			}
		});
	}

}
