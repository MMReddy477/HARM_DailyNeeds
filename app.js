const initialProducts = [
  { id: "STA-001", name: "Classic ruled notebook", category: "Stationery", price: 65, stock: 24, unit: "piece", reorderLevel: 8, size: "A5" },
  { id: "STA-002", name: "Blue ball pens · pack of 5", category: "Stationery", price: 40, stock: 7, unit: "pack", reorderLevel: 8, color: "Blue", size: "Pack of 5" },
  { id: "STA-003", name: "HB pencils · pack of 10", category: "Stationery", price: 55, stock: 18, unit: "pack", reorderLevel: 6, color: "Yellow", size: "Pack of 10" },
  { id: "STA-004", name: "Colour pencils · pack of 12", category: "Stationery", price: 95, stock: 0, unit: "pack", reorderLevel: 5, color: "Multicolor", size: "Pack of 12" },
  { id: "STA-005", name: "A4 paper · 100 sheets", category: "Stationery", price: 75, stock: 12, unit: "pack", reorderLevel: 5, color: "White", size: "100 sheets" },
  { id: "STA-006", name: "White envelopes · pack of 10", category: "Stationery", price: 30, stock: 16, unit: "pack", reorderLevel: 5, color: "White", size: "Pack of 10" },
  { id: "DAI-001", name: "Cow milk 500 ml", category: "Dairy", price: 32, stock: 16, unit: "bottle", reorderLevel: 8, expiry: "2026-11-18" },
  { id: "DAI-002", name: "Farm-fresh curd", category: "Dairy", price: 45, stock: 4, unit: "500 g", reorderLevel: 6, expiry: "2026-11-17" },
  { id: "DAI-003", name: "Salted butter", category: "Dairy", price: 58, stock: 9, unit: "100 g", reorderLevel: 4, expiry: "2026-11-25" },
  { id: "DAI-004", name: "Cow milk 1 litre", category: "Dairy", price: 62, stock: 12, unit: "bottle", reorderLevel: 6 },
  { id: "DAI-005", name: "Farm-fresh curd 1 kg", category: "Dairy", price: 80, stock: 8, unit: "pack", reorderLevel: 4 },
  { id: "DAI-006", name: "Fresh paneer 200 g", category: "Dairy", price: 90, stock: 6, unit: "pack", reorderLevel: 3 },
  { id: "DAI-007", name: "Cool drink 250 ml", category: "Dairy", price: 25, stock: 18, unit: "bottle", reorderLevel: 6 },
  { id: "DAI-008", name: "Ice cream cup 100 ml", category: "Dairy", price: 35, stock: 10, unit: "cup", reorderLevel: 4 }
];

const featuredBrands = [
  { name: "DOMS", category: "Stationery", note: "Stationery", style: "top-brand-doms" },
  { name: "Classmate", category: "Stationery", note: "Stationery", style: "top-brand-classmate" },
  { name: "H.A.R.M", category: null, note: "Our neighbourhood shop", style: "top-brand-harm" }
];
const storageKey = "harm-daily-needs-inventory-v1";
const salesStorageKey = "harm-daily-needs-sales-v1";
const isAdminPage = document.body.dataset.page === "admin";
const rowsElement = document.querySelector("#inventory-rows");
const searchInput = document.querySelector("#search-input");
const searchResults = document.querySelector("#search-results");
const emptyState = document.querySelector("#empty-state");
const adminLink = document.querySelector('.storefront-nav a[href="/admin"]');
const productDialog = document.querySelector("#product-dialog");
const productForm = document.querySelector("#product-form");
const formError = document.querySelector("#form-error");
const saleForms = [
  { category: "Stationery", prefix: "stationery" },
  { category: "Dairy", prefix: "dairy" }
].map(({ category, prefix }) => ({
  category,
  form: document.querySelector(`#${prefix}-sale-form`),
  productSelect: document.querySelector(`#${prefix}-sale-product`),
  quantityInput: document.querySelector(`#${prefix}-sale-quantity`),
  error: document.querySelector(`#${prefix}-sale-error`),
  price: document.querySelector(`#${prefix}-sale-unit-price`),
  available: document.querySelector(`#${prefix}-sale-available-stock`),
  submitButton: document.querySelector(`#${prefix}-record-sale-button`)
})).filter((saleForm) => saleForm.form);
let products = loadProducts();
let sales = loadSales();
let activeCategory = isAdminPage ? "all" : "home";
let activeSearchResult = -1;
let activeStationerySubcategory = "all";
let selectedStationeryColors = new Set();
let selectedStationerySizes = new Set();
let maximumStationeryPrice = Number.POSITIVE_INFINITY;
let catalogSort = "featured";

if (adminLink && window.location.protocol === "file:") {
  adminLink.href = "http://localhost:3000/admin";
  adminLink.title = "Open the protected Admin sign-in on the local shop server";
}

function loadProducts() {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored === null) return [...initialProducts];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed) || !parsed.every(isValidProduct)) {
      throw new Error("Saved inventory has an invalid format.");
    }
    const savedIds = new Set(parsed.map((product) => product.id));
    const existingProducts = parsed.map((product) => {
      const defaults = initialProducts.find((initialProduct) => initialProduct.id === product.id);
      if (!defaults) return product;
      return {
        ...product,
        ...(product.color === undefined && defaults.color ? { color: defaults.color } : {}),
        ...(product.size === undefined && defaults.size ? { size: defaults.size } : {})
      };
    });
    return [...existingProducts, ...initialProducts.filter((product) => !savedIds.has(product.id))];
  } catch (error) {
    console.error("Could not load the saved H.A.R.M inventory:", error);
    return [...initialProducts];
  }
}

function isValidProduct(product) {
  return product !== null
    && typeof product === "object"
    && typeof product.id === "string"
    && typeof product.name === "string"
    && (product.brand === undefined || typeof product.brand === "string")
    && (product.category === "Stationery" || product.category === "Dairy")
    && Number.isFinite(product.price)
    && Number.isFinite(product.stock)
    && Number.isFinite(product.reorderLevel)
    && typeof product.unit === "string"
    && (product.color === undefined || typeof product.color === "string")
    && (product.size === undefined || typeof product.size === "string");
}

function saveProducts() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(products));
    return true;
  } catch (error) {
    console.error("Could not save the H.A.R.M inventory:", error);
    window.alert("Your changes could not be saved in this browser. Check your storage settings and try again.");
    return false;
  }
}

function loadSales() {
  try {
    const stored = localStorage.getItem(salesStorageKey);
    if (stored === null) return [];
    const parsed = JSON.parse(stored);
    const validSales = Array.isArray(parsed) && parsed.every((sale) =>
      sale !== null
      && typeof sale === "object"
      && typeof sale.productId === "string"
      && typeof sale.productName === "string"
      && typeof sale.date === "string"
      && Number.isInteger(sale.quantity)
      && sale.quantity > 0
      && Number.isFinite(sale.unitPrice)
      && Number.isFinite(sale.timestamp)
    );
    if (!validSales) throw new Error("Saved sales history has an invalid format.");
    return parsed;
  } catch (error) {
    console.error("Could not load the saved H.A.R.M sales history:", error);
    return [];
  }
}

function saveSales() {
  try {
    localStorage.setItem(salesStorageKey, JSON.stringify(sales));
    return true;
  } catch (error) {
    console.error("Could not save the H.A.R.M sales history:", error);
    window.alert("The sale could not be saved in this browser. Check your storage settings and try again.");
    return false;
  }
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: Number.isInteger(price) ? 0 : 2
  }).format(price);
}

function getAvailability(product) {
  if (product.stock === 0) return { label: "Out of stock", className: "out" };
  if (product.stock <= product.reorderLevel) return { label: "Low stock", className: "low" };
  return { label: "In stock", className: "" };
}

function getExpiryNote(expiry) {
  if (!expiry) return "";
  const date = new Date(`${expiry}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const daysUntilExpiry = Math.ceil((date - new Date(new Date().toDateString())) / 86400000);
  if (daysUntilExpiry < 0) return "Expired";
  if (daysUntilExpiry <= 3) return `Best before ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
  return "";
}

function renderProduct(product) {
  const availability = getAvailability(product);
  const stockPercent = Math.min(100, Math.max(0, (product.stock / Math.max(product.reorderLevel * 2, 1)) * 100));
  const expiryNote = product.category === "Dairy" ? getExpiryNote(product.expiry) : "";
  const availabilityLabel = product.stock === 0 ? "No stock — please order" : availability.label;
  const imagePath = getProductImagePath(product);
  const card = document.createElement("article");
  card.className = `product-card ${isAdminPage && availability.className === "out" ? "product-card-out" : ""}`;
  card.dataset.productId = product.id;
  card.innerHTML = `
    <div class="product-art ${product.category === "Dairy" ? "product-art-dairy" : "product-art-stationery"}">
      <span class="product-art-category">${product.category === "Dairy" ? "MILK & DAIRY" : "STATIONERY"}</span>
      <img class="product-photo" src="${imagePath}" alt="${escapeHtml(product.name)}" loading="lazy">
      ${isAdminPage ? `<span class="availability-badge ${availability.className}"><i></i>${availabilityLabel}</span>` : ""}
    </div>
    <div class="product-card-content">
      ${isAdminPage
    ? `<span class="product-card-code">${escapeHtml(product.id)}</span>`
    : product.brand ? `<span class="product-brand-name">${escapeHtml(product.brand)}</span>` : ""}
      <h4>${escapeHtml(product.name)}</h4>
      ${!isAdminPage && product.category === "Stationery" && (product.color || product.size) ? `<div class="product-specifications">${[product.color, product.size].filter(Boolean).map(escapeHtml).join(" · ")}</div>` : ""}
      <div class="product-card-price">${formatPrice(product.price)} <span>/ ${escapeHtml(product.unit)}</span></div>
      ${isAdminPage ? `<label class="brand-edit-field">Brand name<input type="text" maxlength="40" value="${escapeHtml(product.brand || "")}" data-brand-for="${escapeHtml(product.id)}" placeholder="Add product brand"></label>` : ""}
      ${isAdminPage && product.category === "Stationery" ? `<div class="product-attribute-fields">
        <label class="brand-edit-field">Color<input type="text" maxlength="30" value="${escapeHtml(product.color || "")}" data-product-attribute="color" data-attribute-for="${escapeHtml(product.id)}" placeholder="Optional"></label>
        <label class="brand-edit-field">Size / pack<input type="text" maxlength="30" value="${escapeHtml(product.size || "")}" data-product-attribute="size" data-attribute-for="${escapeHtml(product.id)}" placeholder="Optional"></label>
      </div>` : ""}
      ${isAdminPage ? `<div class="product-card-stock ${availability.className}">
        <div><span>REMAINING STOCK</span><strong>${product.stock} <small>${escapeHtml(product.unit)}</small></strong></div>
        <span class="card-stock-track"><i class="${availability.className}" style="width:${stockPercent}%"></i></span>
      </div>` : ""}
      ${isAdminPage && expiryNote ? `<span class="card-expiry">${escapeHtml(expiryNote)}</span>` : ""}
      ${isAdminPage ? `<button class="card-restock" type="button" data-restock="${escapeHtml(product.id)}">＋ Add stock</button>` : ""}
    </div>`;
  return card;
}

function getProductImagePath(product) {
  const name = product.name.toLocaleLowerCase();
  if (product.category === "Dairy") {
    if (name.includes("curd") || name.includes("yogurt") || name.includes("yoghurt"))     return "product-images/curd.svg";
    if (name.includes("butter")) return "product-images/butter.svg";
    if (name.includes("paneer")) return "product-images/paneer.svg";
    if (name.includes("ice cream") || name.includes("icecream")) return "product-images/ice-cream.svg";
    if (name.includes("drink") || name.includes("beverage")) return "product-images/cool-drinks.svg";
    return "product-images/milk.svg";
  }
  if (name.includes("envelope")) return "product-images/envelope.svg";
  if (name.includes("colour pencil") || name.includes("color pencil") || name.includes("crayon")) return "product-images/colour-pencils.svg";
  if (name.includes("pencil")) return "product-images/hb-pencils.svg";
  if (name.includes("pen")) return "product-images/blue-pens.svg";
  if (name.includes("paper") || name.includes("sheet")) return "product-images/a4-paper.svg";
  return "product-images/notebook.svg";
}

function getStationerySubcategory(product) {
  const name = product.name.toLocaleLowerCase();
  if (name.includes("pen") || name.includes("pencil") || name.includes("crayon")) return "Writing & drawing";
  if (name.includes("notebook") || name.includes("exercise book")) return "Notebooks";
  if (name.includes("paper") || name.includes("sheet") || name.includes("envelope")) return "Paper & envelopes";
  return "School & office";
}

function getStationeryProducts() {
  return products.filter((product) => product.category === "Stationery");
}

function getFilteredProducts() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const filtered = products.filter((product) => {
    const matchesDepartment = activeCategory === "all" || product.category === activeCategory;
    const matchesSearch = !query || [product.name, product.brand || "", product.id, product.category].some((value) => value.toLocaleLowerCase().includes(query));
    if (!matchesDepartment || !matchesSearch) return false;
    if (product.category !== "Stationery" || isAdminPage) return true;
    if (activeStationerySubcategory !== "all" && getStationerySubcategory(product) !== activeStationerySubcategory) return false;
    if (selectedStationeryColors.size && !selectedStationeryColors.has(product.color || "")) return false;
    if (selectedStationerySizes.size && !selectedStationerySizes.has(product.size || "")) return false;
    return product.price <= maximumStationeryPrice;
  });

  if (catalogSort === "price-low") filtered.sort((first, second) => first.price - second.price || first.name.localeCompare(second.name));
  if (catalogSort === "price-high") filtered.sort((first, second) => second.price - first.price || first.name.localeCompare(second.name));
  if (catalogSort === "name") filtered.sort((first, second) => first.name.localeCompare(second.name));
  return filtered;
}

function renderStationeryFacets() {
  const stationeryProducts = getStationeryProducts();
  const categories = [...new Set(stationeryProducts.map(getStationerySubcategory))];
  const categoryList = document.querySelector("#stationery-category-list");
  if (!categoryList) return;

  const categoryButtons = [
    { name: "All stationery", value: "all", count: stationeryProducts.length },
    ...categories.map((name) => ({
      name,
      value: name,
      count: stationeryProducts.filter((product) => getStationerySubcategory(product) === name).length
    }))
  ];
  categoryList.replaceChildren(...categoryButtons.map((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `catalog-category${category.value === activeStationerySubcategory ? " selected" : ""}`;
    button.dataset.subcategory = category.value;
    button.setAttribute("aria-pressed", String(category.value === activeStationerySubcategory));
    button.innerHTML = `<span>${escapeHtml(category.name)}</span><span class="catalog-category-count">${category.count}</span>`;
    return button;
  }));

  const renderCheckboxes = (containerId, property, selectedValues) => {
    const options = [...new Set(stationeryProducts.map((product) => product[property]).filter(Boolean))]
      .sort((first, second) => first.localeCompare(second));
    const container = document.querySelector(`#${containerId}`);
    container.replaceChildren(...options.map((value) => {
      const label = document.createElement("label");
      label.className = "facet-option";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = value;
      checkbox.checked = selectedValues.has(value);
      checkbox.dataset.stationeryFacet = property;
      const text = document.createElement("span");
      text.textContent = value;
      label.append(checkbox, text);
      return label;
    }));
    return options;
  };

  renderCheckboxes("stationery-color-filters", "color", selectedStationeryColors);
  renderCheckboxes("stationery-size-filters", "size", selectedStationerySizes);

  const priceFilter = document.querySelector("#stationery-price-filter");
  const highestPrice = Math.max(50, Math.ceil(Math.max(...stationeryProducts.map((product) => product.price), 200) / 50) * 50);
  priceFilter.max = String(highestPrice);
  if (!Number.isFinite(maximumStationeryPrice)) maximumStationeryPrice = highestPrice;
  maximumStationeryPrice = Math.min(maximumStationeryPrice, highestPrice);
  priceFilter.value = String(maximumStationeryPrice);
  document.querySelector("#stationery-price-value").textContent = formatPrice(maximumStationeryPrice);
}

function renderStationerySpecials() {
  const list = document.querySelector("#stationery-specials-list");
  if (!list) return;
  const stationeryProducts = getStationeryProducts().slice(0, 3);
  list.replaceChildren(...stationeryProducts.map((product) => {
    const item = document.createElement("article");
    item.className = "stationery-special-item";
    item.innerHTML = `
      <img src="${getProductImagePath(product)}" alt="" loading="lazy">
      <span><strong>${escapeHtml(product.name)}</strong><small>${formatPrice(product.price)} / ${escapeHtml(product.unit)}</small></span>`;
    return item;
  }));
}

function renderTopBrands() {
  const brandList = document.querySelector("#top-brands-list");
  if (!brandList) return;

  const brands = new Map();
  products.forEach((product) => {
    if (activeCategory !== "all" && product.category !== activeCategory) return;
    const name = typeof product.brand === "string" ? product.brand.trim() : "";
    if (!name) return;
    const key = name.toLocaleLowerCase();
    const brand = brands.get(key) || { name, productCount: 0 };
    brand.productCount += 1;
    brands.set(key, brand);
  });

  const visibleFeaturedBrands = featuredBrands.filter((brand) =>
    activeCategory === "all" || !brand.category || brand.category === activeCategory
  );
  const featuredBrandNames = new Set(visibleFeaturedBrands.map((brand) => brand.name.toLocaleLowerCase()));
  const additionalBrands = [...brands.values()].filter((brand) => !featuredBrandNames.has(brand.name.toLocaleLowerCase())).sort((first, second) =>
    second.productCount - first.productCount || first.name.localeCompare(second.name)
  );
  const brandCards = [...visibleFeaturedBrands, ...additionalBrands].map((brand) => {
    const item = document.createElement("article");
    item.className = `top-brand-card ${brand.style || ""}`.trim();
    const wordmark = document.createElement("strong");
    wordmark.textContent = brand.name;
    const count = document.createElement("span");
    count.textContent = brand.note || `${brand.productCount} ${brand.productCount === 1 ? "product" : "products"}`;
    item.append(wordmark, count);
    return item;
  });
  brandList.replaceChildren(...brandCards);
  document.querySelector("#top-brands-empty").hidden = brandCards.length !== 0;
  brandList.hidden = brandCards.length === 0;
}

function updateSearchResults() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const shouldShow = query.length > 0 && document.activeElement === searchInput;
  searchResults.replaceChildren();

  if (!shouldShow) {
    searchResults.hidden = true;
    searchInput.setAttribute("aria-expanded", "false");
    searchInput.removeAttribute("aria-activedescendant");
    activeSearchResult = -1;
    return;
  }

  const matches = products.filter((product) =>
    [product.name, product.brand || "", product.id, product.category].some((value) => value.toLocaleLowerCase().includes(query))
  );
  if (matches.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "search-results-empty";
    emptyMessage.textContent = "No matching products found.";
    searchResults.append(emptyMessage);
  } else {
    matches.forEach((product, index) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "search-result";
      option.id = `search-result-${index}`;
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", String(index === activeSearchResult));
      option.dataset.productId = product.id;
      option.innerHTML = `
        <span class="search-result-main">
          <strong>${escapeHtml(product.name)}</strong>
          <small>${product.category === "Dairy" ? "Milk &amp; dairy" : "Stationery"}${product.brand ? ` · ${escapeHtml(product.brand)}` : isAdminPage ? ` · ${escapeHtml(product.id)}` : ""}</small>
        </span>
        <span class="search-result-details">
          <strong>${formatPrice(product.price)} <small>/ ${escapeHtml(product.unit)}</small></strong>
          ${isAdminPage ? `<span class="search-result-stock ${getAvailability(product).className}">${product.stock === 0 ? "No stock — please order" : `${product.stock} ${escapeHtml(product.unit)} left · ${getAvailability(product).label}`}</span>` : ""}
        </span>`;
      searchResults.append(option);
    });
  }

  searchResults.hidden = false;
  searchInput.setAttribute("aria-expanded", "true");
  if (activeSearchResult >= matches.length) activeSearchResult = -1;
  if (activeSearchResult >= 0) searchInput.setAttribute("aria-activedescendant", `search-result-${activeSearchResult}`);
  else searchInput.removeAttribute("aria-activedescendant");
}

function chooseSearchResult(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;
  searchInput.value = product.name;
  activeCategory = isAdminPage ? "all" : product.category;
  activeSearchResult = -1;
  render();
  searchResults.hidden = true;
  searchInput.setAttribute("aria-expanded", "false");
  searchInput.removeAttribute("aria-activedescendant");
  document.querySelector("#inventory-section").scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => {
    document.querySelector(`[data-product-id="${CSS.escape(product.id)}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 250);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function updateSaleProductInfo(saleForm) {
  const product = products.find((item) => item.id === saleForm.productSelect.value && item.category === saleForm.category);
  if (!product) {
    saleForm.price.textContent = "—";
    saleForm.available.textContent = "No products";
    saleForm.quantityInput.removeAttribute("max");
    saleForm.submitButton.disabled = true;
    return;
  }
  saleForm.price.textContent = `${formatPrice(product.price)} / ${product.unit}`;
  saleForm.available.textContent = `${product.stock} ${product.unit}`;
  saleForm.quantityInput.max = String(product.stock);
  saleForm.quantityInput.value = product.stock > 0 ? "1" : "0";
  saleForm.submitButton.disabled = product.stock === 0;
}

function renderDailySales() {
  const today = getLocalDateKey();
  const categories = [
    { key: "Stationery", prefix: "stationery" },
    { key: "Dairy", prefix: "dairy" }
  ];

  categories.forEach(({ key, prefix }) => {
    const categorySales = sales.filter((sale) => {
      if (sale.date !== today) return false;
      const saleCategory = sale.category || products.find((product) => product.id === sale.productId)?.category;
      return saleCategory === key;
    });
    const unitsSold = categorySales.reduce((sum, sale) => sum + sale.quantity, 0);
    const salesTotal = categorySales.reduce((sum, sale) => sum + sale.quantity * sale.unitPrice, 0);
    const salesRows = document.querySelector(`#${prefix}-sales-rows`);
    const saleLog = document.querySelector(`#${prefix}-sales-log-wrap`);

    document.querySelector(`#${prefix}-today-units`).textContent = unitsSold.toLocaleString("en-IN");
    document.querySelector(`#${prefix}-sales-total`).textContent = formatPrice(salesTotal);
    document.querySelector(`#${prefix}-sales-count`).textContent = `${categorySales.length} ${categorySales.length === 1 ? "sale" : "sales"}`;
    document.querySelector(`#${prefix}-sales-empty`).hidden = categorySales.length !== 0;
    saleLog.hidden = categorySales.length === 0;
    salesRows.replaceChildren(...categorySales.map((sale) => {
      const row = document.createElement("tr");
      const time = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(sale.timestamp));
      row.innerHTML = `
        <td>${escapeHtml(sale.productName)}</td>
        <td>${sale.quantity} ${escapeHtml(sale.unit)}</td>
        <td>${formatPrice(sale.quantity * sale.unitPrice)}</td>
        <td>${time}</td>`;
      return row;
    }));
  });
}

function renderStockAlerts() {
  const alertSection = document.querySelector("#stock-alerts");
  const alertHeading = alertSection.querySelector(".alert-heading strong");
  const categories = [
    { key: "Stationery", prefix: "stationery" },
    { key: "Dairy", prefix: "dairy" }
  ];
  const alertCounts = categories.map(({ key, prefix }) => {
    const alerts = products.filter((product) => product.category === key && product.stock <= product.reorderLevel);
    const group = document.querySelector(`#${prefix}-alert-list`).closest(".stock-alert-group");
    const alertList = document.querySelector(`#${prefix}-alert-list`);
    const clearMessage = document.querySelector(`#${prefix}-alert-clear`);
    group.classList.toggle("stock-alert-group-clear", alerts.length === 0);
    document.querySelector(`#${prefix}-alert-count`).textContent = `${alerts.length} ${alerts.length === 1 ? "item" : "items"}`;
    clearMessage.hidden = alerts.length !== 0;
    alertList.hidden = alerts.length === 0;
    alertList.replaceChildren(...alerts.map((product) => {
      const item = document.createElement("li");
      if (product.stock === 0) {
        item.classList.add("out-of-stock");
        item.textContent = `No stock — please order: ${product.name}`;
      } else {
        item.textContent = `Low stock — please order soon: ${product.name} (${product.stock} ${product.unit} left)`;
      }
      return item;
    }));
    return alerts.length;
  });
  const totalAlerts = alertCounts.reduce((sum, count) => sum + count, 0);

  alertSection.hidden = false;
  alertSection.classList.toggle("stock-alerts-clear", totalAlerts === 0);
  alertHeading.textContent = totalAlerts ? "Stock needs your attention" : "Stock looks good";
  document.querySelector("#stock-alert-description").textContent = totalAlerts
    ? `${totalAlerts} ${totalAlerts === 1 ? "product needs" : "products need"} a stock check.`
    : "All products are above their reorder level.";
}

function renderSaleProductOptions() {
  saleForms.forEach((saleForm) => {
    const categoryProducts = products.filter((product) => product.category === saleForm.category);
    const selectedProductId = saleForm.productSelect.value;
    const options = categoryProducts.map((product) => {
      const stockLabel = product.stock === 0 ? " — Out of stock" : ` — ${product.stock} ${product.unit} left`;
      return `<option value="${escapeHtml(product.id)}" ${product.stock === 0 ? "disabled" : ""}>${escapeHtml(product.name)}${stockLabel}</option>`;
    });
    if (options.length === 0) options.push('<option value="">No products available</option>');
    saleForm.productSelect.innerHTML = options.join("");
    const selectedProduct = categoryProducts.find((product) => product.id === selectedProductId && product.stock > 0)
      || categoryProducts.find((product) => product.stock > 0);
    if (selectedProduct) saleForm.productSelect.value = selectedProduct.id;
    updateSaleProductInfo(saleForm);
  });
}

function render() {
  const filtered = getFilteredProducts();

  rowsElement.replaceChildren(...filtered.map(renderProduct));
  emptyState.hidden = filtered.length !== 0;
  rowsElement.hidden = filtered.length === 0;

  if (isAdminPage) {
    document.querySelector("#product-count").textContent = products.length.toLocaleString("en-IN");
    document.querySelector("#stock-count").textContent = products.reduce((sum, product) => sum + product.stock, 0).toLocaleString("en-IN");
    document.querySelector("#low-stock-count").textContent = products.filter((product) => product.stock <= product.reorderLevel).length.toLocaleString("en-IN");
    document.querySelector("#stock-value").textContent = formatPrice(products.reduce((sum, product) => sum + product.stock * product.price, 0));
  }
  document.querySelector("#all-tab-count").textContent = products.length;
  document.querySelector("#stationery-tab-count").textContent = products.filter((product) => product.category === "Stationery").length;
  document.querySelector("#dairy-tab-count").textContent = products.filter((product) => product.category === "Dairy").length;
  document.querySelector("#results-count").textContent = `Showing ${filtered.length} of ${products.length} products`;
  const categoryTitle = activeCategory === "all" ? "All products" : activeCategory === "Dairy" ? "Milk & dairy" : activeCategory;
  document.querySelector("#catalog-category-title").textContent = categoryTitle;
  document.querySelector("#catalog-heading").textContent = activeCategory === "all" ? "Browse products" : `Browse ${categoryTitle.toLocaleLowerCase()}`;
  if (!isAdminPage) {
    const isHome = activeCategory === "home";
    const isStationeryShop = activeCategory === "Stationery" && !searchInput.value.trim();
    document.querySelector("#departments").hidden = !isHome;
    document.querySelector("#inventory-section").hidden = isHome;
    document.querySelector("#top-brands").hidden = false;
    document.querySelector("#stationery-feature").hidden = !isStationeryShop;
    document.querySelector("#stationery-shop-sidebar").hidden = !isStationeryShop;
    document.querySelector("#department-categories").hidden = isStationeryShop;
    document.querySelector(".catalog-layout").classList.toggle("stationery-catalog-layout", isStationeryShop);
    document.querySelector("#shop-section-heading").textContent = activeCategory === "Dairy"
      ? "Milk & dairy products"
      : activeCategory === "Stationery" ? "Stationery products" : "Search results";
    if (isStationeryShop) {
      renderStationeryFacets();
      renderStationerySpecials();
    }
  }

  updateSearchResults();
  renderTopBrands();
  if (isAdminPage) {
    renderSaleProductOptions();
    renderDailySales();
    renderStockAlerts();
  }

  document.querySelectorAll("[data-filter]").forEach((button) => {
    const selected = button.dataset.filter === activeCategory;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  document.querySelectorAll(".nav-item[data-category]").forEach((button) => {
    button.classList.toggle("active", button.dataset.category === activeCategory);
  });
}

document.querySelectorAll("[data-filter], [data-category]").forEach((button) => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.filter || button.dataset.category;
    searchInput.value = "";
    activeStationerySubcategory = "all";
    selectedStationeryColors.clear();
    selectedStationerySizes.clear();
    maximumStationeryPrice = Number.POSITIVE_INFINITY;
    catalogSort = "featured";
    const sortSelect = document.querySelector("#catalog-sort");
    if (sortSelect) sortSelect.value = catalogSort;
    render();
    if (button.matches("[data-nav-home]")) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (button.closest(".storefront-nav, .department-grid, .welcome-hero-actions")) {
      document.querySelector("#inventory-section").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-subcategory]");
  if (!button) return;
  activeStationerySubcategory = button.dataset.subcategory;
  if (button.matches(".stationery-feature-button")) {
    selectedStationeryColors.clear();
    selectedStationerySizes.clear();
    maximumStationeryPrice = Number.POSITIVE_INFINITY;
    catalogSort = "featured";
    const sortSelect = document.querySelector("#catalog-sort");
    if (sortSelect) sortSelect.value = catalogSort;
  }
  render();
  if (button.matches(".stationery-feature-button")) {
    rowsElement.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

document.querySelector("#stationery-shop-sidebar")?.addEventListener("change", (event) => {
  const checkbox = event.target.closest("[data-stationery-facet]");
  if (!checkbox) return;
  const selectedValues = checkbox.dataset.stationeryFacet === "color" ? selectedStationeryColors : selectedStationerySizes;
  if (checkbox.checked) selectedValues.add(checkbox.value);
  else selectedValues.delete(checkbox.value);
  render();
});

document.querySelector("#stationery-price-filter")?.addEventListener("input", (event) => {
  maximumStationeryPrice = Number(event.target.value);
  render();
});

document.querySelector("#catalog-sort")?.addEventListener("change", (event) => {
  catalogSort = event.target.value;
  render();
});

document.querySelector("#clear-stationery-filters")?.addEventListener("click", () => {
  activeStationerySubcategory = "all";
  selectedStationeryColors.clear();
  selectedStationerySizes.clear();
  maximumStationeryPrice = Number.POSITIVE_INFINITY;
  render();
});

document.querySelectorAll('.storefront-nav a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    history.pushState(null, "", link.getAttribute("href"));
    target.scrollIntoView({ behavior: "instant", block: "start" });
  });
});

searchInput.addEventListener("input", () => {
  activeCategory = isAdminPage ? "all" : searchInput.value.trim() ? "all" : "home";
  activeSearchResult = -1;
  activeStationerySubcategory = "all";
  selectedStationeryColors.clear();
  selectedStationerySizes.clear();
  maximumStationeryPrice = Number.POSITIVE_INFINITY;
  render();
});
searchInput.addEventListener("focus", updateSearchResults);
searchInput.addEventListener("keydown", (event) => {
  const options = searchResults.querySelectorAll(".search-result");
  if (event.key === "Escape") {
    searchResults.hidden = true;
    searchInput.setAttribute("aria-expanded", "false");
    searchInput.removeAttribute("aria-activedescendant");
    activeSearchResult = -1;
    return;
  }
  if (options.length === 0 || !["ArrowDown", "ArrowUp"].includes(event.key)) {
    if (event.key === "Enter" && activeSearchResult >= 0 && options[activeSearchResult]) {
      event.preventDefault();
      chooseSearchResult(options[activeSearchResult].dataset.productId);
    }
    return;
  }
  event.preventDefault();
  const direction = event.key === "ArrowDown" ? 1 : -1;
  activeSearchResult = (activeSearchResult + direction + options.length) % options.length;
  updateSearchResults();
});
searchResults.addEventListener("click", (event) => {
  const option = event.target.closest(".search-result");
  if (option) chooseSearchResult(option.dataset.productId);
});
document.addEventListener("click", (event) => {
  if (event.target.closest(".store-search-wrap")) return;
  searchResults.hidden = true;
  searchInput.setAttribute("aria-expanded", "false");
  searchInput.removeAttribute("aria-activedescendant");
  activeSearchResult = -1;
});

document.querySelector("#clear-filters-button").addEventListener("click", () => {
  searchInput.value = "";
  activeCategory = isAdminPage ? "all" : "home";
  activeStationerySubcategory = "all";
  selectedStationeryColors.clear();
  selectedStationerySizes.clear();
  maximumStationeryPrice = Number.POSITIVE_INFINITY;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function recordSale(saleForm, event) {
  event.preventDefault();
  const product = products.find((item) => item.id === saleForm.productSelect.value && item.category === saleForm.category);
  const quantitySold = Number(saleForm.quantityInput.value);
  if (!product) {
    saleForm.error.textContent = `Choose a ${saleForm.category.toLocaleLowerCase()} product before recording a sale.`;
    saleForm.error.hidden = false;
    return;
  }
  if (!Number.isInteger(quantitySold) || quantitySold < 1) {
    saleForm.error.textContent = "Enter a whole quantity greater than zero.";
    saleForm.error.hidden = false;
    return;
  }
  if (quantitySold > product.stock) {
    saleForm.error.textContent = `Only ${product.stock} ${product.unit} of ${product.name} remain. Please enter a smaller quantity.`;
    saleForm.error.hidden = false;
    return;
  }

  const sale = {
    productId: product.id,
    productName: product.name,
    category: product.category,
    quantity: quantitySold,
    unit: product.unit,
    unitPrice: product.price,
    date: getLocalDateKey(),
    timestamp: Date.now()
  };
  product.stock -= quantitySold;
  if (!saveProducts()) {
    product.stock += quantitySold;
    return;
  }
  sales.unshift(sale);
  if (!saveSales()) {
    sales.shift();
    product.stock += quantitySold;
    saveProducts();
    return;
  }
  saleForm.error.hidden = true;
  saleForm.quantityInput.value = "1";
  render();
}

saleForms.forEach((saleForm) => {
  saleForm.productSelect.addEventListener("change", () => updateSaleProductInfo(saleForm));
  saleForm.form.addEventListener("submit", (event) => recordSale(saleForm, event));
});

function openProductDialog() {
  productForm.reset();
  productForm.elements.reorderLevel.value = "5";
  const isStationeryProduct = productForm.elements.category.value === "Stationery";
  document.querySelector("#stationery-attributes").hidden = !isStationeryProduct;
  document.querySelector("#expiry-field").hidden = isStationeryProduct;
  formError.hidden = true;
  productDialog.showModal();
}

if (isAdminPage) {
  document.querySelector("#add-product-button").addEventListener("click", openProductDialog);
  document.querySelector("#add-product-button-secondary").addEventListener("click", openProductDialog);
  document.querySelector("#close-dialog").addEventListener("click", () => productDialog.close());
  document.querySelector("#cancel-dialog").addEventListener("click", () => productDialog.close());
  productForm.elements.category.addEventListener("change", (event) => {
    document.querySelector("#expiry-field").hidden = event.target.value !== "Dairy";
    document.querySelector("#stationery-attributes").hidden = event.target.value !== "Stationery";
  });

  productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(productForm);
  const name = String(formData.get("name")).trim();
  const category = String(formData.get("category"));
  const id = String(formData.get("sku")).trim() || `${category === "Dairy" ? "DAI" : "STA"}-${String(Date.now()).slice(-6)}`;
  if (products.some((product) => product.id.toLowerCase() === id.toLowerCase())) {
    formError.textContent = "That product code is already in use. Please enter a unique code.";
    formError.hidden = false;
    return;
  }

  const product = {
    id,
    name,
    category,
    price: Number(formData.get("price")),
    stock: Number(formData.get("stock")),
    unit: String(formData.get("unit")).trim(),
    reorderLevel: Number(formData.get("reorderLevel"))
  };
  const brand = String(formData.get("brand")).trim();
  if (brand) product.brand = brand;
  const color = String(formData.get("color")).trim();
  if (color) product.color = color;
  const size = String(formData.get("size")).trim();
  if (size) product.size = size;
  const expiry = String(formData.get("expiry")).trim();
  if (category === "Dairy" && expiry) product.expiry = expiry;
  if (!name || !product.unit || !Number.isFinite(product.price) || !Number.isFinite(product.stock) || product.stock < 0) {
    formError.textContent = "Please enter a product name, unit, valid price, and stock quantity.";
    formError.hidden = false;
    return;
  }

  products.push(product);
  if (!saveProducts()) {
    products.pop();
    return;
  }
  productDialog.close();
  activeCategory = category;
  searchInput.value = "";
  render();
  });

  rowsElement.addEventListener("click", (event) => {
    const button = event.target.closest("[data-restock]");
    if (!button) return;
    const product = products.find((item) => item.id === button.dataset.restock);
    if (!product) return;
    const quantity = window.prompt(`How many ${product.unit} would you like to add to ${product.name}?`, "1");
    if (quantity === null) return;
    const amount = Number(quantity);
    if (!Number.isInteger(amount) || amount <= 0) {
      window.alert("Enter a whole number greater than zero.");
      return;
    }
    product.stock += amount;
    if (!saveProducts()) {
      product.stock -= amount;
      return;
    }
    render();
  });

  rowsElement.addEventListener("change", (event) => {
    const attributeInput = event.target.closest("[data-attribute-for]");
    if (attributeInput) {
      const product = products.find((item) => item.id === attributeInput.dataset.attributeFor);
      if (!product) return;
      const attribute = attributeInput.dataset.productAttribute;
      const previousValue = product[attribute] || "";
      const nextValue = attributeInput.value.trim();
      if (previousValue === nextValue) return;
      if (nextValue) product[attribute] = nextValue;
      else delete product[attribute];
      if (!saveProducts()) {
        if (previousValue) product[attribute] = previousValue;
        else delete product[attribute];
        attributeInput.value = previousValue;
        return;
      }
      render();
      return;
    }

    const input = event.target.closest("[data-brand-for]");
    if (!input) return;
    const product = products.find((item) => item.id === input.dataset.brandFor);
    if (!product) return;

    const previousBrand = product.brand || "";
    const nextBrand = input.value.trim();
    if (previousBrand === nextBrand) return;
    if (nextBrand) product.brand = nextBrand;
    else delete product.brand;

    if (!saveProducts()) {
      if (previousBrand) product.brand = previousBrand;
      else delete product.brand;
      input.value = previousBrand;
      return;
    }
    render();
  });

  document.querySelector("#export-button").addEventListener("click", () => {
    const headers = ["Product code", "Product name", "Brand", "Category", "Color", "Size / pack", "Price (INR)", "Remaining stock", "Unit", "Reorder level", "Best before"];
    const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const lines = [headers, ...products.map((product) => [
      product.id, product.name, product.brand || "", product.category, product.color || "", product.size || "", product.price, product.stock, product.unit, product.reorderLevel, product.expiry || ""
    ])].map((line) => line.map(csvEscape).join(","));
    const file = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "harm-daily-needs-inventory.csv";
    link.click();
    URL.revokeObjectURL(url);
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});

document.querySelector("#today-date").textContent = new Intl.DateTimeFormat("en-IN", {
  day: "numeric", month: "short", year: "numeric"
}).format(new Date());
if (isAdminPage) {
  document.querySelector("#sales-date").textContent = new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  }).format(new Date());
}

render();
