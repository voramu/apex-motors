// =========================================================
// APEX MOTORS — script.js
// =========================================================

let data = {};
let activeBrand = 'mercedes'; // открытая вкладка
let switchTimer = null;

const brandNames = {
  mercedes: 'Mercedes-Benz',
  bmw: 'BMW',
  porsche: 'Porsche'
};

// Названия цветов для подписи «Цвет: …» в окне
const colorNames = {
  '#0B0B0D': 'Obsidian Black',
  '#C7C9CC': 'Iridium Silver',
  '#2E3A4E': 'Cavansite Blue',
  '#5B5D5F': 'Graphite Grey',
  '#F4F5F6': 'Polar White',
  '#4A4E52': 'Selenite Grey',
  '#1C2331': 'Midnight Navy',
  '#7A2E2E': 'Hyacinth Red',
  '#3A4A3F': 'Emerald Green',
  '#1C2A45': 'Carbon Blue',
  '#2E5BFF': 'Portimao Blue',
  '#3A9B5C': 'Isle of Man Green',
  '#C7352E': 'Guards Red',
  '#F2C230': 'Racing Yellow',
  '#3A2E4E': 'Amethyst Metallic',
  '#1C4532': 'Python Green',
  '#4E9BB8': 'Frozen Blue'
};

const photoIcon = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2.5"/>
    <circle cx="9" cy="9" r="2"/>
    <path d="m21 15-4.5-4.5L6 21"/>
  </svg>`;

// Фото + заглушка: если картинки нет — остаётся заглушка
function photoHtml(car, extra) {
  return `
    <img src="${car.image}" alt="${car.title}"
         onload="this.parentElement.classList.add('has-img')"
         onerror="this.remove()">
    <div class="photo-placeholder">
      ${photoIcon}
      <span>Фото: ${car.title}${extra || ''}</span>
      <small>or <u>browse files</u></small>
    </div>`;
}

function formatPrice(price) {
  return '$' + price.toLocaleString('en-US');
}

function plural(n, one, few, many) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
  return many;
}

// ---------- Часть 1. Загрузка данных ----------
axios.get('data/data.json')
  .then(function (response) {
    data = response.data;
    console.log(data);
    moveIndicator();
    renderCards(activeBrand);
  })
  .catch(function (error) {
    console.error('Не удалось загрузить data.json:', error);
    document.querySelector('.cards').innerHTML =
      '<p class="load-error">Не удалось загрузить данные. Откройте проект через Live Server.</p>';
  });

// ---------- Часть 2. Вкладки ----------
const tabs = document.querySelectorAll('.tab');
const indicator = document.querySelector('.tabs-indicator');

for (let i = 0; i < tabs.length; i++) {
  tabs[i].addEventListener('click', function () {
    const brand = tabs[i].dataset.brand;
    if (brand === activeBrand) return;

    activeBrand = brand;

    for (let j = 0; j < tabs.length; j++) {
      tabs[j].classList.remove('active');
    }
    tabs[i].classList.add('active');
    moveIndicator();

    switchBrand(brand);
  });
}

// Подложка активной вкладки плавно переезжает под кнопку
function moveIndicator() {
  const active = document.querySelector('.tab.active');
  indicator.style.width = active.offsetWidth + 'px';
  indicator.style.transform = 'translateX(' + (active.offsetLeft - 5) + 'px)';
}

window.addEventListener('resize', moveIndicator);

// Плавная смена: старые карточки уходят, новые появляются
function switchBrand(brand) {
  const cardsBox = document.querySelector('.cards');
  const hero = document.querySelector('.hero');

  clearTimeout(switchTimer);
  cardsBox.classList.add('leaving');
  hero.classList.add('switching');

  switchTimer = setTimeout(function () {
    cardsBox.classList.remove('leaving');
    hero.classList.remove('switching');
    renderCards(brand);
  }, 320);
}

// ---------- Часть 3. Сетка карточек ----------
function renderCards(brand) {
  const cars = data[brand];
  let html = '';

  for (let i = 0; i < cars.length; i++) {
    const car = cars[i];

    let badge = '';
    if (car.count === 1) {
      badge = '<span class="badge">Осталась 1</span>';
    }

    const colors = car.availableColors.length;

    html = html + `
      <div class="card" style="--i:${i}" onclick="openModal('${brand}', ${i})">
        ${badge}
        <div class="photo">${photoHtml(car)}</div>
        <div class="card-body">
          <h3 class="card-title">${car.title}</h3>
          <p class="card-meta">${colors} ${plural(colors, 'цвет', 'цвета', 'цветов')} · в наличии ${car.count} шт.</p>
          <div class="card-footer">
            <p class="price">${formatPrice(car.price)}</p>
            <button class="btn" onclick="event.stopPropagation(); orderCar('${brand}', ${i})">Заказать</button>
          </div>
        </div>
      </div>
    `;
  }

  document.querySelector('.cards').innerHTML = html;

  // Заголовок и счётчик моделей
  document.querySelector('.hero-title').textContent = brandNames[brand];
  document.querySelector('.hero-count').textContent =
    cars.length + ' ' + plural(cars.length, 'модель', 'модели', 'моделей') + ' в салоне';
}

// ---------- Часть 4. Окно с деталями ----------
const modal = document.querySelector('.modal');
let modalCar = null;

function openModal(brand, index) {
  const car = data[brand][index];
  modalCar = car;

  // Кружки цветов — цикл с накоплением
  let colorsHtml = '';
  for (let i = 0; i < car.availableColors.length; i++) {
    const color = car.availableColors[i];
    colorsHtml = colorsHtml + `
      <span class="color-dot ${i === 0 ? 'active' : ''}"
            style="background: ${color}"
            title="${colorNames[color] || color}"
            onclick="selectColor(this, '${color}')"></span>
    `;
  }

  modal.querySelector('.modal-media').className = 'modal-media photo';
  modal.querySelector('.modal-media').innerHTML = photoHtml(car, ', крупно');
  modal.querySelector('.modal-eyebrow').textContent = car.title.split(' ')[0] + ' · 2026';
  modal.querySelector('.modal-title').textContent = car.title;
  modal.querySelector('.modal-price').textContent = formatPrice(car.price);
  modal.querySelector('.modal-desc').textContent = car.description;
  modal.querySelector('.stock-count').textContent = car.count + ' шт.';
  modal.querySelector('.modal-colors').innerHTML = colorsHtml;
  modal.querySelector('.modal-color-name').textContent =
    colorNames[car.availableColors[0]] || car.availableColors[0];

  modal.querySelector('.modal-window').scrollTop = 0;
  modal.classList.add('open');
  document.body.classList.add('no-scroll');
}

function closeModal() {
  modal.classList.remove('open');
  document.body.classList.remove('no-scroll');
}

function selectColor(dot, color) {
  const dots = modal.querySelectorAll('.color-dot');
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.remove('active');
  }
  dot.classList.add('active');
  modal.querySelector('.modal-color-name').textContent = colorNames[color] || color;
}

function orderCar(brand, index) {
  alert('Заявка на ' + data[brand][index].title + ' принята!');
}

// Закрытие: крестик, клик по фону, Esc
modal.querySelector('.modal-close').addEventListener('click', closeModal);
modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

// Кнопка «Заказать» в окне
modal.querySelector('.modal-order').addEventListener('click', function () {
  const color = modal.querySelector('.modal-color-name').textContent;
  alert('Заявка на ' + modalCar.title + ' (' + color + ') принята!');
});
