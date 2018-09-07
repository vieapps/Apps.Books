import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { environment } from "./environments/environment";
import { AppModule } from "./app/app.module";

// import "hammerjs";

if (environment.production) {
	enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule).catch(error => console.log(error));
