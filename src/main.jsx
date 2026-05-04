import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString('en-IN')}`;
}

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [favorites, setFavorites] = useState(() => readStorage('linunaura_favorites', []));
  const [filter, setFilter] = useState('All');
  const [fabricFilter, setFabricFilter] = useState('All fabrics');
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) throw new Error('Unable to load products');
      setProducts(await response.json());
    } catch (err) {
      setError('Start the Python backend to load Linunaura products.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    applyAppearance();
  }, []);

  useEffect(() => {
    localStorage.setItem('linunaura_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(products.map((item) => item.category)))];
  }, [products]);

  const fabricTypes = useMemo(() => {
    const fabrics = Array.from(new Set(products.map((item) => item.material).filter(Boolean)));
    return ['All fabrics', ...fabrics];
  }, [products]);

  const bestSellers = useMemo(() => {
    return [...products]
      .sort((first, second) => {
        if (Boolean(second.featured) !== Boolean(first.featured)) {
          return Number(Boolean(second.featured)) - Number(Boolean(first.featured));
        }
        return (second.rating || 0) - (first.rating || 0);
      })
      .slice(0, 3);
  }, [products]);

  const favoriteProducts = useMemo(() => {
    return products.filter((product) => favorites.includes(product.id));
  }, [products, favorites]);

  const visibleProducts = useMemo(() => {
    const text = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesFilter = filter === 'All' || product.category === filter;
      const matchesFabric = fabricFilter === 'All fabrics' || product.material === fabricFilter;
      const matchesText =
        !text ||
        [product.name, product.category, product.color, product.material, product.size, product.description]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(text));
      return matchesFilter && matchesFabric && matchesText;
    });
  }, [products, filter, fabricFilter, query]);

  function addToCart(product) {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      if (found) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  }

  function updateQuantity(id, change) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: Math.max(0, item.quantity + change) } : item
        )
        .filter((item) => item.id !== id || item.quantity > 0)
    );
  }

  function toggleFavorite(productId) {
    setFavorites((current) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  }

  function navigateTo(sectionId) {
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  function startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceMessage('Voice search is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setVoiceMessage('Listening for your search...');
    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setQuery(transcript);
      setVoiceMessage(transcript ? `Searching for "${transcript}"` : '');
      navigateTo('catalog');
    };

    recognition.onerror = () => {
      setVoiceMessage('Voice search could not hear that clearly.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app-shell">
      <PromoBar />
      <Header
        query={query}
        setQuery={setQuery}
        startVoiceSearch={startVoiceSearch}
        isListening={isListening}
        navigateTo={navigateTo}
        cartCount={cartCount}
        favoriteCount={favorites.length}
      />

      <Hero featured={products.find((item) => item.featured) || products[0]} />
      <TrustStrip />
      <FabricTypeSection
        fabrics={fabricTypes}
        selectedFabric={fabricFilter}
        setSelectedFabric={setFabricFilter}
        navigateTo={navigateTo}
      />
      <BestSellers
        products={bestSellers}
        favorites={favorites}
        addToCart={addToCart}
        toggleFavorite={toggleFavorite}
      />

      <main className="page-grid">
        <section className="catalog-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Fresh arrivals</p>
              <h2>Premium bedsheets for calm, elegant rooms</h2>
              <p className="filter-summary">
                Showing {filter === 'All' ? 'all categories' : filter} in {fabricFilter.toLowerCase()}.
              </p>
            </div>
            <div className="search-bar">
              <span aria-hidden="true">🔍</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search color, size, fabric"
              />
              <button
                type="button"
                className={`voice-button ${isListening ? 'listening' : ''}`}
                onClick={startVoiceSearch}
                aria-label="Search by voice"
                title="Search by voice"
              >
                🎙️
              </button>
            </div>
          </div>
          {voiceMessage && <div className="voice-message">{voiceMessage}</div>}

          <div className="tabs" aria-label="Product categories">
            {categories.map((category) => (
              <button
                key={category}
                className={filter === category ? 'active' : ''}
                onClick={() => setFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="fabric-tabs" aria-label="Fabric type filters">
            {fabricTypes.map((fabric) => (
              <button
                key={fabric}
                className={fabricFilter === fabric ? 'active' : ''}
                onClick={() => setFabricFilter(fabric)}
              >
                {fabric}
              </button>
            ))}
          </div>

          {error && <div className="notice">{error}</div>}
          {loading ? (
            <div className="product-grid">
              {[1, 2, 3].map((item) => (
                <div className="skeleton-card" key={item} />
              ))}
            </div>
          ) : (
            <ProductGrid
              products={visibleProducts}
              favorites={favorites}
              addToCart={addToCart}
              toggleFavorite={toggleFavorite}
            />
          )}
        </section>

        <aside className="customer-sidebar">
          <CartPanel cart={cart} updateQuantity={updateQuantity} cartTotal={cartTotal} />
          <FavoritesPanel products={favoriteProducts} addToCart={addToCart} toggleFavorite={toggleFavorite} />
        </aside>
      </main>

      <ServicePromises />
      <AboutSection />
      <ContactSection />
      <SiteFooter navigateTo={navigateTo} />
    </div>
  );
}

function applyAppearance() {
  const theme = localStorage.getItem('linunaura_theme') || 'light';
  const density = localStorage.getItem('linunaura_density') || 'comfortable';
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.density = density;
}

function PromoBar() {
  return (
    <div className="promo-bar">
      <span>Free delivery on orders above Rs. 2,999</span>
      <span>Easy exchange support</span>
      <span>Premium cotton bedsheet collection</span>
    </div>
  );
}

function Header({ query, setQuery, startVoiceSearch, isListening, navigateTo, cartCount, favoriteCount }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={() => navigateTo('catalog')} aria-label="Open Linunaura shop">
        <span className="brand-mark">L</span>
        <span>
          <strong>Linunaura.in</strong>
          <small>Bed linen studio</small>
        </span>
      </button>

      <div className="header-search">
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => navigateTo('catalog')}
          placeholder="Search bedsheets"
        />
        <button
          type="button"
          className={`voice-button ${isListening ? 'listening' : ''}`}
          onClick={startVoiceSearch}
          aria-label="Search by voice"
          title="Search by voice"
        >
          🎙️
        </button>
      </div>

      <nav>
        <button className="active" onClick={() => navigateTo('catalog')}>Store</button>
        <button onClick={() => navigateTo('best-selling')}>Best sellers</button>
        <button onClick={() => navigateTo('promises')}>Why us</button>
        <button onClick={() => navigateTo('about')}>About</button>
        <button onClick={() => navigateTo('contact')}>Contact</button>
      </nav>

      <div className="header-actions">
        <button onClick={() => navigateTo('favorites')} aria-label={`Open favorites, ${favoriteCount} saved`}>
          <span aria-hidden="true">❤️</span>
          <strong>{favoriteCount}</strong>
        </button>
        <a href="/profile.html" aria-label="Open customer profile">
          <span aria-hidden="true">👤</span>
        </a>
        <button onClick={() => navigateTo('cart')} aria-label={`Open cart, ${cartCount} items`}>
          <span aria-hidden="true">🛒</span>
          <strong>{cartCount}</strong>
        </button>
      </div>
    </header>
  );
}

function Hero({ featured }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Linunaura.in</p>
        <h1>Soft luxury bedsheets, ready for everyday Indian homes</h1>
        <p>
          Curated cotton, satin, and jacquard bedsheet sets with clean pricing,
          live stock, wishlist saving, and a smooth shopping experience.
        </p>
        <div className="hero-actions">
          <a href="#catalog" className="primary-link">Shop collection</a>
          <a href="#best-selling" className="secondary-link">Best sellers</a>
        </div>
        <div className="hero-stats">
          <div>
            <strong>4.8/5</strong>
            <span>customer rating</span>
          </div>
          <div>
            <strong>300 TC</strong>
            <span>cotton options</span>
          </div>
          <div>
            <strong>Free</strong>
            <span>delivery above Rs. 2,999</span>
          </div>
        </div>
      </div>
      {featured && (
        <div className="hero-product">
          <img src={featured.image} alt={featured.name} />
          <div>
            <span>{featured.badge || 'Featured'}</span>
            <strong>{featured.name}</strong>
            <small>{money(featured.price)}</small>
          </div>
        </div>
      )}
    </section>
  );
}

function TrustStrip() {
  const points = [
    ['Secure checkout', 'Your order details stay private on this device.'],
    ['Quality checked', 'Selected fabrics, clean stitching, and reliable sizing.'],
    ['Fast support', 'Contact help for size, bulk orders, and availability.'],
    ['Easy reorder', 'Save favorites and customer details for smoother shopping.']
  ];

  return (
    <section className="trust-strip" aria-label="Store benefits">
      {points.map(([title, text]) => (
        <div key={title}>
          <strong>{title}</strong>
          <span>{text}</span>
        </div>
      ))}
    </section>
  );
}

function FabricTypeSection({ fabrics, selectedFabric, setSelectedFabric, navigateTo }) {
  const highlights = [
    ['Cotton', 'Soft daily comfort for Indian weather.'],
    ['Percale Cotton', 'Crisp hotel-style feel with breathable weave.'],
    ['Sateen Cotton', 'Smooth finish with a premium drape.'],
    ['Resham Silk', 'Dressy shine for festive bedrooms.']
  ];

  function chooseFabric(fabric) {
    setSelectedFabric(fabric);
    navigateTo('catalog');
  }

  return (
    <section className="fabric-section" id="fabric-types">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Bedsheet cloth type</p>
          <h2>Search by fabric: cotton, resham, sateen and more</h2>
        </div>
        <button onClick={() => chooseFabric('All fabrics')}>View all fabrics</button>
      </div>
      <div className="fabric-grid">
        {highlights.map(([fabric, text]) => {
          const matchedFabric = fabrics.find((item) => item.toLowerCase().includes(fabric.toLowerCase()));
          const value = matchedFabric || fabric;
          return (
            <button
              key={fabric}
              className={selectedFabric === value ? 'active' : ''}
              onClick={() => chooseFabric(value)}
            >
              <strong>{fabric}</strong>
              <span>{text}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BestSellers({ products, favorites, addToCart, toggleFavorite }) {
  return (
    <section className="feature-band" id="best-selling">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Best selling products</p>
          <h2>Top-rated bedsheets customers keep choosing</h2>
        </div>
        <a href="#catalog" className="text-link">View all products</a>
      </div>
      {products.length === 0 ? (
        <div className="empty-state">Best selling products will appear after the backend loads.</div>
      ) : (
        <div className="best-grid">
          {products.map((product, index) => (
            <article className="best-card" key={product.id}>
              <div className="best-media">
                <img src={product.image} alt={product.name} />
                <FavoriteButton
                  active={favorites.includes(product.id)}
                  onClick={() => toggleFavorite(product.id)}
                />
              </div>
              <div>
                <span className="rank">#{index + 1}</span>
                <p>{product.category}</p>
                <h3>{product.name}</h3>
                <div className="best-meta">
                  <strong>{money(product.price)}</strong>
                  <span>{Number(product.rating || 4.7).toFixed(1)}/5 rating</span>
                </div>
                <button disabled={product.stock <= 0} onClick={() => addToCart(product)}>
                  Add to bag
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function ProductGrid({ products, favorites, addToCart, toggleFavorite }) {
  if (!products.length) {
    return <div className="empty-state">No products match this selection.</div>;
  }

  return (
    <div className="product-grid" id="catalog">
      {products.map((product) => (
        <article className="product-card" key={product.id}>
          <div className="product-media">
            <img src={product.image} alt={product.name} />
            {product.badge && <span className="product-badge">{product.badge}</span>}
            <FavoriteButton
              active={favorites.includes(product.id)}
              onClick={() => toggleFavorite(product.id)}
            />
          </div>
          <div className="product-body">
            <div>
              <p>{product.category}</p>
              <h3>{product.name}</h3>
              <span className="rating-line">{Number(product.rating || 4.7).toFixed(1)}/5 rating</span>
            </div>
            <p className="description">{product.description}</p>
            <div className="meta-row">
              <span>{product.material}</span>
              <span>{product.size}</span>
              <span>{product.color}</span>
            </div>
            <div className="price-row">
              <div>
                <strong>{money(product.price)}</strong>
                {product.mrp > product.price && <small>{money(product.mrp)}</small>}
              </div>
              <span>{product.stock > 0 ? `${product.stock} in stock` : 'Sold out'}</span>
            </div>
            <button disabled={product.stock <= 0} onClick={() => addToCart(product)}>
              Add to bag
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function FavoriteButton({ active, onClick }) {
  return (
    <button
      type="button"
      className={`favorite-button ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-label={active ? 'Remove from favorites' : 'Add to favorites'}
      title={active ? 'Remove from favorites' : 'Add to favorites'}
    >
      <span aria-hidden="true">{active ? '❤️' : '🤍'}</span>
      {active ? 'Saved' : 'Save'}
    </button>
  );
}

function CartPanel({ cart, updateQuantity, cartTotal }) {
  const freeDeliveryTarget = 2999;
  const deliveryCharge = cart.length === 0 || cartTotal >= freeDeliveryTarget ? 0 : 99;
  const amountLeft = Math.max(0, freeDeliveryTarget - cartTotal);
  const finalTotal = cartTotal + deliveryCharge;

  return (
    <section className="cart-panel" id="cart">
      <div className="section-heading compact">
        <div>
          <p className="eyebrow">Order draft</p>
          <h2><span aria-hidden="true">🛒</span> Cart</h2>
        </div>
      </div>
      {cart.length === 0 ? (
        <div className="empty-state">Your selected bedsheets will appear here.</div>
      ) : (
        <>
          <div className="delivery-meter">
            <div>
              <span style={{ width: `${Math.min(100, (cartTotal / freeDeliveryTarget) * 100)}%` }} />
            </div>
            <p>
              {amountLeft > 0
                ? `Add ${money(amountLeft)} more for free delivery.`
                : 'Free delivery unlocked.'}
            </p>
          </div>
          <div className="cart-list">
            {cart.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt="" />
                <div>
                  <strong>{item.name}</strong>
                  <span>{money(item.price)}</span>
                  <div className="stepper">
                    <button onClick={() => updateQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="checkout-box">
            <div className="total-line">
              <span>Subtotal</span>
              <strong>{money(cartTotal)}</strong>
            </div>
            <div className="total-line muted">
              <span>Delivery</span>
              <strong>{deliveryCharge === 0 ? 'Free' : money(deliveryCharge)}</strong>
            </div>
            <div className="total-line grand">
              <span>Total</span>
              <strong>{money(finalTotal)}</strong>
            </div>
            <button>Proceed to checkout</button>
          </div>
        </>
      )}
    </section>
  );
}

function FavoritesPanel({ products, addToCart, toggleFavorite }) {
  return (
    <section className="side-panel" id="favorites">
      <p className="eyebrow">Favorite</p>
      <h2><span aria-hidden="true">❤️</span> Wishlist</h2>
      {products.length === 0 ? (
        <div className="empty-state">Tap Favorite on any bedsheet to save it here.</div>
      ) : (
        <div className="mini-list">
          {products.map((product) => (
            <div className="mini-item" key={product.id}>
              <img src={product.image} alt="" />
              <div>
                <strong>{product.name}</strong>
                <span>{money(product.price)}</span>
                <div className="mini-actions">
                  <button onClick={() => addToCart(product)}>🛒 Cart</button>
                  <button onClick={() => toggleFavorite(product.id)}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ServicePromises() {
  return (
    <section className="service-promises" id="promises">
      <div>
        <p className="eyebrow">Why shop here</p>
        <h2>A smoother bedsheet shopping experience</h2>
      </div>
      <div className="promise-grid">
        <article>
          <strong>Clear product details</strong>
          <p>Every item shows fabric, size, colour, stock, MRP, and selling price before checkout.</p>
        </article>
        <article>
          <strong>Wishlist ready</strong>
          <p>Save favourite bedsheets and manage your customer details from the profile page.</p>
        </article>
        <article>
          <strong>Responsive design</strong>
          <p>The layout adapts for mobile, tablet, and desktop shopping without clutter.</p>
        </article>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="about-section" id="about">
      <div className="about-copy">
        <p className="eyebrow">About us</p>
        <h2>Linunaura.in brings soft, reliable bedding to modern homes.</h2>
        <p>
          We focus on bedsheets that feel comfortable, look polished, and are easy
          to maintain. Every collection is selected around fabric quality, colour
          balance, practical sizes, and fair pricing for everyday use.
        </p>
        <div className="stats-row">
          <div>
            <strong>300 TC</strong>
            <span>premium cotton options</span>
          </div>
          <div>
            <strong>24 hr</strong>
            <span>quick product updates</span>
          </div>
          <div>
            <strong>4.8</strong>
            <span>average product rating</span>
          </div>
        </div>
      </div>
      <div className="about-image">
        <img
          src="https://img.freepik.com/free-photo/cozy-lively-home-interior-design_23-2151119015.jpg?semt=ais_hybrid&w=740&q=80"
          alt="Premium bedroom with soft bedsheets"
        />
      </div>
    </section>
  );
}

function ContactSection() {
  const [sent, setSent] = useState(false);

  function submitContact(event) {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  }

  return (
    <section className="contact-section" id="contact">
      <div>
        <p className="eyebrow">Contact us</p>
        <h2>Need bulk bedsheets, support, or a custom order?</h2>
        <p>
          Send your requirement and the Linunaura.in team will help with product
          details, pricing, and availability.
        </p>
        <div className="contact-list">
          <a href="tel:+919084809460">+91 9084809460</a>
          <a href="mailto:suhail@gmail.com">suhail@gmail.com</a>
          <span>Masuri, Ghaziabad, India</span>
        </div>
      </div>
      <form className="contact-form" onSubmit={submitContact}>
        <label>
          Your name
          <input name="name" required />
        </label>
        <label>
          Phone or email
          <input name="contact" required />
        </label>
        <label>
          Message
          <textarea name="message" required />
        </label>
        {sent && <div className="notice">Your message is ready. We will contact you soon.</div>}
        <button>Send enquiry</button>
      </form>
    </section>
  );
}

function SiteFooter({ navigateTo }) {
  return (
    <footer className="site-footer">
      <div>
        <strong>Linunaura.in</strong>
        <p>We provide a smooth and comfort bedsheet.</p>
      </div>
      <div className="footer-links">
        <button onClick={() => navigateTo('catalog')}>Products</button>
        <button onClick={() => navigateTo('best-selling')}>Best sellers</button>
        <button onClick={() => navigateTo('promises')}>Why us</button>
        <button onClick={() => navigateTo('favorites')}>❤️ Favorites</button>
        <a href="/profile.html">👤 Profile</a>
      </div>
    </footer>
  );
}

createRoot(document.getElementById('root')).render(<App />);
