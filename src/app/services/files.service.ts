import { Injectable } from "@angular/core";
import { AppConfig } from "../app.config";
import { AppXHR } from "../components/app.apis";
import { AppUtility } from "../components/app.utility";
import { Base as BaseService } from "./base.service";

@Injectable()
export class FilesService extends BaseService {

	constructor() {
		super("Files");
	}

	public async uploadBase64DataAsync(path: string, data: string, onNext?: (data?: any) => void, onError?: (error?: any) => void, header?: { [key: string]: string }) {
		const headers = {
			"x-as-base64": "yes"
		} as { [key: string]: string };
		Object.keys(header || {}).forEach(key => headers[key] = header[key]);
		try {
			const response = await AppXHR.sendRequestAsync("POST", AppXHR.getURI(path, AppConfig.URIs.files), headers, { Data: data });
			if (onNext !== undefined) {
				onNext(response);
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
