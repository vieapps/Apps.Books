import { Dictionary } from "typescript-collections";
import { Privilege } from "./privileges";
import { UserProfile } from "./user";
import { AppUtility } from "../components/app.utility";

/** Account of the app */
export class Account {

	constructor (
	) {
	}

	/** All user account instances */
	public static instances = new Dictionary<string, Account>();

	id: string;
	roles: Array<string>;
	privileges: Array<Privilege>;
	status: string;
	twoFactors: {
		required: boolean,
		providers: Array<{ Label: string, Type: string, Time: Date, Info: string }>
	};
	profile: UserProfile;
	facebook: {
		id: string,
		name: string,
		pictureUrl: string,
		profileUrl: string
	};

	public static deserialize(json: any = {}, onCompleted?: (account: Account, data: any) => void) {
		const account = new Account();
		AppUtility.copy(json, account, data => {
			account.privileges = AppUtility.isArray(json.privileges, true)
				? (json.privileges as Array<any>).map(o => Privilege.deserialize(o))
				: [];
			account.profile = data.profile !== undefined
				? UserProfile.deserialize(data.profile)
				: undefined;
			if (onCompleted !== undefined) {
				onCompleted(account, data);
			}
		});
		return account;
	}
}
