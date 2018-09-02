import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { AppReadyGuardService, RegisterGuardService, AuthenticatedGuardService, NotAuthenticatedGuardService } from "./providers/base.service";

@NgModule({
	imports: [RouterModule.forRoot([
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
			loadChildren: "./pages/users/login.module#LogInPageModule",
			canActivate: [AppReadyGuardService, NotAuthenticatedGuardService]
		},
		{
			path: "register-account",
			loadChildren: "./pages/users/register.module#RegisterAccountPageModule",
			canActivate: [AppReadyGuardService, RegisterGuardService, NotAuthenticatedGuardService]
		},
		{
			path: "account-profile/:id",
			loadChildren: "./pages/users/profile.module#AccountProfilePageModule",
			canActivate: [AppReadyGuardService, AuthenticatedGuardService]
		},
		{
			path: "search-books",
			loadChildren: "./pages/books/list.module#ListBooksPageModule",
			canActivate: [AppReadyGuardService]
		},
		{
			path: "list-books/:related",
			loadChildren: "./pages/books/list.module#ListBooksPageModule",
			canActivate: [AppReadyGuardService],
		}
	])],
	exports: [RouterModule]
})
export class AppRoutingModule {}
