import { Injectable } from "@angular/core";
import { HttpClient, HttpEventType } from "@angular/common/http";
import { AppConfig } from "../app.config";
import { AppXHR } from "../components/app.apis";
import { AppUtility } from "../components/app.utility";
import { Base as BaseService } from "./base.service";

@Injectable()
export class FilesService extends BaseService {

	constructor(http: HttpClient) {
		super("Files");
		AppXHR.initialize(http);
	}

	private getHeaders(additionalHeaders: { [key: string]: string }, asBase64: boolean) {
		const headers = AppConfig.getAuthenticatedHeaders();
		Object.keys(additionalHeaders || {}).forEach(name => headers[name] = additionalHeaders[name]);
		if (asBase64) {
			headers["x-as-base64"] = "yes";
		}
		return headers;
	}

	/** Uploads a file (as multipart/form-data or base64) to HTTP service of files with on-process supported */
	public upload(path: string, data: FormData | string, headers: { [key: string]: string }, onSuccess?: (data?: any) => void, onError?: (error?: any) => void, onProgress?: (percentage: string) => void) {
		const asBase64 = typeof data === "string";
		return onProgress !== undefined
			? AppXHR.http.post(
					AppXHR.getURI(path, AppConfig.URIs.files),
					asBase64 ? { Data: data } : data,
					{
						headers: this.getHeaders(headers, asBase64),
						reportProgress: true,
						observe: "events"
					}
				)
				.subscribe(
					events => {
						if (events.type === HttpEventType.UploadProgress) {
							onProgress(Math.round(events.loaded / events.total * 100) + "%");
						}
						else if (events.type === HttpEventType.Response) {
							if (onSuccess !== undefined) {
								onSuccess(events.body);
							}
						}
					},
					error => {
						this.showError("Error occurred while uploading file", error);
						if (onError !== undefined) {
							onError(AppUtility.parseError(error));
						}
					}
				)
			: AppXHR.http.post(
					AppXHR.getURI(path, AppConfig.URIs.files),
					asBase64 ? { Data: data } : data,
					{
						headers: this.getHeaders(headers, asBase64),
						observe: "body"
					}
				)
				.subscribe(
					response => {
						if (onSuccess !== undefined) {
							onSuccess(response);
						}
					},
					error => {
						this.showError("Error occurred while uploading file", error);
						if (onError !== undefined) {
							onError(AppUtility.parseError(error));
						}
					}
				);
	}

	/** Uploads a file (as form-data or base64) to HTTP service of files */
	public async uploadAsync(path: string, data: FormData | string, headers: { [key: string]: string }, onSuccess?: (data?: any) => void, onError?: (error?: any) => void) {
		try {
			const asBase64 = typeof data === "string";
			const response = await AppXHR.http.post(
				AppXHR.getURI(path, AppConfig.URIs.files),
				asBase64 ? { Data: data } : data,
				{
					headers: this.getHeaders(headers, asBase64),
					observe: "body"
				}
			).toPromise();
			if (onSuccess !== undefined) {
				onSuccess(response);
			}
		}
		catch (error) {
			this.showError("Error occurred while uploading file", error);
			if (onError !== undefined) {
				onError(AppUtility.parseError(error));
			}
		}
	}

	/** Reads the file content as data URL (base64-string) */
	public readAsDataURL(file: File, onSuccess: (data: string) => void, limitSize?: number, onLimitExceeded?: (fileSize?: number, limitSize?: number) => void) {
		if (limitSize !== undefined && file.size > limitSize) {
			if (onLimitExceeded !== undefined) {
				onLimitExceeded(file.size, limitSize);
			}
		}
		else {
			const fileReader = new FileReader();
			fileReader.onloadend = (event: any) => onSuccess(event.target.result);
			fileReader.readAsDataURL(file);
		}
	}

	/** Gets the multipart/form-data body from the collection of files to upload to HTTP service of files */
	public getMultipartBody(files: Array<File>) {
		const body = new FormData();
		(files || []).forEach(file => body.append("files[]", file, file !== undefined ? file.name : ""));
		return body;
	}

}
