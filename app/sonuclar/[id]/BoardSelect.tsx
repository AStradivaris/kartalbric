"use client";

// Board seçici: açılır listeden board seçilince o board'a gider.
export default function BoardSelect({ boards, current, hrefBase }: { boards: number[]; current: number; hrefBase: string }) {
  return (
    <label className="board-select">
      <span className="sr-only">Board seç</span>
      <select
        value={current}
        onChange={(e) => {
          window.location.href = hrefBase.replace("__B__", e.target.value);
        }}
      >
        {boards.map((b) => (
          <option key={b} value={b}>
            Board {b}
          </option>
        ))}
      </select>
    </label>
  );
}
