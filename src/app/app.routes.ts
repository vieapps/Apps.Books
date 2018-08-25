import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

const appRoutes: Routes = [
	{
		path: "",
		redirectTo: "home",
		pathMatch: "full"
	},
	{
		path: "home",
		loadChildren: "./pages/home/home.module#HomePageModule"
	},
	{
		path: "log-in",
		loadChildren: "./pages/users/login.module#LogInPageModule"
	},
	{
		path: "register-account",
		loadChildren: "./pages/users/register.module#RegisterAccountPageModule"
	},
	{
		path: "account-profile",
		loadChildren: "./pages/users/profile.module#AccountProfilePageModule"
	},
];

@NgModule({
	imports: [RouterModule.forRoot(appRoutes)],
	exports: [RouterModule]
})
export class AppRoutingModule {}
