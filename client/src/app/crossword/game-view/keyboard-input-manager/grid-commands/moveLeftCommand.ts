import { AbsGridCommand } from "./AbsGridCommand";
import { ICell } from "../../../interfaces/ICell";
import { FocusCell } from "../../focusCell";
import { GRID_WIDTH } from "../../../../constants";
import { Orientation } from "../../../../../../../common/interfaces/IWord";

export class MoveLeftCommand extends AbsGridCommand {
    public constructor(cells: Array<ICell>) {
        super(cells);
    }

    public execute(): void {
        if (FocusCell.Instance.Cell) {
            const currentGridIndex: number = FocusCell.Instance.Cell.gridIndex;
            do {
                if (this.isStillInSelection()) {
                    this.move();
                }
            } while (FocusCell.Instance.Cell.isFound && this.canMove());
            if (FocusCell.Instance.Cell.isFound) {
                FocusCell.Instance.Cell = this.cells[currentGridIndex];
            }
        }
    }
    private canMove(): boolean {
        return FocusCell.Instance.Cell.gridIndex > FocusCell.Instance.Cells[0].gridIndex;
    }

    private move(): void {
        if (this.canMove()) {
            FocusCell.Instance.Cell = this.cells[FocusCell.Instance.Cell.gridIndex - 1];
        }
    }

    private isStillInSelection(): boolean {
        return FocusCell.Instance.Cell !== undefined && FocusCell.Instance.Orientation === Orientation.Horizontal;
    }
}
