import { NgModule } from "@angular/core";
import { BrowserModule, HammerGestureConfig, HAMMER_GESTURE_CONFIG } from "@angular/platform-browser";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { RouteReuseStrategy } from "@angular/router";

import { IonicModule, IonicRouteStrategy } from "@ionic/angular";
import { IonicStorageModule } from "@ionic/storage";
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { MultiTranslateHttpLoader } from "ngx-translate-multi-http-loader";
import { NgxElectronModule } from "ngx-electron";

import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { StatusBar } from "@ionic-native/status-bar/ngx";
import { Device } from "@ionic-native/device/ngx";
import { Keyboard } from "@ionic-native/keyboard/ngx";
import { AppVersion } from "@ionic-native/app-version/ngx";
import { GoogleAnalytics } from "@ionic-native/google-analytics/ngx";
import { File } from "@ionic-native/file/ngx";
import { FileTransfer } from "@ionic-native/file-transfer/ngx";
import { InAppBrowser } from "@ionic-native/in-app-browser/ngx";
import { Clipboard } from "@ionic-native/clipboard/ngx";

import { AppConfig } from "@app/app.config";
import { AppComponent } from "@app/app.component";
import { AppRoutingModule } from "@app/app.routing.module";
import { AppFormsModule } from "@components/forms.module";
import { AppFormsService } from "@components/forms.service";
import { AppModulePreloader } from "@components/app.preloader";
import { TimePipeModule } from "@components/time.pipe";
import { AppReadyGuardService, RegisterGuardService, AuthenticatedGuardService, NotAuthenticatedGuardService } from "@services/base.service";
import { ConfigurationService } from "@services/configuration.service";
import { AuthenticationService } from "@services/authentication.service";
import { UsersService } from "@services/users.service";
import { FilesService } from "@services/files.service";
import { BooksService } from "@services/books.service";
import { FilesProcessorModalPageModule } from "@controls/common/file.processor.modal.module";

// ngx-translate factories
export function HttpLoaderFactory(http: HttpClient) {
	return new MultiTranslateHttpLoader(http, [
		{ prefix: "./assets/i18n/common/", suffix: ".json" },
		{ prefix: "./assets/i18n/users/", suffix: ".json" },
		{ prefix: "./assets/i18n/books/", suffix: ".json" }
	]);
}

// hammerjs config for working with touch gestures
export class HammerConfig extends HammerGestureConfig {
	options = {
		touchAction: "auto"
	};
}

@NgModule({
	providers: [
		StatusBar,
		SplashScreen,
		Device,
		Keyboard,
		AppVersion,
		File,
		FileTransfer,
		GoogleAnalytics,
		InAppBrowser,
		Clipboard,
		AppFormsService,
		AppModulePreloader,
		AppReadyGuardService,
		RegisterGuardService,
		AuthenticatedGuardService,
		NotAuthenticatedGuardService,
		ConfigurationService,
		AuthenticationService,
		UsersService,
		FilesService,
		BooksService,
		{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
		{ provide: HAMMER_GESTURE_CONFIG, useClass: HammerConfig }
	],
	imports: [
		BrowserModule,
		HttpClientModule,
		NgxElectronModule,
		IonicModule.forRoot(),
		IonicStorageModule.forRoot({ name: AppConfig.app.id + "-db" }),
		TranslateModule.forRoot({ loader: {
			provide: TranslateLoader,
			useFactory: HttpLoaderFactory,
			deps: [HttpClient]
		}}),
		FilesProcessorModalPageModule,
		TimePipeModule,
		AppFormsModule,
		AppRoutingModule
	],
	declarations: [AppComponent],
	bootstrap: [AppComponent]
})

export class AppModule {}
