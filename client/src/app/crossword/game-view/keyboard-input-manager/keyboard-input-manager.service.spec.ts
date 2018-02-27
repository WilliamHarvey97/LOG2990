import { TestBed, inject } from "@angular/core/testing";
import { KeyboardInputManagerService } from "./keyboard-input-manager.service";
import { FocusCell } from "../focusCell";
import { ICell, CellColor } from "../../interfaces/ICell";
import { Orientation } from "../../../../../../common/interfaces/IWord";

describe("KeyboardInputManagerService", () => {
    const BACKSPACE_KEYCODE: number = 8;
    const ESCAPE_KEYCODE: number = 27;
    const LETTER_A_KEYCODE: number = 65;
    const LETTER_Z_KEYCODE: number = 90;

    let cells: Array<ICell> = new Array();
    const keyboardInputManagerService: KeyboardInputManagerService = new KeyboardInputManagerService(cells);

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [KeyboardInputManagerService, Array<ICell>()]
        });
    });

    it("should be created", inject([KeyboardInputManagerService], (service: KeyboardInputManagerService) => {
        expect(service).toBeTruthy();
    }));

    it("should have a cell with a content of A", () => {
        const GRID_WIDTH: number = 2;
        cells = [{gridIndex: 1, index: 1, answer: "A", cellColor: CellColor.White, content: "", isFound: false },
                 {gridIndex: 2, index: 1, answer: "B", cellColor: CellColor.White, content: "", isFound: false },
                 {gridIndex: 3, index: 2, answer: "C", cellColor: CellColor.White, content: "", isFound: false },
                 {gridIndex: 4, index: undefined, answer: "", cellColor: CellColor.Black, content: "", isFound: false }];

        FocusCell.Instance.Cell = cells[1];
        FocusCell.Instance.Orientation = Orientation.Horizontal;
        FocusCell.Instance.Cells = [cells[0], cells[1]];

        keyboardInputManagerService.handleKeyDown(LETTER_A_KEYCODE);

        expect(FocusCell.Instance.Cell.content).toEqual("A");
    });

    it("should have a cell with a content of nothing", () => {
        const GRID_WIDTH: number = 2;
        cells = [{gridIndex: 1, index: 1, answer: "A", cellColor: CellColor.White, content: "", isFound: false },
                 {gridIndex: 2, index: 1, answer: "B", cellColor: CellColor.White, content: "", isFound: false },
                 {gridIndex: 3, index: 2, answer: "C", cellColor: CellColor.White, content: "", isFound: false },
                 {gridIndex: 4, index: undefined, answer: "", cellColor: CellColor.Black, content: "", isFound: false }];

        FocusCell.Instance.Cell = cells[1];
        FocusCell.Instance.Orientation = Orientation.Horizontal;
        FocusCell.Instance.Cells = [cells[0], cells[1]];

        keyboardInputManagerService.handleKeyDown(ESCAPE_KEYCODE);
        expect(FocusCell.Instance.Cell.content).toBe("");
    });

    it("should contain all letters at least once", () => {
        const GRID_WIDTH: number = 2;
        cells = [{gridIndex: 1, index: 1, answer: "A", cellColor: CellColor.White, content: "", isFound: false },
                 {gridIndex: 2, index: 1, answer: "B", cellColor: CellColor.White, content: "", isFound: false },
                 {gridIndex: 3, index: 2, answer: "C", cellColor: CellColor.White, content: "", isFound: false },
                 {gridIndex: 4, index: undefined, answer: "", cellColor: CellColor.Black, content: "", isFound: false }];

        FocusCell.Instance.Cell = cells[1];
        FocusCell.Instance.Orientation = Orientation.Horizontal;
        FocusCell.Instance.Cells = [cells[0], cells[1]];

        for (let keyCode: number = LETTER_A_KEYCODE; keyCode <= LETTER_Z_KEYCODE; keyCode++) {
            keyboardInputManagerService.handleKeyDown(keyCode);
            expect(FocusCell.Instance.Cell.content).toEqual(String.fromCharCode(keyCode));
        }
    });

    it("should have a content of nothing", () => {
        const GRID_WIDTH: number = 2;
        cells = [{gridIndex: 1, index: 1, answer: "A", cellColor: CellColor.White, content: "", isFound: false },
                 {gridIndex: 2, index: 1, answer: "B", cellColor: CellColor.White, content: "", isFound: false },
                 {gridIndex: 3, index: 2, answer: "C", cellColor: CellColor.White, content: "", isFound: false },
                 {gridIndex: 4, index: undefined, answer: "", cellColor: CellColor.Black, content: "", isFound: false }];

        FocusCell.Instance.Cell = cells[1];
        FocusCell.Instance.Cell.content = "A";
        FocusCell.Instance.Orientation = Orientation.Horizontal;
        FocusCell.Instance.Cells = [cells[0], cells[1]];

        keyboardInputManagerService.handleKeyDown(BACKSPACE_KEYCODE);
        expect(FocusCell.Instance.Cell.content).toBe(undefined);
    });
});
