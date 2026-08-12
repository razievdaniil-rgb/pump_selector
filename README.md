# APGS Pump Selector

Самостоятельный React-виджет программы подбора насосов для интеграции в 1С-Битрикс.

## Что реализовано

- стартовые сценарии: по Q/H, по назначению, по модели;
- простой путь «Котельная → горячая вода» и другие тестовые назначения;
- выбор типа насоса и инженерных параметров;
- Match Score, Verdict, причины рекомендаций и исключения;
- сравнение до трёх моделей;
- адаптивная Q-H визуализация и сквозной Context;
- закреплённая кнопка подбора и автоматический переход к результатам;
- адаптер для передачи Context и URL карточки из Bitrix.

Сейчас каталог и расчёты работают на моковых данных. Реальные товары, остатки, цены и кривые подключаются на этапе интеграции с API Bitrix.

## Локальный запуск

Требуется Node.js 20+.

```bash
npm ci
npm run dev
```

Проверка перед передачей:

```bash
npm run build
npm run lint
```

## Production-сборка

```bash
npm ci
npm run build
```

Готовые файлы появятся в каталоге `dist/`:

```text
dist/
├── index.html
├── apgs-pump-selector.css
└── apgs-pump-selector.js
```

Для Bitrix нужны `apgs-pump-selector.css`, `apgs-pump-selector.js` и изображение насоса из `public/pump.png`.

## Развёртывание в 1С-Битрикс

Ниже приведён вариант интеграции как React-виджета в существующий шаблон Bitrix. Изменять ядро Bitrix не требуется.

### 1. Скопировать собранные файлы

Создайте каталог в активном шаблоне сайта:

```text
/local/templates/<имя_шаблона>/assets/apgs-pump-selector/
```

Скопируйте туда:

```text
apgs-pump-selector.css
apgs-pump-selector.js
pump.png
```

Рекомендуемая итоговая структура:

```text
/local/templates/<имя_шаблона>/assets/apgs-pump-selector/
├── apgs-pump-selector.css
├── apgs-pump-selector.js
└── pump.png
```

### 2. Создать страницу подборщика

Например, файл `/pumpselect/index.php`:

```php
<?php
require($_SERVER['DOCUMENT_ROOT'].'/bitrix/header.php');
$APPLICATION->SetTitle('Программа подбора насосов');

$templatePath = SITE_TEMPLATE_PATH.'/assets/apgs-pump-selector';
?>

<div id="apgs-pump-selector"></div>

<script>
window.APGSPumpSelectorData = {
  context: {},
  endpoints: {
    search: '/local/api/pumps/search.php',
    product: '/catalog/pumps/{xmlId}/'
  }
};
</script>

<link rel="stylesheet" href="<?=htmlspecialcharsbx($templatePath)?>/apgs-pump-selector.css?v=1">
<script type="module" src="<?=htmlspecialcharsbx($templatePath)?>/apgs-pump-selector.js?v=1"></script>

<?php require($_SERVER['DOCUMENT_ROOT'].'/bitrix/footer.php'); ?>
```

Виджет ищет контейнер `#apgs-pump-selector`. Для изолированной страницы также поддерживается `#root`, но в Bitrix рекомендуется использовать отдельный ID.

### 3. Подключение через Asset API Bitrix

Если скрипты принято подключать из шаблона или компонента, используйте Asset API:

```php
<?php
use Bitrix\Main\Page\Asset;

$assetPath = SITE_TEMPLATE_PATH.'/assets/apgs-pump-selector';
Asset::getInstance()->addCss($assetPath.'/apgs-pump-selector.css');
Asset::getInstance()->addJs($assetPath.'/apgs-pump-selector.js');
?>

<div id="apgs-pump-selector"></div>
```

Важно: production-файл является ES-модулем. Если текущий Asset API выводит обычный `<script>` без `type="module"`, JavaScript лучше подключить вручную, как в предыдущем примере.

### 4. Передать настройки из Bitrix

Настройки должны быть объявлены до подключения `apgs-pump-selector.js`:

```html
<script>
window.APGSPumpSelectorData = {
  context: {
    q: 32.4,
    h: 48.5,
    fluid: 'Вода чистая',
    temperature: 20,
    density: 998,
    viscosity: 1,
    dn: 'DN50 / DN50',
    pn: 'PN16'
  },
  endpoints: {
    search: '/local/api/pumps/search.php',
    product: '/catalog/pumps/{xmlId}/'
  }
};
</script>
```

`context` необязателен. Если пользователь пришёл без Q/H, можно передать пустой объект.

`product` — шаблон URL карточки товара. Перед переходом `{xmlId}` заменяется на XML_ID выбранной модели, например `RFZ-026347`.

### 5. Связать переход с карточкой

Перед открытием карточки виджет генерирует событие `apgs:open-product`:

```js
window.addEventListener('apgs:open-product', (event) => {
  const { productId, context } = event.detail;
  console.log(productId, context);
});
```

Это позволяет Bitrix-разработчику:

- сформировать собственный URL карточки;
- сохранить Q/H Context в сессии;
- передать параметры в карточку через query string;
- отправить событие в аналитику.

Context также сохраняется в `localStorage` под ключом `apgs-selection-context`.

### 6. Подключить реальные данные

Сейчас источник данных находится в:

```text
src/domain/mockData.ts
```

Для production необходимо заменить моковый каталог вызовом API. Рекомендуемая точка подключения:

```text
src/services/bitrixSelectorAdapter.ts
```

Минимально API поиска должно возвращать для каждой модели:

```json
{
  "id": "RFZ-026347",
  "name": "APGS-InLine 50-200/5.5",
  "article": "APGS-IL-50200-55",
  "power": 5.5,
  "efficiency": 78.2,
  "dn": "DN50 / PN16",
  "minQ": 12,
  "maxQ": 80,
  "minH": 18,
  "maxH": 72
}
```

Идентификатор товара — `XML_ID` формата `RFZ-XXXXXX`.

### 7. Подключить кривые насосов

В Bitrix используется свойство `PMP_CURVES_JSON`. Сейчас оно содержит идентификаторы кривых вида:

```text
curve-RFZ-026347-QH-v1
```

Поддерживаемые типы:

- `QH`: точки `q`, `h`;
- `EFF`: точки `q`, `eff`;
- `POWER`: точки `q`, `power`;
- `NPSH`: точки `q`, `npsh`.

Единицы измерения:

- `units.x`: `m3/h`;
- QH и NPSH: `m`;
- EFF: `%`;
- POWER: `kW`.

Связь выполняется по `product_id`, который равен XML_ID товара. BEP рассчитывается на фронтенде как точка максимального значения кривой EFF.

### 8. Очистить кеш Bitrix

После замены CSS или JavaScript:

1. увеличьте параметр версии в URL, например `?v=2`;
2. очистите управляемый кеш Bitrix;
3. при необходимости очистите кеш композита;
4. проверьте страницу в приватном окне браузера.

### 9. Чеклист после интеграции

- страница открывается без ошибок в Console;
- CSS и JavaScript возвращают HTTP 200;
- интерфейс корректен на 360, 390, 768, 1280 и 1440 px;
- подбор пересчитывается после изменения Q/H;
- кнопка «Подобрать насос» доступна при прокрутке;
- выбранный Context сохраняется при переходе в карточку;
- переход строится по XML_ID выбранного товара;
- причины исключения показываются для неподходящих моделей;
- сравнение сохраняет не более трёх моделей;
- API корректно обрабатывает пустой результат и ошибку запроса.

## GitHub Pages

Демо автоматически публикуется после push в ветку `main`:

https://razievdaniil-rgb.github.io/pump_selector/
