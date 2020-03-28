import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { IonicModule } from "@ionic/angular";
import { RegisterGuardService, AuthenticatedGuardService, NotAuthenticatedGuardService } from "../../services/base.service";

import { UsersRegisterPageModule } from "./register/register.module";
import { UsersLogInPageModule } from "./login/login.module";
import { UsersProfilePageModule } from "./profile/profile.module";
import { UsersUpdatePageModule } from "./update/update.module";
import { UsersOtpPageModule } from "./otp/otp.module";
import { UsersListPageModule } from "./list/list.module";

const routes: Routes = [
	{
		path: "login",
		canActivate: [NotAuthenticatedGuardService],
		loadChildren: "../users/login/login.module#UsersLogInPageModule"
	},
	{
		path: "register",
		canActivate: [RegisterGuardService, NotAuthenticatedGuardService],
		loadChildren: "../users/register/register.module#UsersRegisterPageModule"
	},
	{
		path: "profile/:data",
		data: { preload: true },
		canActivate: [AuthenticatedGuardService],
		loadChildren: "../users/profile/profile.module#UsersProfilePageModule"
	},
	{
		path: "update/:data",
		canActivate: [AuthenticatedGuardService],
		loadChildren: "../users/update/update.module#UsersUpdatePageModule"
	},
	{
		path: "otp",
		canActivate: [AuthenticatedGuardService],
		loadChildren: "../users/otp/otp.module#UsersOtpPageModule"
	},
	{
		path: "list",
		canActivate: [AuthenticatedGuardService],
		loadChildren: "../users/list/list.module#UsersListPageModule"
	},
	{
		path: "search",
		canActivate: [AuthenticatedGuardService],
		loadChildren: "../users/list/list.module#UsersListPageModule"
	},
	{
		path: "**",
		redirectTo: "/home",
		pathMatch: "full"
	}
];

@NgModule({
	providers: [],
	imports: [
		CommonModule,
		IonicModule,
		UsersRegisterPageModule,
		UsersLogInPageModule,
		UsersProfilePageModule,
		UsersUpdatePageModule,
		UsersOtpPageModule,
		UsersListPageModule,
		RouterModule.forChild(routes)
	],
	exports: [RouterModule],
	declarations: []
})

export class UsersModule {}
