
import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { CrosswordViewComponent } from "./crossword/game-view/crossword-view.component";
import { DashboardComponent } from "./dashboard/dashboard.component";
import { GameComponent } from "./race/game-component/game.component";
import { EditTrackComponent } from "./race/edit-track/edit-track.component";
import { DifficultyMenuComponent } from "./crossword/difficulty-menu/difficulty-menu.component";
import { AdminSectionComponent } from "./admin-section/admin-section.component";
import { TrackViewComponent } from "./race/track-view/track-view.component";

const routes: Routes = [
    { path: "", component: DashboardComponent },
    { path: "crossword", component: DifficultyMenuComponent },
    { path: "crossword/play", component: CrosswordViewComponent },
    { path: "edit", component: EditTrackComponent },
    { path: "race/play", component: GameComponent },
    { path: "admin", component: AdminSectionComponent },
    { path: "race", component: TrackViewComponent}
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})

export class AppRoutingModule { }
