import { PreloadingStrategy, Route } from "@angular/router";
import { Observable, of } from "rxjs";

/** Preloader for all modules */
export class AppModulePreloader implements PreloadingStrategy {
	preload (route: Route, load: Function): Observable<any> {
		return route.data && route.data.preload ? load() : of(null);
	}
}
