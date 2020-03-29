import { Observable, of } from "rxjs";
import { PreloadingStrategy, Route } from "@angular/router";

/** Preloader for all modules */
export class AppModulePreloader implements PreloadingStrategy {
	preload (route: Route, load: Function): Observable<any> {
		return route.data && route.data.preload ? load() : of(null);
	}
}
