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

	public async uploadBase64DataAsync(path: string, base64Data: string, onNext?: (data?: any) => void, onError?: (error?: any) => void, header?: { [key: string]: string }) {
		const headers: { [key: string]: string } = {
			"x-as-base64": "yes"
		};
		Object.keys(header || {}).forEach(key => headers[key] = header[key]);
		try {
			const data = await AppXHR.sendRequestAsync("POST", AppXHR.getURI(path, AppConfig.URIs.files), headers, { Data: base64Data });
			if (onNext !== undefined) {
				onNext(data);
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

	public uploadAvatarAsync(base64Data: string, onNext?: (data?: any) => void, onError?: (error?: any) => void) {
		return this.uploadBase64DataAsync("avatars", base64Data, onNext, onError);
	}

}
