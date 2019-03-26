import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { RegisterGuardService, AuthenticatedGuardService, NotAuthenticatedGuardService } from "../../providers/base.service";

@NgModule({
	imports: [RouterModule.forChild([
		{
			path: "login",
			canActivate: [NotAuthenticatedGuardService],
			loadChildren: "./login.module#LogInPageModule"
		},
		{
			path: "register",
			canActivate: [RegisterGuardService, NotAuthenticatedGuardService],
			loadChildren: "./register.module#RegisterAccountPageModule"
		},
		{
			path: "profile/:data",
			canActivate: [AuthenticatedGuardService],
			loadChildren: "./profile.module#ViewAccountProfilePageModule"
		},
		{
			path: "update/:data",
			canActivate: [AuthenticatedGuardService],
			loadChildren: "./update.module#UpdateAccountProfilePageModule"
		},
		{
			path: "otp",
			canActivate: [AuthenticatedGuardService],
			loadChildren: "./otp.module#UpdateAccount2FAPageModule"
		},
		{
			path: "list",
			canActivate: [AuthenticatedGuardService],
			loadChildren: "./list.module#ListAccountProfilesPageModule"
		},
		{
			path: "search",
			canActivate: [AuthenticatedGuardService],
			loadChildren: "./list.module#ListAccountProfilesPageModule"
		},
		{
			path: "**",
			redirectTo: "/home",
			pathMatch: "full"
		}
	])],
	exports: [RouterModule]
})

export class UsersRoutingModule {}
