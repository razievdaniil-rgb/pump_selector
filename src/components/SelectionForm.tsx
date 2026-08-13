import { useEffect, useRef, useState } from "react";
import { initialContext, pumpTypes } from "../domain/mockData";
import type { SelectionContext } from "../domain/types";
import { Icon } from "./Icon";
type Key = keyof SelectionContext;
function NumberField({
  label,
  field,
  value,
  suffix,
  onChange,
  invalid,
}: {
  label: string;
  field: Key;
  value: number;
  suffix: string;
  onChange: (key: Key, value: number) => void;
  invalid?: boolean;
}) {
  const [draft, setDraft] = useState(String(value)),
    editing = useRef(false);
  useEffect(() => {
    if (editing.current) return;
    const timer = window.setTimeout(() => setDraft(String(value)), 0);
    return () => window.clearTimeout(timer);
  }, [value]);
  return (
    <label className={`form-field ${invalid ? "invalid" : ""}`}>
      <span>{label}</span>
      <div className="input-shell">
        <input
          type="text"
          inputMode="decimal"
          value={draft}
          aria-invalid={invalid || undefined}
          onFocus={(event) => {
            editing.current = true;
            event.currentTarget.select();
          }}
          onChange={(event) => {
            const next = event.target.value.replace(",", ".");
            if (!/^\d*(\.\d*)?$/.test(next)) return;
            setDraft(next);
            onChange(field, next === "" || next === "." ? 0 : Number(next));
          }}
          onBlur={() => {
            editing.current = false;
            if (draft === "" || draft === ".") setDraft("");
          }}
        />
        <em>{suffix}</em>
      </div>
    </label>
  );
}
function SelectField({
  label,
  field,
  value,
  options,
  onChange,
}: {
  label: string;
  field: Key;
  value: string;
  options: string[];
  onChange: (key: Key, value: string) => void;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <div className="input-shell">
        <select
          value={value}
          onChange={(event) => onChange(field, event.target.value)}
        >
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <Icon name="down" size={14} />
      </div>
    </label>
  );
}
export function SelectionForm({
  context,
  allowedPumpTypes,
  onChange,
  onSubmit,
  onReset,
}: {
  context: SelectionContext;
  allowedPumpTypes: string[] | null;
  onChange: (context: SelectionContext) => void;
  onSubmit: () => void;
  onReset: () => void;
}) {
  const [engineeringOpen, setEngineeringOpen] = useState(false),
    invalid = context.q <= 0 || context.h <= 0;
  const update = (key: Key, value: string | number) =>
    onChange({ ...context, [key]: value });
  const availablePumpTypes = allowedPumpTypes?.length
    ? allowedPumpTypes
        .map((name) => pumpTypes.find(([type]) => type === name))
        .filter((item): item is string[] => Boolean(item))
    : pumpTypes;
  return (
    <aside className="selection-form card">
      <div className="panel-title">
        1. Рабочая точка <Icon name="help" size={15} />
      </div>
      <div className="field-pair duty-fields">
        <NumberField
          label="Расход Q"
          field="q"
          value={context.q}
          suffix="м³/ч"
          onChange={update}
          invalid={context.q <= 0}
        />
        <NumberField
          label="Напор H"
          field="h"
          value={context.h}
          suffix="м"
          onChange={update}
          invalid={context.h <= 0}
        />
      </div>
      {invalid && (
        <p className="field-error" role="alert">
          Укажите расход и напор больше нуля.
        </p>
      )}
      <SelectField
        label="Тип насоса"
        field="pumpType"
        value={context.pumpType}
        options={availablePumpTypes.map(([name]) => name)}
        onChange={update}
      />
      {allowedPumpTypes && (
        <p className="purpose-compatibility-note">
          <Icon name="check" size={14} />
          Показаны только типы, подходящие для выбранного назначения.
        </p>
      )}
      <p className="field-caption">
        Сначала учитываем тип насоса, затем проверяем рабочую точку по Q-H
        кривым.
      </p>
      <h3>Среда и условия работы</h3>
      <SelectField
        label="Перекачиваемая жидкость"
        field="fluid"
        value={context.fluid}
        options={[
          "Вода чистая",
          "Вода техническая",
          "Гликоль 30%",
          "Нефтепродукты",
        ]}
        onChange={update}
      />
      <NumberField
        label="Температура жидкости"
        field="temperature"
        value={context.temperature}
        suffix="°C"
        onChange={update}
      />
      <button
        type="button"
        className="disclosure engineering-disclosure"
        onClick={() => setEngineeringOpen((open) => !open)}
        aria-expanded={engineeringOpen}
      >
        <Icon name="filters" />
        Инженерные параметры<span>DN, PN, материал</span>
        <Icon name="down" size={15} />
      </button>
      {engineeringOpen && (
        <div className="engineering-fields">
          <NumberField
            label="Плотность"
            field="density"
            value={context.density}
            suffix="кг/м³"
            onChange={update}
          />
          <NumberField
            label="Вязкость"
            field="viscosity"
            value={context.viscosity}
            suffix="мм²/с"
            onChange={update}
          />
          <div className="field-pair dn-pn-pair">
            <SelectField
              label="DN (вход / выход)"
              field="dn"
              value={context.dn}
              options={[
                "DN32 / DN32",
                "DN40 / DN40",
                "DN50 / DN50",
                "DN65 / DN65",
              ]}
              onChange={update}
            />
            <SelectField
              label="PN"
              field="pn"
              value={context.pn}
              options={["PN10", "PN16", "PN25"]}
              onChange={update}
            />
          </div>
          <SelectField
            label="Материал проточной части"
            field="material"
            value={context.material}
            options={["Чугун", "Нержавеющая сталь", "Бронза"]}
            onChange={update}
          />
          <SelectField
            label="Тип уплотнения"
            field="seal"
            value={context.seal}
            options={["Механическое уплотнение", "Сальниковое уплотнение"]}
            onChange={update}
          />
        </div>
      )}
      <button
        type="button"
        className="button primary wide inline-select-action"
        onClick={onSubmit}
        disabled={invalid}
      >
        Подобрать насос
      </button>
      <button
        type="button"
        className="button ghost wide"
        onClick={() => {
          onChange(initialContext);
          onReset();
        }}
      >
        Сбросить параметры
      </button>
      <div className="form-hint">
        <Icon name="sparkles" />
        <div>
          <b>Как работает подбор</b>
          <p>
            Система сравнивает заданные Q/H с рабочими диапазонами насосов и
            объясняет каждый вердикт.
          </p>
        </div>
      </div>
    </aside>
  );
}
