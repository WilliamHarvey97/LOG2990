import { Component, OnInit, HostListener } from "@angular/core";
import { BLACK_CHAR, GRID_WIDTH } from "../../../constants";

import { GridService } from "../../grid.service";
import { IWord } from "../../../../../../common/interfaces/IWord";
import { IGridWord } from "../../interfaces/IGridWord";
import { ICell, CellColor } from "../../interfaces/ICell";
import { FocusCell } from "../focusCell";
import { KeywordInputManagerService } from "../keyword-input-manager/keyword-input-manager.service";

@Component({
    selector: "app-crossword-grid",
    templateUrl: "./grid.component.html",
    styleUrls: ["./grid.component.css"],
    providers: [KeywordInputManagerService]
})

export class GridComponent implements OnInit {
    private indexPosition: number[];
    private cells: Array<ICell>;
    private gridWords: Array<IGridWord>;
    // Mock list that we will receive from crossword generator
    private mockWords: string[];
    // private convertedMockWords: string;
    private gridContent: string;
    private words: Array<IWord>;
    private clickedWords: Array<IGridWord>;
    private clickedCell: ICell;
    private focusCell: FocusCell;

    private keywordInputManagerService: KeywordInputManagerService;
    public constructor(private gridService: GridService) {
        this.indexPosition = new Array();
        this.cells = new Array();
        this.gridWords = new Array<IGridWord>();
        this.clickedWords = new Array();
        this.focusCell = FocusCell.Instance;
        this.keywordInputManagerService = new KeywordInputManagerService(this.cells);
    }

    public ngOnInit(): void {
        this.gridService.getGrid().subscribe((gridContent: string) => {
            this.gridContent = gridContent;
        });
        this.gridService.getWords().subscribe((words: Array<IWord>) => {
            this.words = words;
            this.addIndextoCells();
            this.createCells();
            this.createWords();
        });
    }

    private isABlackSquare(letter: string): boolean {
        return letter === BLACK_CHAR;
    }

    private createCells(): void {
        let index: number = 1;
        for (let i: number = 0; i < this.gridContent.length; ++i) {
            if (i === this.indexPosition[index - 1]) {
                this.cells.push({ gridIndex: i, index: index, answer: this.gridContent[i],
                                  cellColor: CellColor.White, content: "" } as ICell);
                ++index;
            } else {
                if (this.gridContent[i] === BLACK_CHAR) {
                    this.cells.push({ gridIndex: i, index: null, answer: "",
                                      cellColor: CellColor.Black, content: "" } as ICell);
                } else {
                    this.cells.push({ gridIndex: i, index: null, answer: this.gridContent[i],
                                      cellColor: CellColor.White, content: "" } as ICell);
                }
            }
        }
    }

    // create the array that contain every cell's number that need an index
    private addIndextoCells(): void {
        for (let i: number = 0; i < this.gridContent.length; ++i) {
            if (this.containsIndex(i)) {
                this.indexPosition.push(i);
            }
        }
    }

    private containsIndex(i: number): boolean {
        return !this.isABlackSquare(this.gridContent[i]) &&              // the cell isn't black
            (i < GRID_WIDTH && !this.isABlackSquare(this.gridContent[i + GRID_WIDTH]) || // first line
                this.isABlackSquare(this.gridContent[i - 1]) &&
                !this.isABlackSquare(this.gridContent[i + 1]) ||          // right side of a black square
                this.isABlackSquare(this.gridContent[i - GRID_WIDTH])
                && !this.isABlackSquare(this.gridContent[i + GRID_WIDTH]) && // below a black square
                i < GRID_WIDTH * GRID_WIDTH - GRID_WIDTH ||
                i % GRID_WIDTH === 0 && !this.isABlackSquare(this.gridContent[i + 1])); // first column
    }

    private createWords(): void {
        let mockCells: Array<ICell> = new Array();
        this.words.forEach((word: IWord, index: number) => {
            const startPosition: number = this.convertPositionToCellIndex(word.position.x, word.position.y);
            if (word.orientation === 0) { // Vertical
                for (let i: number = startPosition, j: number = 0; j < word.content.length; i = i + GRID_WIDTH, j++) {
                    mockCells.push(this.cells[i]);
                }
            } else {
                for (let i: number = startPosition; i < word.content.length + startPosition; i++) {
                    mockCells.push(this.cells[i]);
                }
            }
            this.gridWords.push({
                cells: mockCells, correctAnswer: word.content,
                definition: word.definition, orientation: word.orientation
            } as IGridWord);
            mockCells = [];
        });
    }

    /*Fonctions appeler directement par le html*/

    public convertPositionToCellIndex(x: number, y: number): number {
        return (y * GRID_WIDTH + x);
    }

    public gridLineJump(index: number): string {
        return (index % GRID_WIDTH) === 0 ? "square clear" : "square";
    }

    public getCellType(color: CellColor): string {
        return color === CellColor.Black ? "black-square" : "white-square";
    }

    public focusOnCell(cell: ICell): void {
        if (this.clickedCell === cell) {    // if click on the same cell twice, switch to Vertical/Horizontal word
            this.chooseHorizontalOrVertical();
        } else {
           this.chooseNewWords(cell);
        }
    }

    private chooseHorizontalOrVertical(): void {
        if (this.clickedWords.length > 1) {
            this.focusCell.Cell = this.focusCell.Cell === this.clickedWords[0].cells[0] ?
                this.clickedWords[1].cells[0] : this.clickedWords[0].cells[0];
            this.focusCell.invertOrientation();
        }
    }

    private chooseNewWords(cell: ICell): void {
        this.clickedWords = [];
        this.gridWords.forEach((word: IGridWord, index: number) => {
            if (word.cells.includes(cell))  {
                this.clickedWords.push(word);
            }
        });
        this.clickedCell = cell;
        this.focusCell.Cell = this.clickedWords[0].cells[0];
        this.focusCell.Orientation = this.clickedWords[0].orientation;
    }

    public addHighlightOnFocus(cell: ICell): string {
       return this.focusCell.Cell === cell ? "focus" : "";
    }

    @HostListener("window:keydown", ["$event"])
    public onKeyDown(event: KeyboardEvent): void {
        this.keywordInputManagerService.handleKeyDown(event);
    }
}
