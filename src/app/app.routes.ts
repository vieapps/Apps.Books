import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

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
			loadChildren: "./pages/users/login.module#LogInPageModule"
		},
		{
			path: "register-account",
			loadChildren: "./pages/users/register.module#RegisterAccountPageModule"
		},
		{
			path: "account-profile/:id",
			loadChildren: "./pages/users/profile.module#AccountProfilePageModule"
		},
		{
			path: "list-books/:related",
			loadChildren: "./pages/books/list.module#ListBooksPageModule"
		}
	])],
	exports: [RouterModule]
})
export class AppRoutingModule {}
