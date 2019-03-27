import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { RegisterGuardService, AuthenticatedGuardService, NotAuthenticatedGuardService } from "../../providers/base.service";

export const routes: Routes = [
	{
		path: "login",
		canActivate: [NotAuthenticatedGuardService],
		loadChildren: "./login.module#UsersLogInPageModule"
	},
	{
		path: "register",
		canActivate: [RegisterGuardService, NotAuthenticatedGuardService],
		loadChildren: "./register.module#UsersRegisterPageModule"
	},
	{
		path: "profile/:data",
		canActivate: [AuthenticatedGuardService],
		loadChildren: "./profile.module#UsersProfilePageModule"
	},
	{
		path: "update/:data",
		canActivate: [AuthenticatedGuardService],
		loadChildren: "./update.module#UsersUpdatePageModule"
	},
	{
		path: "otp",
		canActivate: [AuthenticatedGuardService],
		loadChildren: "./otp.module#UsersOtpPageModule"
	},
	{
		path: "list",
		canActivate: [AuthenticatedGuardService],
		loadChildren: "./list.module#UsersListPageModule"
	},
	{
		path: "search",
		canActivate: [AuthenticatedGuardService],
		loadChildren: "./list.module#UsersListPageModule"
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
