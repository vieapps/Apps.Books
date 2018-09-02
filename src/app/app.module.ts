import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpModule } from "@angular/http";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { RouteReuseStrategy } from "@angular/router";

import { IonicModule, IonicRouteStrategy } from "@ionic/angular";

import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { StatusBar } from "@ionic-native/status-bar/ngx";
import { Device } from "@ionic-native/device/ngx";
import { Keyboard } from "@ionic-native/keyboard/ngx";
import { AppVersion } from "@ionic-native/app-version/ngx";
import { GoogleAnalytics } from "@ionic-native/google-analytics/ngx";

import { IonicStorageModule } from "@ionic/storage";
import { Ng2CompleterModule } from "ng2-completer";
import { ImageCropperModule } from "ng2-img-cropper";

import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app.routes";
import { AppFormsModule } from "./components/forms.module";
import { VinumberPipe } from "./components/app.vinumber.pipe";
import { AppReadyGuardService, RegisterGuardService, AuthenticatedGuardService, NotAuthenticatedGuardService } from "./providers/base.service";
import { ConfigurationService } from "./providers/configuration.service";
import { AuthenticationService } from "./providers/authentication.service";
import { UsersService } from "./providers/users.service";
import { FilesService } from "./providers/files.service";
import { BooksService } from "./providers/books.service";

@NgModule({
	declarations: [
		AppComponent,
		VinumberPipe
	],
	imports: [
		BrowserModule,
		HttpModule,
		ReactiveFormsModule,
		FormsModule,
		IonicModule.forRoot(),
		IonicStorageModule.forRoot({ name: "vieappsDB" }),
		Ng2CompleterModule,
		ImageCropperModule,
		AppFormsModule,
		AppRoutingModule
	],
	providers: [
		StatusBar,
		SplashScreen,
		Device,
		Keyboard,
		AppVersion,
		GoogleAnalytics,
		AppReadyGuardService,
		RegisterGuardService,
		AuthenticatedGuardService,
		NotAuthenticatedGuardService,
		ConfigurationService,
		AuthenticationService,
		UsersService,
		FilesService,
		BooksService,
		{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
	],
	bootstrap: [AppComponent]
})
export class AppModule {}
