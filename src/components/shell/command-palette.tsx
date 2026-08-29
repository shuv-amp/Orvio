"use client";

import { CornerDownLeft, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  filterCommands,
  groupCommands,
  moveActiveIndex,
  type Command,
} from "@/lib/ui/commands";

/**
 * Command palette.
 *
 * The topbar previously rendered a decorative "Search event ⌘K" chip that did
 * nothing. This implements it for real, following the ARIA combobox pattern:
 * focus stays in the text field while the arrow keys move
 * `aria-activedescendant` through the listbox, so a screen reader announces
 * each option without the field losing focus.
 *
 * The parent mounts this only while the palette is open, so the query and the
 * highlighted row reset naturally on each open with no synchronising effect.
 */
export function CommandPalette({
  onClose,
  onRun,
}: {
  onClose: () => void;
  onRun: (command: Command) => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;

  const results = useMemo(() => filterCommands(query), [query]);
  const grouped = useMemo(() => groupCommands(results), [results]);
  const indexById = useMemo(
    () => new Map(results.map((command, index) => [command.id, index])),
    [results],
  );
  const activeCommand = results[activeIndex];
  const optionId = (id: string) => `${baseId}-${id}`;

  // Take focus on open and hand it back to the trigger on close.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => previous?.focus();
  }, []);

  // Keep the highlighted row inside the scroll viewport.
  useEffect(() => {
    if (!activeCommand) return;
    listRef.current
      ?.querySelector(`#${CSS.escape(optionId(activeCommand.id))}`)
      ?.scrollIntoView({ block: "nearest" });
  });

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        moveActiveIndex(
          current,
          event.key === "ArrowDown" ? 1 : -1,
          results.length,
        ),
      );
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActiveIndex(event.key === "Home" ? 0 : results.length - 1);
      return;
    }
    if (event.key === "Enter" && activeCommand) {
      event.preventDefault();
      onRun(activeCommand);
    }
  }

  return (
    <div className="palette-layer">
      <button
        type="button"
        className="palette-scrim"
        aria-label="Close command palette"
        onClick={onClose}
      />
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={handleKeyDown}
      >
        <div className="palette-field">
          <Search size={17} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={
              activeCommand ? optionId(activeCommand.id) : undefined
            }
            aria-autocomplete="list"
            aria-label="Search commands and workspaces"
            placeholder="Jump to a workspace or run an action"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd>Esc</kbd>
        </div>

        {/* Focusable so the scroll region is operable by keyboard alone. The
            combobox keeps `aria-activedescendant` while the input has focus,
            and the dialog-level key handler still moves the selection if the
            user tabs into the list to scroll it. */}
        <div
          className="palette-results"
          ref={listRef}
          tabIndex={0}
          aria-label="Command results"
        >
          <div id={listboxId} role="listbox" aria-label="Commands">
            {grouped.map(([group, commands]) => (
              <div className="palette-group" key={group}>
                <p className="palette-group-label" aria-hidden="true">
                  {group}
                </p>
                {commands.map((command) => {
                  const index = indexById.get(command.id) ?? 0;
                  const selected = index === activeIndex;
                  return (
                    <div
                      key={command.id}
                      id={optionId(command.id)}
                      role="option"
                      aria-selected={selected}
                      className={`palette-option ${selected ? "active" : ""}`}
                      onClick={() => onRun(command)}
                      onMouseMove={() => setActiveIndex(index)}
                    >
                      <span className="palette-option-label">
                        {command.label}
                      </span>
                      <span className="palette-option-hint">
                        {command.hint}
                      </span>
                      {selected && (
                        <CornerDownLeft size={13} aria-hidden="true" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          {results.length === 0 && (
            <p className="palette-empty">
              No command matches “{query.trim()}”. Try “judge”, “scan”, or
              “dark”.
            </p>
          )}
        </div>

        <p className="visually-hidden" role="status">
          {results.length === 0
            ? "No commands available"
            : `${results.length} commands available`}
        </p>
        <div className="palette-foot" aria-hidden="true">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> run
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
