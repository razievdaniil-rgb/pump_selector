import { useEffect, useRef, useState } from "react";
import { Header, type HeaderAction } from "./components/Header";
import { ModelSearchStep } from "./components/ModelSearchStep";
import { PurposeStep } from "./components/PurposeStep";
import { ResultsPanel } from "./components/ResultsPanel";
import { RightRail } from "./components/RightRail";
import { SelectionForm } from "./components/SelectionForm";
import { SelectionGraph } from "./components/SelectionGraph";
import { StartScenario } from "./components/StartScenario";
import { initialContext, results as catalog } from "./domain/mockData";
import { calculateResults, sortResults } from "./domain/selectionEngine";
import type {
  PumpResult,
  PurposePreset,
  ResultTab,
  SelectionContext,
  SelectionMode,
  SelectorScreen,
  SortMode,
} from "./domain/types";
import { readBitrixSelectorPayload } from "./services/bitrixSelectorAdapter";
import {
  getPurposePumpTypes,
  isPumpTypeAllowed,
} from "./domain/purposeCompatibility";
const loadContext = () => {
  try {
    return JSON.parse(
      localStorage.getItem("apgs-selection-context") || "null",
    ) as SelectionContext | null;
  } catch {
    return null;
  }
};
const loadCompared = () => {
  try {
    return JSON.parse(
      localStorage.getItem("apgs-compared") || "[]",
    ) as string[];
  } catch {
    return [];
  }
};
export default function App() {
  const payload = readBitrixSelectorPayload(),
    initial = { ...initialContext, ...loadContext(), ...payload.context };
  const [screen, setScreen] = useState<SelectorScreen>("start"),
    [mode, setMode] = useState<SelectionMode>("qh"),
    [draft, setDraft] = useState<SelectionContext>(initial),
    [context, setContext] = useState<SelectionContext>(initial),
    [tab, setTab] = useState<ResultTab>("recommended"),
    [sort, setSort] = useState<SortMode>("score"),
    [compared, setCompared] = useState<string[]>(loadCompared),
    [notice, setNotice] = useState(""),
    [dialog, setDialog] = useState<
      HeaderAction | "details" | "assistant" | null
    >(null),
    [details, setDetails] = useState<PumpResult | null>(null),
    [quoteCompany, setQuoteCompany] = useState(""),
    [allowedPumpTypes, setAllowedPumpTypes] = useState<string[] | null>(null);
  const resultsRef = useRef<HTMLElement | null>(null),
    dialogRef = useRef<HTMLElement | null>(null),
    eligibleCatalog = catalog.filter((pump) =>
      isPumpTypeAllowed(pump.pumpType, allowedPumpTypes),
    ),
    items = sortResults(calculateResults(eligibleCatalog, context), sort);
  useEffect(() => {
    if (!dialog) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDialog(null);
    };
    window.addEventListener("keydown", onKeyDown);
    window.setTimeout(() => dialogRef.current?.focus(), 0);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialog]);
  function selectMode(next: SelectionMode) {
    setAllowedPumpTypes(null);
    setMode(next);
    if (next === "qh") setScreen("parameters");
    if (next === "purpose") setScreen("purpose");
    if (next === "model") setScreen("model");
    if (next === "assistant") setDialog("assistant");
  }
  function applyPurpose(preset: PurposePreset) {
    const allowed = getPurposePumpTypes(preset.id);
    const preferred = String(
      preset.context.pumpType || allowed[0] || draft.pumpType,
    );
    const next = {
      ...draft,
      ...preset.context,
      pumpType: allowed.includes(preferred) ? preferred : allowed[0],
    };
    const allowedIds = new Set(
      catalog
        .filter((pump) => allowed.includes(pump.pumpType))
        .map((pump) => pump.id),
    );
    setCompared((current) => {
      const nextCompared = current.filter((id) => allowedIds.has(id));
      localStorage.setItem("apgs-compared", JSON.stringify(nextCompared));
      return nextCompared;
    });
    setAllowedPumpTypes(allowed);
    setDraft(next);
    setMode("purpose");
    setScreen("parameters");
    setNotice(
      `Выбрано: ${preset.object} · ${preset.medium}. Доступно типов насосов: ${allowed.length}.`,
    );
  }
  function calculate() {
    setContext(draft);
    localStorage.setItem("apgs-selection-context", JSON.stringify(draft));
    const next = calculateResults(eligibleCatalog, draft);
    setTab(
      (["recommended", "suitable", "possible"] as ResultTab[]).find((level) =>
        next.some((pump) => pump.level === level),
      ) || "excluded",
    );
    setScreen("results");
    setNotice(
      `Подбор обновлён: ${draft.pumpType} · Q ${draft.q} м³/ч · H ${draft.h} м`,
    );
    window.setTimeout(
      () =>
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  }
  function reset() {
    const resetContext = {
      ...initialContext,
      pumpType: allowedPumpTypes?.includes(initialContext.pumpType)
        ? initialContext.pumpType
        : allowedPumpTypes?.[0] || initialContext.pumpType,
    };
    setDraft(resetContext);
    setContext(resetContext);
    localStorage.setItem(
      "apgs-selection-context",
      JSON.stringify(resetContext),
    );
    setTab("recommended");
    setNotice("Параметры сброшены до исходных значений");
  }
  function toggle(id: string) {
    setCompared((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length < 3
          ? [...current, id]
          : current;
      localStorage.setItem("apgs-compared", JSON.stringify(next));
      if (current.length >= 3 && !current.includes(id))
        setNotice("Можно сравнить не более трёх моделей");
      return next;
    });
  }
  function openCard(pump: PumpResult) {
    localStorage.setItem("apgs-selection-context", JSON.stringify(context));
    localStorage.setItem("apgs-selected-pump", JSON.stringify(pump));
    window.dispatchEvent(
      new CustomEvent("apgs:open-product", {
        detail: { productId: pump.id, context },
      }),
    );
    const configured = payload.endpoints?.product;
    if (configured) {
      window.location.href = configured.replace(
        "{xmlId}",
        encodeURIComponent(pump.id),
      );
      return;
    }
    setNotice(
      `Выбрана ${pump.name}. Bitrix откроет карточку по XML_ID ${pump.id}.`,
    );
  }
  function action(value: HeaderAction) {
    if (value === "selection") {
      setScreen("start");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (value === "catalog") {
      setNotice("Переход в каталог подключается через настройки Bitrix.");
      return;
    }
    setDialog(value);
  }
  const showDetails = (pump: PumpResult) => {
      setDetails(pump);
      setDialog("details");
    },
    scenarioLabel =
      mode === "qh"
        ? "Q/H"
        : mode === "purpose"
          ? "по назначению"
          : mode === "model"
            ? "по модели"
            : "с помощником",
    working = screen === "parameters" || screen === "results";
  return (
    <div className={`selector-app ${working ? "has-selection-dock" : ""}`}>
      <Header compareCount={compared.length} onAction={action} />
      {notice && (
        <div className="toast" role="status">
          {notice}
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}
      {screen === "start" && <StartScenario onSelect={selectMode} />}{" "}
      {screen === "purpose" && (
        <PurposeStep
          onBack={() => setScreen("start")}
          onSelect={applyPurpose}
        />
      )}{" "}
      {screen === "model" && (
        <ModelSearchStep
          items={items}
          onBack={() => setScreen("start")}
          onOpen={openCard}
        />
      )}{" "}
      {working && (
        <>
          <main className="selector-grid">
            <SelectionForm
              context={draft}
              allowedPumpTypes={allowedPumpTypes}
              onChange={setDraft}
              onSubmit={calculate}
              onReset={reset}
            />
            <section className="selection-content" ref={resultsRef}>
              <SelectionGraph
                context={context}
                items={items}
                onContextChange={(next) => {
                  setContext(next);
                  setDraft(next);
                  localStorage.setItem(
                    "apgs-selection-context",
                    JSON.stringify(next),
                  );
                }}
              />
              <ResultsPanel
                items={items}
                context={context}
                tab={tab}
                sort={sort}
                compared={compared}
                onTab={setTab}
                onSort={setSort}
                onCompare={toggle}
                onOpen={openCard}
                onDetails={showDetails}
              />
            </section>
            <RightRail
              items={items}
              compared={compared}
              onRemove={toggle}
              onComparison={() => setDialog("comparison")}
              onOpen={openCard}
              onPurpose={() => {
                setAllowedPumpTypes(null);
                setMode("purpose");
                setScreen("purpose");
              }}
            />
          </main>
          <div className="selection-dock">
            <div>
              <span>Рабочая точка</span>
              <b>
                Q {draft.q} м³/ч · H {draft.h} м
              </b>
              <small>{draft.pumpType}</small>
            </div>
            <button className="dock-restart" onClick={() => setScreen("start")}>
              Сценарий: {scenarioLabel}
            </button>
            <button
              className="dock-submit"
              onClick={calculate}
              disabled={draft.q <= 0 || draft.h <= 0 || !draft.dn}
            >
              Подобрать насос
            </button>
          </div>
        </>
      )}
      {dialog && (
        <div className="dialog-backdrop" onMouseDown={() => setDialog(null)}>
          <section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            tabIndex={-1}
            className="demo-dialog"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="dialog-close"
              aria-label="Закрыть окно"
              onClick={() => setDialog(null)}
            >
              ×
            </button>
            <h2 id="dialog-title">
              {dialog === "specification"
                ? "Спецификация"
                : dialog === "comparison"
                  ? "Сравнение"
                  : dialog === "quote"
                    ? "Получить КП"
                    : dialog === "assistant"
                      ? "Инженерный помощник"
                      : "Подробности модели"}
            </h2>
            {dialog === "comparison" ? (
              compared.length ? (
                items
                  .filter((item) => compared.includes(item.id))
                  .map((item) => (
                    <p key={item.id}>
                      <b>{item.name}</b> — {item.score}%
                    </p>
                  ))
              ) : (
                <p>Добавьте насосы к сравнению в результатах.</p>
              )
            ) : dialog === "specification" ? (
              <p>
                Спецификация пока пуста. Откройте карточку насоса и добавьте
                позицию.
              </p>
            ) : dialog === "quote" ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setDialog(null);
                  setNotice("Заявка на КП сохранена в демо-режиме");
                }}
              >
                <label className="dialog-field">
                  <span>Имя *</span>
                  <input required name="name" autoComplete="name" />
                </label>
                <label className="dialog-field">
                  <span>Телефон *</span>
                  <input required type="tel" name="phone" autoComplete="tel" />
                </label>
                <label className="dialog-field">
                  <span>
                    {"\u041a\u043e\u043c\u043f\u0430\u043d\u0438\u044f"}
                  </span>
                  <input
                    name="company"
                    autoComplete="organization"
                    value={quoteCompany}
                    onChange={(event) => setQuoteCompany(event.target.value)}
                  />
                </label>
                {quoteCompany.trim() && (
                  <label className="dialog-field">
                    <span>{"\u0418\u041d\u041d"}</span>
                    <input name="inn" inputMode="numeric" />
                  </label>
                )}
                <button className="button primary">Отправить заявку</button>
              </form>
            ) : dialog === "assistant" ? (
              <>
                <p>
                  ИИ-помощник только уточнит назначение, среду и исходные параметры. Инженерный расчёт выполняется алгоритмом; затем он
                  передаст параметры в подборщик.
                </p>
                <button
                  className="button primary"
                  onClick={() => {
                    setDialog(null);
                    setScreen("purpose");
                  }}
                >
                  Начать с назначения
                </button>
              </>
            ) : (
              <>
                <p>
                  <b>{details?.name}</b>
                </p>
                <p>
                  {details?.exclusionReason || details?.reasons.join(" · ")}
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
