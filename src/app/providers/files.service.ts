import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { AppAPI } from "../components/app.api";
import { AppUtility } from "../components/app.utility";
import { Base as BaseService } from "./base.service";
import { ConfigurationService } from "./configuration.service";

@Injectable()
export class FilesService extends BaseService {

	constructor (
		public http: Http,
		public configSvc: ConfigurationService
	) {
		super(http, "Files");
	}

	public async uploadAvatarAsync(base64Data: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		try {
			const response = await AppAPI.send(
				"POST",
				`${this.configSvc.appConfig.URIs.files}avatars`,
				{
					"x-as-base64": "yes"
				},
				{
					Data: base64Data
				}
			).toPromise();
			if (onNext !== undefined) {
				onNext(response.json());
			}
		}
		catch (error) {
			if (onError !== undefined) {
				onError(AppUtility.parseError(error));
			}
			else {
				this.showError("Error occurred while uploading avatar image", error);
			}
		}
	}

}
