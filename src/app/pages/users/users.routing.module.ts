import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { RegisterGuardService, AuthenticatedGuardService, NotAuthenticatedGuardService } from "../../providers/base.service";

export const routes: Routes = [
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
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})

export class UsersRoutingModule {}
