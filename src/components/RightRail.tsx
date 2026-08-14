import type { PumpResult } from '../domain/types';

export function RightRail({ items, onOpen, onPurpose }: { items: PumpResult[]; compared: string[]; onRemove: (id: string) => void; onComparison: () => void; onOpen: (pump: PumpResult) => void; onPurpose: () => void }) {
  const analogs = items.filter((item) => item.level !== 'excluded').slice(1, 3);
  return <aside className="right-rail">
    <section className="side-card card analog-equipment"><div className="panel-title">Аналогичное оборудование</div>{analogs.length ? analogs.map((pump) => <button className="analog-row" key={pump.id} onClick={() => onOpen(pump)}><span><b>{pump.name}</b><small>{pump.article}</small></span><em>{pump.score}%</em></button>) : <p className="comparison-empty">Аналоги появятся после расчёта.</p>}<small className="analog-note">Модели с близкой рабочей точкой, но другим запасом или КПД.</small></section>
    <section className="help-card card"><div className="engineer-avatar">ИИ</div><div><strong>Не знаете исходные параметры?</strong><p>Помощник переведёт описание задачи в Q/H, тип насоса и среду. Сам инженерный расчёт выполняется отдельно, без участия ИИ.</p><button type="button" onClick={onPurpose}>Уточнить задачу</button></div></section>
    <section className="side-card next card"><h3>Что дальше?</h3>{['Выберите подходящий насос','Откройте карточку','Добавьте в спецификацию'].map((text,index)=><div key={text}><i>{index+1}</i><p><b>{text}</b><small>{index===0?'Сравните вердикты и кривые':index===1?'Проверьте характеристики и TCO':'Сформируйте коммерческое предложение'}</small></p></div>)}</section>
  </aside>;
}