import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpModule } from "@angular/http";
import { RouteReuseStrategy } from "@angular/router";

import { IonicModule, IonicRouteStrategy } from "@ionic/angular";
import { IonicStorageModule } from "@ionic/storage";
import { SplashScreen } from "@ionic-native/splash-screen/ngx";
import { StatusBar } from "@ionic-native/status-bar/ngx";
import { Device } from "@ionic-native/device/ngx";

import { Ng2CompleterModule } from "ng2-completer";
import { AppFormsModule } from "./components/forms.module";
import { VinumberPipe } from "./components/app.pipes";

import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app.routes";

import { ConfigurationService } from "./providers/configuration.service";
import { AuthenticationService } from "./providers/authentication.service";
import { UserService } from "./providers/user.service";

@NgModule({
	declarations: [
		AppComponent,
		VinumberPipe
	],
	imports: [
		BrowserModule,
		HttpModule,
		IonicModule.forRoot(),
		IonicStorageModule.forRoot({ name: "vieappsDB" }),
		Ng2CompleterModule,
		AppFormsModule,
		AppRoutingModule
	],
	providers: [
		StatusBar,
		SplashScreen,
		Device,
		ConfigurationService,
		AuthenticationService,
		UserService,
		{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
	],
	entryComponents: [],
	schemas: [],
	bootstrap: [AppComponent]
})
export class AppModule {}
