import * as Collections from "typescript-collections";
import { AppUtility } from "../components/app.utility";
import { Base as BaseModel } from "./base";
import { RatingPoint } from "./ratingpoint";

/** Base user profile */
export class UserProfileBase extends BaseModel {

	constructor() {
		super();
		this.Gender = "NotProvided";
		this.Status = "Activated";
	}

	/** All user profile instances */
	public static instances = new Collections.Dictionary<string, UserProfileBase>();

	// standard properties
	ID = "";
	Name = "";
	FirstName = "";
	LastName = "";
	BirthDay = "";
	Gender = "";
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
	Status = "";
	Joined = new Date();
	LastAccess = new Date();

	Title = "";
	FullAddress = "";
	IsOnline = false;

	public static deserialize(json: any, obj?: UserProfileBase) {
		obj = obj || new UserProfileBase();
		obj.copy(json);
		return obj;
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

}

/** Full user profile (with related information from main service) */
export class UserProfile extends UserProfileBase {

	constructor() {
		super();
		this.Level = "Normal";
		this.Reputation = "Unknown";
	}

	Level = "";
	Reputation = "";
	TotalPoints = 0;
	RestPoints = 0;
	TotalRewards = 0;
	TotalContributions = 0;
	LastSync = new Date();
	RatingPoints = new Collections.Dictionary<string, RatingPoint>();

	public static deserialize(json: any, obj?: UserProfile) {
		obj = obj || new UserProfile();
		obj.copy(json);
		return obj;
	}

	static update(data: any) {
		if (AppUtility.isObject(data, true)) {
			const profile = data instanceof UserProfile
				? data as UserProfile
				: UserProfile.deserialize(data, UserProfile.instances.getValue(data.ID) as UserProfile);
			UserProfile.instances.setValue(profile.ID, profile);
		}
	}

	public copy(source: any, onCompleted?: (data: any) => void) {
		super.copy(source, data => {
			this.RatingPoints = new Collections.Dictionary<string, RatingPoint>();
			if (AppUtility.isArray(data.RatingPoints)) {
				(data.RatingPoints as Array<any>).forEach(r => this.RatingPoints.setValue(r.Type, RatingPoint.deserialize(r)));
			}
			if (onCompleted !== undefined) {
				onCompleted(data);
			}
		});
	}

}
