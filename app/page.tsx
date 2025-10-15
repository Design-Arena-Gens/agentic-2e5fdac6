"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  endOfMonth,
  endOfWeek,
  eachDayOfInterval
} from "date-fns";
import styles from "./page.module.css";

type EnergyType = "Demand" | "Production" | "Storage" | "Provision";
type EnergyEvent = {
  id: string;
  title: string;
  type: EnergyType;
  date: string;
  startTime: string;
  endTime: string;
  energyKwh: number;
  status: "Scheduled" | "Completed" | "Opportunity";
  efficiencyScore: number;
  notes?: string;
};

const initialEvents: EnergyEvent[] = [
  {
    id: "event-1",
    title: "EV Fleet Charging",
    type: "Demand",
    date: format(new Date(), "yyyy-MM-05"),
    startTime: "19:00",
    endTime: "22:30",
    energyKwh: 420,
    status: "Scheduled",
    efficiencyScore: 68,
    notes: "Aligned with evening time-of-use incentives."
  },
  {
    id: "event-2",
    title: "Solar Array Generation",
    type: "Production",
    date: format(new Date(), "yyyy-MM-06"),
    startTime: "07:30",
    endTime: "17:30",
    energyKwh: 560,
    status: "Completed",
    efficiencyScore: 92,
    notes: "Exceeded forecast by 8% due to clear skies."
  },
  {
    id: "event-3",
    title: "Battery Reserve Charge",
    type: "Storage",
    date: format(new Date(), "yyyy-MM-08"),
    startTime: "00:30",
    endTime: "02:00",
    energyKwh: 135,
    status: "Scheduled",
    efficiencyScore: 83,
    notes: "Nighttime charging to prep for peak shifting."
  },
  {
    id: "event-4",
    title: "Community Energy Share",
    type: "Provision",
    date: format(new Date(), "yyyy-MM-10"),
    startTime: "14:00",
    endTime: "16:00",
    energyKwh: 220,
    status: "Completed",
    efficiencyScore: 88,
    notes: "Delivered surplus to adjacent microgrid."
  },
  {
    id: "event-5",
    title: "Data Center Load Test",
    type: "Demand",
    date: format(new Date(), "yyyy-MM-15"),
    startTime: "13:00",
    endTime: "15:00",
    energyKwh: 315,
    status: "Scheduled",
    efficiencyScore: 54,
    notes: "Consider shifting to weekend window."
  },
  {
    id: "event-6",
    title: "Wind Turbine Peak",
    type: "Production",
    date: format(new Date(), "yyyy-MM-17"),
    startTime: "02:00",
    endTime: "05:00",
    energyKwh: 410,
    status: "Completed",
    efficiencyScore: 79,
    notes: "Met forecast; turbulence reduced output by 5%."
  },
  {
    id: "event-7",
    title: "Thermal Storage Discharge",
    type: "Storage",
    date: format(new Date(), "yyyy-MM-22"),
    startTime: "16:30",
    endTime: "19:00",
    energyKwh: 190,
    status: "Opportunity",
    efficiencyScore: 72,
    notes: "Dispatch to cover peak pricing interval."
  }
];

const typeStyles: Record<
  EnergyType,
  {
    background: string;
    border: string;
    accentClass: string;
  }
> = {
  Demand: {
    background: "rgba(255, 87, 87, 0.12)",
    border: "1px solid rgba(255, 87, 87, 0.35)",
    accentClass: styles.legendSwatchDemand
  },
  Production: {
    background: "rgba(14, 182, 119, 0.15)",
    border: "1px solid rgba(14, 182, 119, 0.35)",
    accentClass: styles.legendSwatchProduction
  },
  Storage: {
    background: "rgba(246, 173, 85, 0.17)",
    border: "1px solid rgba(246, 173, 85, 0.38)",
    accentClass: styles.legendSwatchStorage
  },
  Provision: {
    background: "rgba(46, 128, 255, 0.16)",
    border: "1px solid rgba(46, 128, 255, 0.45)",
    accentClass: styles.legendSwatchProvision
  }
};

const filterOptions: Array<EnergyType | "All"> = ["All", "Demand", "Production", "Storage", "Provision"];

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const now = new Date();

export default function EnergyManagementCalendar() {
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(now));
  const [events, setEvents] = useState<EnergyEvent[]>(initialEvents);
  const [activeFilter, setActiveFilter] = useState<EnergyType | "All">("All");

  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "Demand" as EnergyType,
    date: format(now, "yyyy-MM-dd"),
    startTime: "08:00",
    endTime: "09:00",
    energyKwh: "",
    status: "Scheduled" as EnergyEvent["status"],
    notes: ""
  });

  const monthInterval = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [visibleMonth]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === "All") {
      return events;
    }
    return events.filter((event) => event.type === activeFilter);
  }, [events, activeFilter]);

  const summary = useMemo(() => {
    const monthKey = format(visibleMonth, "yyyy-MM");
    const monthEvents = events.filter((event) => event.date.startsWith(monthKey));
    const totalsByType = monthEvents.reduce(
      (acc, event) => {
        acc[event.type] += event.energyKwh;
        return acc;
      },
      {
        Demand: 0,
        Production: 0,
        Storage: 0,
        Provision: 0
      }
    );
    const totalConsumption = totalsByType.Demand;
    const totalProduction = totalsByType.Production + totalsByType.Provision;
    const storageBuffer = totalsByType.Storage;
    const netBalance = totalProduction + storageBuffer - totalConsumption;

    const completedCount = monthEvents.filter((event) => event.status === "Completed").length;
    const averageEfficiency =
      monthEvents.length > 0
        ? Math.round(monthEvents.reduce((acc, event) => acc + event.efficiencyScore, 0) / monthEvents.length)
        : 0;

    return {
      totalsByType,
      totalConsumption,
      totalProduction,
      storageBuffer,
      netBalance,
      completedCount,
      totalEvents: monthEvents.length,
      averageEfficiency
    };
  }, [events, visibleMonth]);

  const recommendations = useMemo(() => {
    const recs: Array<{ title: string; detail: string }> = [];
    if (summary.netBalance < 0) {
      recs.push({
        title: "Net Load Imbalance",
        detail:
          "Demand outpaces supply this month. Shift flexible loads (e.g., EV charging) into early morning windows or increase storage dispatch."
      });
    } else {
      recs.push({
        title: "Positive Net Balance",
        detail:
          "You're producing more energy than you consume. Schedule a provision event to export surplus during afternoon peak pricing."
      });
    }

    if (summary.totalsByType.Demand > summary.totalsByType.Production * 1.2) {
      recs.push({
        title: "Demand Peaks Forecasted",
        detail:
          "Forecasted demand is 20% above on-site production. Consider adding a demand response event or activating backup generation."
      });
    }

    const lowEfficiencyEvents = events
      .filter((event) => event.efficiencyScore < 70)
      .slice(0, 2)
      .map((event) => event.title);
    if (lowEfficiencyEvents.length > 0) {
      recs.push({
        title: "Improve Efficiency Scores",
        detail: `Optimize schedules for ${lowEfficiencyEvents.join(
          " & "
        )} to boost their efficiency ratings above 70%.`
      });
    }

    return recs;
  }, [summary, events]);

  const handleMonthChange = (direction: "prev" | "next") => {
    setVisibleMonth((prev) => (direction === "prev" ? addMonths(prev, -1) : addMonths(prev, 1)));
  };

  const handleChange = (field: string, value: string) => {
    setNewEvent((prev) => ({
      ...prev,
      [field]: field === "energyKwh" ? value.replace(/[^0-9.]/g, "") : value
    }));
  };

  const handleCreateEvent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newEvent.title.trim() || !newEvent.date || !newEvent.energyKwh) {
      return;
    }
    const energyValue = Number(newEvent.energyKwh);
    if (Number.isNaN(energyValue) || energyValue <= 0) {
      return;
    }

    const createdEvent: EnergyEvent = {
      id: `event-${Date.now()}`,
      title: newEvent.title.trim(),
      type: newEvent.type,
      date: newEvent.date,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      energyKwh: energyValue,
      status: newEvent.status,
      efficiencyScore: Math.min(100, Math.max(40, Math.round(energyValue > 500 ? 80 : 90 - energyValue / 10))),
      notes: newEvent.notes?.trim() || undefined
    };
    setEvents((prev) => [...prev, createdEvent]);
    setNewEvent({
      title: "",
      type: newEvent.type,
      date: newEvent.date,
      startTime: "08:00",
      endTime: "09:00",
      energyKwh: "",
      status: newEvent.status,
      notes: ""
    });
  };

  return (
    <main className={styles.container}>
      <div className={styles.wrapper}>
        <header className={styles.pageHeader}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Energy Management Calendar</h1>
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span className={`${styles.legendSwatch} ${styles.legendSwatchDemand}`} />
                Demand Load
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendSwatch} ${styles.legendSwatchProduction}`} />
                On-Site Production
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendSwatch} ${styles.legendSwatchStorage}`} />
                Storage Cycle
              </span>
              <span className={styles.legendItem}>
                <span className={`${styles.legendSwatch} ${styles.legendSwatchProvision}`} />
                Provision Export
              </span>
            </div>
          </div>
          <p className={styles.subtitle}>
            Plan, schedule, and balance distributed energy resources across your operations. Align production, storage,
            and consumption to optimize costs while meeting resilience targets.
          </p>
        </header>

        <section className={styles.summaryCard}>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Net Balance</span>
              <span className={styles.summaryValue}>
                {summary.netBalance >= 0 ? "+" : "-"}
                {Math.abs(summary.netBalance).toFixed(0)} kWh
              </span>
              <span className={styles.summaryDelta}>
                {summary.netBalance >= 0 ? "Surplus available for export" : "Cover deficit with storage or grid supply"}
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Production</span>
              <span className={styles.summaryValue}>{summary.totalProduction.toFixed(0)} kWh</span>
              <span className={styles.summaryDelta}>
                {summary.totalsByType.Production.toFixed(0)} on-site · {summary.totalsByType.Provision.toFixed(0)} shared
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Consumption</span>
              <span className={styles.summaryValue}>{summary.totalConsumption.toFixed(0)} kWh</span>
              <span className={styles.summaryDelta}>{summary.totalsByType.Demand.toFixed(0)} kWh scheduled demand</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Efficiency Index</span>
              <span className={styles.summaryValue}>{summary.averageEfficiency}%</span>
              <span className={styles.summaryDelta}>
                {summary.completedCount} of {summary.totalEvents} events completed
              </span>
            </div>
          </div>
        </section>

        <section className={styles.calendarCard}>
          <div className={styles.calendarHeader}>
            <span>{format(visibleMonth, "MMMM yyyy")}</span>
            <div className={styles.filterRow}>
              {filterOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${styles.filterButton} ${activeFilter === option ? styles.filterButtonActive : ""}`}
                  onClick={() => setActiveFilter(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className={styles.navButtons}>
              <button type="button" className={styles.navButton} onClick={() => handleMonthChange("prev")}>
                ← Previous
              </button>
              <button type="button" className={styles.navButton} onClick={() => setVisibleMonth(startOfMonth(now))}>
                Today
              </button>
              <button type="button" className={styles.navButton} onClick={() => handleMonthChange("next")}>
                Next →
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            {weekdays.map((weekday) => (
              <div key={weekday} className={styles.weekday}>
                {weekday}
              </div>
            ))}
            {monthInterval.map((day) => {
              const dayEvents = filteredEvents.filter((event) => isSameDay(parseISO(event.date), day));
              const isToday = isSameDay(day, now);
              const inCurrentMonth = isSameMonth(day, visibleMonth);
              return (
                <div
                  key={day.toISOString()}
                  className={`${styles.dayCell} ${!inCurrentMonth ? styles.nonCurrentMonth : ""}`}
                >
                  <span className={`${styles.dayNumber} ${isToday ? styles.dayNumberToday : ""}`}>
                    {format(day, "d")}
                  </span>
                  {dayEvents.length === 0 ? (
                    <span className={styles.emptyState}>No activity scheduled</span>
                  ) : (
                    dayEvents.map((event) => (
                      <article
                        key={event.id}
                        className={styles.event}
                        style={{
                          background: typeStyles[event.type].background,
                          border: typeStyles[event.type].border
                        }}
                      >
                        <div className={styles.eventHeader}>
                          <span className={styles.eventTitle}>{event.title}</span>
                          <span className={`${styles.eventType} ${typeStyles[event.type].accentClass}`}>{event.type}</span>
                        </div>
                        <span className={styles.energyValue}>
                          {event.startTime} – {event.endTime} · {event.energyKwh.toFixed(0)} kWh
                        </span>
                        <span className={styles.eventEfficiency}>
                          {event.status} · Efficiency {event.efficiencyScore}%
                        </span>
                        {event.notes ? <span className={styles.energyValue}>{event.notes}</span> : null}
                      </article>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.plannerCard}>
          <div className={styles.plannerLayout}>
            <form className={styles.form} onSubmit={handleCreateEvent}>
              <h2>Schedule New Activity</h2>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="title">
                  Activity title
                </label>
                <input
                  id="title"
                  className={styles.input}
                  placeholder="e.g., Shift HVAC precooling"
                  value={newEvent.title}
                  onChange={(event) => handleChange("title", event.target.value)}
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="type">
                    Category
                  </label>
                  <select
                    id="type"
                    className={styles.select}
                    value={newEvent.type}
                    onChange={(event) => handleChange("type", event.target.value)}
                  >
                    <option value="Demand">Demand</option>
                    <option value="Production">Production</option>
                    <option value="Storage">Storage</option>
                    <option value="Provision">Provision</option>
                  </select>
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="status">
                    Status
                  </label>
                  <select
                    id="status"
                    className={styles.select}
                    value={newEvent.status}
                    onChange={(event) => handleChange("status", event.target.value)}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Opportunity">Opportunity</option>
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="date">
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    className={styles.input}
                    value={newEvent.date}
                    onChange={(event) => handleChange("date", event.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="energy">
                    Energy (kWh)
                  </label>
                  <input
                    id="energy"
                    className={styles.input}
                    placeholder="150"
                    value={newEvent.energyKwh}
                    onChange={(event) => handleChange("energyKwh", event.target.value)}
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="startTime">
                    Start time
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    className={styles.input}
                    value={newEvent.startTime}
                    onChange={(event) => handleChange("startTime", event.target.value)}
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="endTime">
                    End time
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    className={styles.input}
                    value={newEvent.endTime}
                    onChange={(event) => handleChange("endTime", event.target.value)}
                  />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label} htmlFor="notes">
                  Notes
                </label>
                <textarea
                  id="notes"
                  className={styles.input}
                  rows={3}
                  placeholder="Add context, targets, or automation triggers..."
                  value={newEvent.notes}
                  onChange={(event) => handleChange("notes", event.target.value)}
                />
              </div>
              <button
                className={styles.primaryButton}
                type="submit"
                disabled={!newEvent.title.trim() || !newEvent.energyKwh}
              >
                Add to calendar
              </button>
            </form>

            <div>
              <h2>Optimization Insights</h2>
              <div className={styles.recommendations}>
                {recommendations.map((recommendation, index) => (
                  <div key={index} className={styles.recommendationItem}>
                    <span className={`${styles.tag} ${styles.tagAccent}`}>{recommendation.title}</span>
                    <span>{recommendation.detail}</span>
                  </div>
                ))}
                <div className={styles.tag}>Automations Ready · 3</div>
                <div className={styles.tag}>Demand Response Windows · 2</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
