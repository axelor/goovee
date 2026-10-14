'use client';

// ---- LOCAL IMPORTS ---- //
import type {EditorCommands} from '../types';
import {cancelEvent} from '../dom';
import styles from '../editor.module.css';

const ROWS = 14;
const COLUMNS = 25;

function toHex(value: number) {
  return `0${Math.floor(value * 255).toString(16)}`.slice(-2);
}

function fromHsv(hue: number, saturation: number, value: number) {
  const sector = Math.floor(hue * 6);
  const offset = hue * 6 - sector;
  const down = value * (1 - saturation);
  const falling = value * (1 - offset * saturation);
  const rising = value * (1 - (1 - offset) * saturation);

  const [red, green, blue] = [
    [value, rising, down],
    [falling, value, down],
    [down, value, rising],
    [down, falling, value],
    [rising, down, value],
    [value, down, falling],
  ][sector % 6];

  return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

/*
 * A hue per column and a saturation/value ramp per row, with the last column
 * carrying the greys — the same grid the back-office offers, so a colour
 * picked on either side can be picked again on the other.
 */
function buildPalette() {
  const rows: string[][] = [];

  for (let row = 1; row <= ROWS; ++row) {
    const colors: string[] = [];

    for (let column = 0; column < COLUMNS; ++column) {
      if (column === COLUMNS - 1) {
        const grey = toHex((ROWS - row) / (ROWS - 1));
        colors.push(`#${grey}${grey}${grey}`);
      } else {
        colors.push(
          fromHsv(
            column / (COLUMNS - 1),
            row <= 8 ? row / 8 : 1,
            row > 8 ? (16 - row) / 8 : 1,
          ),
        );
      }
    }

    rows.push(colors);
  }

  return rows;
}

const PALETTE = buildPalette();

export interface ColorPaletteProps {
  commands: EditorCommands;
  onSelect: (commands: EditorCommands, color: string) => void;
}

export function ColorPalette({commands, onSelect}: ColorPaletteProps) {
  return (
    <table className={styles.palette}>
      <tbody>
        {PALETTE.map((colors, row) => (
          <tr key={row}>
            {colors.map((color, column) => (
              <td
                key={column}
                style={{backgroundColor: color}}
                title={color}
                onMouseDown={cancelEvent}
                onClick={event => {
                  cancelEvent(event);
                  onSelect(commands, color);
                }}
              />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
