import { Injectable } from "@angular/core";
import { Http } from "@angular/http";
import { AppConfig } from "../app.config";
import { AppAPI } from "../components/app.api";
import { AppUtility } from "../components/app.utility";
import { Base as BaseService } from "./base.service";

@Injectable()
export class FilesService extends BaseService {

	constructor (
		public http: Http
	) {
		super(http, "Files");
	}

	public async uploadBase64DataAsync(path: string, data: string, onNext?: (data?: any) => void, onError?: (error?: any) => void, header?: { [key: string]: string }) {
		const headers = {
			"x-as-base64": "yes"
		} as { [key: string]: string };
		if (header !== undefined) {
			Object.keys(header).forEach(key => headers[key] = header[key]);
		}
		try {
			const response = await AppAPI.send("POST", AppConfig.URIs.files + path, headers, { Data: data }).toPromise();
			if (onNext !== undefined) {
				onNext(response.json());
			}
		}
		catch (error) {
			if (onError !== undefined) {
				onError(AppUtility.parseError(error));
			}
			else {
				this.showError("Error occurred while uploading base64 data", error);
			}
		}
	}

	public async uploadAvatarAsync(base64Data: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		await this.uploadBase64DataAsync("avatars", base64Data, onNext, onError);
	}

}
