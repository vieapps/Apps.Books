import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { IonicModule } from "@ionic/angular";
import { UpdateAccount2FAPage } from "./otp.page";

@NgModule({
	declarations: [UpdateAccount2FAPage],
	imports: [
		CommonModule,
		FormsModule,
		IonicModule,
		RouterModule.forChild([
			{
				path: "",
				component: UpdateAccount2FAPage
			}
		])
	]
})

export class UpdateAccount2FAPageModule {}
