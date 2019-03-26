import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { RegisterGuardService, AuthenticatedGuardService, NotAuthenticatedGuardService } from "../../providers/base.service";

@NgModule({
	imports: [RouterModule.forChild([
		{
			path: "login",
			loadChildren: "./login.module#LogInPageModule",
			canActivate: [NotAuthenticatedGuardService]
		},
		{
			path: "register",
			loadChildren: "./register.module#RegisterAccountPageModule",
			canActivate: [RegisterGuardService, NotAuthenticatedGuardService]
		},
		{
			path: "profile/:data",
			loadChildren: "./profile.module#ViewAccountProfilePageModule",
			canActivate: [AuthenticatedGuardService]
		},
		{
			path: "update/:data",
			loadChildren: "./update.module#UpdateAccountProfilePageModule",
			canActivate: [AuthenticatedGuardService]
		},
		{
			path: "otp",
			loadChildren: "./otp.module#UpdateAccount2FAPageModule",
			canActivate: [AuthenticatedGuardService]
		},
		{
			path: "list",
			loadChildren: "./list.module#ListAccountProfilesPageModule",
			canActivate: [AuthenticatedGuardService]
		},
		{
			path: "search",
			loadChildren: "./list.module#ListAccountProfilesPageModule",
			canActivate: [AuthenticatedGuardService]
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
