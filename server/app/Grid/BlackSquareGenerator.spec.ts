import { expect } from "chai";
import { BlackSquareGenerator } from "./BlackSquareGenerator";
import * as cst from "./Constants";

describe("Verifying BlackSquare generation.", () => {
    it ("Should have the correct percentage of BlackSquares.", () => {
        const generator: BlackSquareGenerator = BlackSquareGenerator.getInstance(cst.STANDARD_SIDE_SIZE, cst.PERCENTAGE_BLACK_SQUARES);
        const blackSquares: string[][] = generator.generateBlackSquares();
        let nBlackSquares: number = 0;
        blackSquares.forEach((row: string[]) => {
            row.forEach((letter: string) => {
                if (letter === cst.BLACKSQUARE_CHARACTER) {
                    ++nBlackSquares;
                }
            });
        });
        expect(nBlackSquares).to.equal(cst.PERCENTAGE_BLACK_SQUARES * cst.STANDARD_SIDE_SIZE);
    });
    it("Should have room for at least one word per row/column.", () => {
        const generator: BlackSquareGenerator = BlackSquareGenerator.getInstance(cst.STANDARD_SIDE_SIZE, cst.PERCENTAGE_BLACK_SQUARES);
        const blackSquares: string[][] = generator.generateBlackSquares();
        let enoughRoom: boolean = true;

        for (let i: number = 0; i < cst.STANDARD_SIDE_SIZE; i++) {
            let previousBlackSquarePosRow: number = 0, previousBlackSquarePosCol: number = 0,
                nWordsOnRow: number = 0, nWordsOnCol: number = 0;
            for (let j: number = 0; j < cst.STANDARD_SIDE_SIZE; j++) {
                if (blackSquares[i][j] === cst.BLACKSQUARE_CHARACTER) {
                    previousBlackSquarePosRow = j;
                } else if (previousBlackSquarePosRow >= j - cst.MIN_LETTERS_FOR_WORD) {
                    ++nWordsOnRow;
                }
                if (blackSquares[j][i] === cst.BLACKSQUARE_CHARACTER) {
                    previousBlackSquarePosCol = i;
                } else if (previousBlackSquarePosCol >= i - cst.MIN_LETTERS_FOR_WORD) {
                    ++nWordsOnCol;
                }
            }
            if ((nWordsOnCol < cst.MIN_WORDS_PER_LINE) || (nWordsOnRow < cst.MIN_WORDS_PER_LINE)) {
               enoughRoom = false;
            }
        }
        expect(enoughRoom).to.equal(true);
    });
    it ("Should create BlackSquares that are symmetrical with the diagonal.", () => {
        const generator: BlackSquareGenerator = BlackSquareGenerator.getInstance(cst.STANDARD_SIDE_SIZE, cst.PERCENTAGE_BLACK_SQUARES);
        const blackSquares: string[][] = generator.generateBlackSquares();
        let symmetrical: boolean = true;
        for (let i: number = 0; i < cst.STANDARD_SIDE_SIZE; i++) {
            for (let j: number = 0; j < cst.STANDARD_SIDE_SIZE; j++) {
                if (blackSquares[i][j] !== blackSquares[j][i]) {
                    symmetrical = false;
                }
            }
        }
        expect(symmetrical).to.equal(true);
      });
});