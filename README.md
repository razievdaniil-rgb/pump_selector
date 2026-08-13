# APGS Pump Selector

React-виджет программы подбора насосов для последующего встраивания в 1С-Битрикс.

## Что уже работает

- начало подбора по Q/H, назначению или известной модели;
- выбор типа насоса внутри основной формы;
- проверка рабочей точки и вывод трёх вердиктов;
- причины рекомендации и исключения;
- Q-H график, сравнение до трёх моделей и сквозной Context;
- адаптивная версия и закреплённая кнопка подбора;
- переход в карточку по XML_ID через настраиваемый URL.

Сейчас товары и расчёты демонстрируются на тестовых данных из `src/domain/mockData.ts`. Живой поиск по каталогу, цены, остатки и числовые точки кривых появятся после подключения API.

## Быстрый запуск на компьютере

Понадобится Node.js 20 или новее.

1. Откройте терминал в папке проекта.
2. Установите зависимости:

   ```bash
   npm ci
   ```

3. Запустите проект:

   ```bash
   npm run dev
   ```

4. Откройте адрес, который покажет Vite, обычно `http://localhost:5173/`.

## Проверка и сборка

Перед передачей выполните:

```bash
npm run lint
npm run build
```

После сборки папка `dist/` выглядит примерно так:

```text
dist/
├── index.html
├── apgs-pump-selector.<hash>.css
├── apgs-pump-selector.<hash>.js
└── pump.png
```

`<hash>` меняется при каждой новой сборке. Точные имена CSS и JS нужно брать из созданного `dist/index.html`.

## Простая установка в Bitrix

### Шаг 1. Соберите проект

```bash
npm ci
npm run build
```

### Шаг 2. Скопируйте готовые файлы

Создайте папку:

```text
/local/templates/<имя_шаблона>/assets/apgs-pump-selector/
```

Скопируйте туда из `dist/`:

- файл `apgs-pump-selector.<hash>.css`;
- файл `apgs-pump-selector.<hash>.js`;
- `pump.png`.

Не переименовывайте только один файл: имена в HTML должны совпадать с реальными именами после сборки.

### Шаг 3. Создайте страницу `/pumpselect/`

Пример `/pumpselect/index.php`:

```php
<?php
require($_SERVER['DOCUMENT_ROOT'].'/bitrix/header.php');
$APPLICATION->SetTitle('Программа подбора насосов');

$widgetUrl = SITE_TEMPLATE_PATH.'/assets/apgs-pump-selector';
?>

<div id="apgs-pump-selector"></div>

<script>
window.APGSPumpSelectorData = {
  assetsBase: '<?=CUtil::JSEscape($widgetUrl)?>',
  context: {},
  endpoints: {
    product: '/catalog/pumps/{xmlId}/'
  }
};
</script>

<link rel="stylesheet" href="<?=htmlspecialcharsbx($widgetUrl)?>/apgs-pump-selector.ВАШ_HASH.css">
<script type="module" src="<?=htmlspecialcharsbx($widgetUrl)?>/apgs-pump-selector.ВАШ_HASH.js"></script>

<?php require($_SERVER['DOCUMENT_ROOT'].'/bitrix/footer.php'); ?>
```

Замените `ВАШ_HASH` на значение из текущей папки `dist/`.

Важно:

- настройки `window.APGSPumpSelectorData` должны находиться выше подключения JavaScript;
- JavaScript подключается с `type="module"`;
- `assetsBase` нужен, чтобы изображения загружались из папки шаблона;
- ядро Bitrix изменять не требуется.

### Шаг 4. Укажите настоящий URL карточки

```js
endpoints: {
  product: '/catalog/pumps/{xmlId}/'
}
```

При клике `{xmlId}` заменится на XML_ID товара, например `RFZ-026347`.

Если структура URL на сайте другая, измените только этот шаблон.

### Шаг 5. При необходимости передайте исходный Context

```js
context: {
  q: 32.4,
  h: 48.5,
  pumpType: 'Центробежный In-Line',
  fluid: 'Вода чистая',
  temperature: 20,
  density: 998,
  viscosity: 1,
  dn: 'DN50 / DN50',
  pn: 'PN16',
  material: 'Чугун',
  seal: 'Механическое уплотнение'
}
```

Context необязателен. При пустом объекте пользователь начнёт новый подбор.

## Как виджет передаёт выбор в карточку

Перед переходом виджет:

1. сохраняет Context в `localStorage` под ключом `apgs-selection-context`;
2. сохраняет выбранный товар под ключом `apgs-selected-pump`;
3. отправляет событие `apgs:open-product`;
4. открывает URL из `endpoints.product`.

Событие можно перехватить:

```js
window.addEventListener('apgs:open-product', event => {
  const { productId, context } = event.detail;
  console.log(productId, context);
});
```

## Что требуется для живых данных

Текущая сборка готова к размещению как интерфейс, но пока работает на моках. Для production-интеграции нужны:

1. API поиска товаров или серверная передача каталога из Bitrix;
2. реальные поля товара: XML_ID, название, артикул, тип, Q/H, мощность, КПД, DN/PN и другие характеристики;
3. числовые точки кривых;
4. реальные URL карточек;
5. обработка загрузки, пустого ответа и ошибки API.

Рекомендуемая точка подключения API — `src/services/bitrixSelectorAdapter.ts`. Поле `endpoints.search` зарезервировано в настройках, но автоматический HTTP-запрос к нему ещё не реализован.

Минимальная структура товара:

```json
{
  "id": "RFZ-026347",
  "name": "APGS-InLine 50-200/5.5",
  "article": "APGS-IL-50200-55",
  "pumpType": "Центробежный In-Line",
  "power": 5.5,
  "efficiency": 78.2,
  "dn": "DN50 / PN16",
  "minQ": 12,
  "maxQ": 80,
  "minH": 18,
  "maxH": 72
}
```

Идентификатор `id` должен соответствовать XML_ID формата `RFZ-XXXXXX`.

## Формат инженерных кривых

В Bitrix используется свойство `PMP_CURVES_JSON`. Сейчас там находятся ID кривых вида `curve-RFZ-026347-QH-v1`; числовые точки будут переданы отдельно на этапе интеграции.

- `QH`: точки `q`, `h`;
- `EFF`: точки `q`, `eff`;
- `POWER`: точки `q`, `power`;
- `NPSH`: точки `q`, `npsh`.

Единицы:

- `units.x` — `m3/h`;
- `QH` и `NPSH` — `m`;
- `EFF` — `%`;
- `POWER` — `kW`.

Кривые связываются с товаром по `product_id = XML_ID`. BEP рассчитывается на фронтенде как точка максимального значения кривой EFF.

## После обновления файлов

1. Скопируйте новые файлы из `dist/`.
2. Обновите их имена в `/pumpselect/index.php`.
3. Очистите управляемый кеш и кеш композита Bitrix.
4. Откройте страницу в приватном окне.

## Чеклист после установки

- CSS, JS и `pump.png` возвращают HTTP 200;
- в Console нет ошибок;
- интерфейс корректен на 360, 390, 768, 1280 и 1440 px;
- Q/H очищаются и вводятся без ведущего нуля;
- при нулевом Q/H кнопка подбора заблокирована;
- выбор типа насоса влияет на результаты;
- закреплённая панель не перекрывает контент;
- переход в карточку строится по XML_ID;
- Context сохраняется при переходе;
- сравнение принимает не более трёх моделей;
- неподходящие модели показывают конкретную причину.

## Демо

https://razievdaniil-rgb.github.io/pump_selector/
