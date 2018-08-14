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
		path: "list-items",
		loadChildren: "./pages/list/list.module#ListPageModule"
	},
	{
		path: "sign-in",
		loadChildren: "./pages/users/login.module#LogInPageModule"
	}
];

@NgModule({
	imports: [RouterModule.forRoot(appRoutes)],
	exports: [RouterModule]
})
export class AppRoutingModule {}
