import type {
  ContributionCalendarData,
  ContributionDay,
  ContributionState,
} from "@github-client/core"
import { Button } from "@github-client/ui/components/button"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@github-client/ui/components/popover"
import { useCallback, useEffect, useId, useMemo, useState, useSyncExternalStore } from "react"
import { useSession } from "@/app/client"

const dayName = new Intl.DateTimeFormat(undefined, { weekday: "short", timeZone: "UTC" })
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const dateName = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})
const levelColors: Record<string, string> = {
  NONE: "var(--muted)",
  FIRST_QUARTILE: "#9be9a8",
  SECOND_QUARTILE: "#40c463",
  THIRD_QUARTILE: "#30a14e",
  FOURTH_QUARTILE: "#216e39",
}

function dateAtUtcNoon(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12))
}

function flatten(calendar: ContributionCalendarData): ContributionDay[] {
  return calendar.weeks.flatMap((week) => week.contributionDays)
}

function recentWeeks(calendar: ContributionCalendarData) {
  return calendar.weeks.slice(-13)
}

function total(calendar: ContributionCalendarData) {
  return flatten(calendar).reduce((sum, day) => sum + day.contributionCount, 0)
}

function Cell({
  day,
  active,
  onFocus,
  onPointerEnter,
  onKeyDown,
  id,
}: {
  day: ContributionDay
  id: string
  active: boolean
  onFocus: () => void
  onPointerEnter: () => void
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void
}) {
  const title = `${dateName.format(dateAtUtcNoon(day.date))}: ${day.contributionCount} ${day.contributionCount === 1 ? "contribution" : "contributions"}`
  return (
    <button
      type="button"
      aria-label={title}
      id={id}
      title={title}
      tabIndex={active ? 0 : -1}
      onFocus={onFocus}
      onPointerEnter={onPointerEnter}
      onKeyDown={onKeyDown}
      className="block h-[10px] w-[10px] rounded-[2px] border border-foreground/10 p-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
      style={{ backgroundColor: levelColors[day.contributionLevel] ?? "var(--muted)" }}
    />
  )
}

function Heatmap({
  calendar,
  full = false,
}: {
  calendar: ContributionCalendarData
  full?: boolean
}) {
  const weeks = full ? calendar.weeks : recentWeeks(calendar)
  const days = useMemo(() => weeks.flatMap((week) => week.contributionDays), [weeks])
  const gridId = useId()
  const [activeDate, setActiveDate] = useState<string>()
  const [focusedDate, setFocusedDate] = useState<string>()
  const activeDay = activeDate
    ? (days.find((day) => day.date === activeDate) ?? days[days.length - 1])
    : days[0]
  const focusedDay = days.find((day) => day.date === focusedDate)
  const cellId = (week: number, weekday: number) => `${gridId}-${week}-${weekday}`
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    week: number,
    weekday: number,
  ) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return

    let nextWeek = week
    let nextWeekday = weekday
    switch (event.key) {
      case "ArrowLeft":
        nextWeek--
        break
      case "ArrowRight":
        nextWeek++
        break
      case "ArrowUp":
        nextWeekday--
        break
      case "ArrowDown":
        nextWeekday++
        break
      default:
        return
    }

    const nextCell = event.currentTarget.ownerDocument.getElementById(cellId(nextWeek, nextWeekday))
    if (!nextCell) return
    event.preventDefault()
    nextCell.focus()
  }
  const dayByWeekday = new Map<number, string>()
  for (const day of days) dayByWeekday.set(day.weekday, dayName.format(dateAtUtcNoon(day.date)))

  return (
    <div>
      <fieldset className="m-0 min-w-0 border-0 p-0">
        <legend className="sr-only">
          {full ? "Contributions over the last year" : "Contributions over the last thirteen weeks"}
        </legend>
        <div
          className="grid gap-[3px] overflow-x-auto"
          style={{
            gridTemplateColumns: `24px repeat(${weeks.length}, 10px)`,
            gridTemplateRows: "repeat(7, 10px)",
            height: 88,
          }}
        >
          {weekdays.map((label, weekday) => (
            <div
              key={label}
              aria-hidden="true"
              className="flex h-[10px] items-center text-[9px] text-muted-foreground"
              style={{ gridRow: weekday + 1, gridColumn: 1 }}
            >
              {weekday % 2 === 0 ? dayByWeekday.get(weekday) : ""}
            </div>
          ))}
          {weeks.map((week, weekIndex) =>
            week.contributionDays.map((day) => (
              <div
                key={day.date}
                className="flex items-start"
                style={{ gridColumn: weekIndex + 2, gridRow: day.weekday + 1 }}
              >
                <Cell
                  day={day}
                  id={cellId(weekIndex, day.weekday)}
                  active={day === activeDay}
                  onFocus={() => {
                    setActiveDate(day.date)
                    setFocusedDate(day.date)
                  }}
                  onPointerEnter={() => setFocusedDate(day.date)}
                  onKeyDown={(event) => handleKeyDown(event, weekIndex, day.weekday)}
                />
              </div>
            )),
          )}
        </div>
      </fieldset>
      <p className="mt-1 min-h-4 text-xs text-muted-foreground" aria-live="polite">
        {focusedDay
          ? `${dateName.format(dateAtUtcNoon(focusedDay.date))}: ${focusedDay.contributionCount} ${focusedDay.contributionCount === 1 ? "contribution" : "contributions"}`
          : "Focus or point to a day to see contributions."}
      </p>
      <fieldset className="mt-1 m-0 border-0 p-0">
        <legend className="sr-only">Contribution levels</legend>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <span>Less</span>
          {["NONE", "FIRST_QUARTILE", "SECOND_QUARTILE", "THIRD_QUARTILE", "FOURTH_QUARTILE"].map(
            (level) => (
              <span
                key={level}
                className="h-[10px] w-[10px] rounded-[2px] border border-foreground/10"
                style={{ backgroundColor: levelColors[level] }}
                aria-hidden="true"
              />
            ),
          )}
          <span>More</span>
        </div>
      </fieldset>
    </div>
  )
}

export function ContributionCalendar() {
  const { client, viewer } = useSession()
  const subscribe = useCallback(
    (listener: () => void) => client.contributions.subscribe(listener),
    [client],
  )
  const getSnapshot = useCallback(
    (): ContributionState => client.contributions.snapshot(),
    [client],
  )
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const [expanded, setExpanded] = useState(
    () =>
      typeof window !== "undefined" &&
      !window.matchMedia("(max-width: 720px), (max-height: 650px)").matches,
  )
  const [yearOpen, setYearOpen] = useState(false)

  useEffect(() => {
    void client.contributions.load(viewer.login)
    const onFocus = () => {
      void client.contributions.load(viewer.login)
    }
    window.addEventListener("focus", onFocus)
    return () => window.removeEventListener("focus", onFocus)
  }, [client, viewer.login])

  useEffect(() => {
    const compact = window.matchMedia("(max-width: 720px), (max-height: 650px)")
    const update = () => setExpanded(!compact.matches)
    compact.addEventListener("change", update)
    return () => compact.removeEventListener("change", update)
  }, [])

  const calendar = state.calendar
  return (
    <section className="min-w-0 border-t border-border px-3 py-2" aria-label="Contributions">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          <span aria-hidden="true" className="mr-1">
            {expanded ? "▾" : "▸"}
          </span>
          Contributions
        </Button>
        {calendar && (
          <Popover open={yearOpen} onOpenChange={setYearOpen}>
            <PopoverTrigger
              render={<Button variant="ghost" size="sm" className="h-7 px-2 text-xs" />}
            >
              View year
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(88vw,720px)] max-w-[88vw]">
              <PopoverTitle>Contributions in the last year</PopoverTitle>
              <div className="mt-3 max-w-full overflow-x-auto">
                <Heatmap calendar={calendar} full />
              </div>
              <p className="text-xs text-muted-foreground">
                This view follows the contributions GitHub returns for your current account
                permissions. Private activity may be limited.
              </p>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {calendar && (
        <p className="px-2 text-[10px] text-muted-foreground">
          {total(calendar).toLocaleString()} contributions in the last year
        </p>
      )}
      {state.status === "loading" && !calendar && (
        <p className="px-2 py-2 text-xs text-muted-foreground" role="status">
          Loading contributions…
        </p>
      )}
      {state.status === "loading" && calendar && (
        <p className="px-2 py-1 text-xs text-muted-foreground" role="status">
          Refreshing contributions…
        </p>
      )}
      {state.status === "error" && (
        <div className="flex items-center gap-2 px-2 py-1 text-xs" role="status">
          <span className="text-muted-foreground">
            {calendar
              ? "Showing saved contributions; refresh failed."
              : "Contributions are unavailable."}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void client.contributions.load(viewer.login, true)}
          >
            Retry
          </Button>
        </div>
      )}
      {expanded && (
        <div className="mt-2">
          {calendar && <Heatmap calendar={{ weeks: recentWeeks(calendar) }} />}
          {!calendar && state.status === "idle" && (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              Contributions have not loaded.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
