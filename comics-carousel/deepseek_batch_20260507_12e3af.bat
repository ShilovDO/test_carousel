@echo off
REM API сервисы
type nul > src\services\api.js

REM Redux store
type nul > src\store\index.js
type nul > src\store\slices\carouselSlice.js
type nul > src\store\slices\settingsSlice.js
type nul > src\store\slices\resultSlice.js

REM Компоненты
type nul > src\components\Common\Loading.js
type nul > src\components\Common\ErrorMessage.js
type nul > src\components\Common\ProtectedRoute.js
type nul > src\components\Carousel\ImageCarousel.js
type nul > src\components\Carousel\CarouselCounter.js

REM Страницы
type nul > src\pages\ShowPage.js
type nul > src\pages\SettingsPage.js
type nul > src\pages\ResultPage.js
type nul > src\pages\AdminPage.js

echo Файлы созданы!
pause