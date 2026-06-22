import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Bell,
  Check,
  CircleDollarSign,
  Loader2,
  LogOut,
  Send,
  Smartphone,
  Trash2,
} from 'lucide-react';
import './styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function formatPrice(value) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value);
}

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

function App() {
  const [status, setStatus] = useState({ enabled: false, ready: false, hasQrCode: false });
  const [qrCode, setQrCode] = useState({ available: false, dataUrl: null, generatedAt: null });
  const [groups, setGroups] = useState([]);
  const [alarms, setAlarms] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [liveResults, setLiveResults] = useState([]);
  const [isScraping, setIsScraping] = useState(false);
  const [ruleType, setRuleType] = useState('TARGET_PRICE');
  const [targetValue, setTargetValue] = useState('');
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [notice, setNotice] = useState('');

  const canCreateAlarm = useMemo(() => {
    return selectedDevice && targetValue && selectedTargets.length > 0;
  }, [selectedDevice, targetValue, selectedTargets]);

  const resultsBySource = useMemo(() => {
    const grouped = {};
    liveResults.forEach((product) => {
      const src = product.source || 'Diger';
      if (!grouped[src]) {
        grouped[src] = [];
      }
      grouped[src].push(product);
    });
    return grouped;
  }, [liveResults]);

  useEffect(() => {
    refreshData();
    const timer = window.setInterval(refreshData, 15000);
    return () => window.clearInterval(timer);
  }, []);

  async function refreshData() {
    try {
      const [statusResponse, groupsResponse, alarmsResponse, catalogResponse] = await Promise.all([
        request('/api/whatsapp/status'),
        request('/api/whatsapp/groups'),
        request('/api/alarms'),
        request('/api/products/catalog'),
      ]);
      setStatus(statusResponse.data);
      setGroups(groupsResponse.data);
      setAlarms(alarmsResponse.data);
      setCatalog(catalogResponse.data);
      setActiveCategoryId((current) => current || catalogResponse.data[0]?.id || '');

      if (statusResponse.data.enabled && !statusResponse.data.ready) {
        const qrResponse = await request('/api/whatsapp/qr');
        setQrCode(qrResponse.data);
      } else {
        setQrCode({ available: false, dataUrl: null, generatedAt: null });
      }
    } catch {
      setNotice('Backend ile baglanti kurulamadi.');
    }
  }

  function toggleTarget(chatId) {
    setSelectedTargets((current) =>
      current.includes(chatId) ? current.filter((id) => id !== chatId) : [...current, chatId],
    );
  }

  const activeCategory = catalog.find((category) => category.id === activeCategoryId);

  async function handleSelectDevice(device) {
    setSelectedDevice(device);
    setLiveResults([]);
    setIsScraping(true);
    setNotice('');

    try {
      const response = await request(`/api/products/search?query=${encodeURIComponent(device.name)}`);
      setLiveResults(response.data);
      if (response.data.length === 0) {
        setNotice('Bu cihaz icin guncel sonuc bulunamadi.');
      }
    } catch {
      setNotice('Guncel urunler cekilemedi.');
    } finally {
      setIsScraping(false);
    }
  }

  async function handleCreateAlarm() {
    if (!canCreateAlarm) return;

    const numericValue = Number.parseFloat(targetValue);
    const payload = {
      productName: selectedDevice.name,
      searchQuery: selectedDevice.name,
      ruleType,
      targetPrice: ruleType === 'TARGET_PRICE' ? numericValue : undefined,
      percentageDrop: ruleType === 'PERCENTAGE_DROP' ? numericValue : undefined,
      targetChatIds: selectedTargets,
    };

    try {
      await request('/api/alarms', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setTargetValue('');
      setSelectedTargets([]);
      setNotice('Alarm olusturuldu.');
      await refreshData();
    } catch {
      setNotice('Alarm olusturulamadi.');
    }
  }

  async function handleSendTestMessage() {
    if (selectedTargets.length === 0) {
      setNotice('Once en az bir WhatsApp grubu sec.');
      return;
    }

    try {
      await request('/api/whatsapp/test-message', {
        method: 'POST',
        body: JSON.stringify({ chatIds: selectedTargets }),
      });
      setNotice('Test mesaji secili gruplara gonderildi.');
    } catch {
      setNotice('Test mesaji gonderilemedi.');
    }
  }

  async function handleDisconnectWhatsapp() {
    if (!window.confirm('WhatsApp baglantisini koparmak istediginizden emin misiniz?')) {
      return;
    }
    setNotice('WhatsApp baglantisi kesiliyor...');
    try {
      await request('/api/whatsapp/disconnect', { method: 'POST' });
      setNotice('WhatsApp baglantisi kesildi. Yeni QR bekleniyor.');
      await refreshData();
    } catch {
      setNotice('Baglanti kesilemedi.');
    }
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Product Alarm</p>
          <h1>Fiyat sinyallerini tek panelden yonet</h1>
        </div>
        <div className={`status-pill ${status.ready ? 'ready' : 'pending'}`}>
          <Smartphone size={18} />
          <span>{status.ready ? 'WhatsApp bagli' : status.enabled ? 'QR bekleniyor' : 'WhatsApp pasif'}</span>
        </div>
      </section>

      {notice && <div className="notice">{notice}</div>}

      <section className="layout-grid">
        <aside className="side-panel">
          <div className="panel-title">
            <Smartphone size={18} />
            <h2>WhatsApp baglantisi</h2>
          </div>
          <div className="qr-panel">
            {status.ready ? (
              <div className="connection-success">
                <Check size={30} />
                <strong>Baglanti aktif</strong>
                <span>Gruplar asagida listeleniyor.</span>
                <button
                  className="disconnect-action"
                  onClick={handleDisconnectWhatsapp}
                  type="button"
                >
                  <LogOut size={16} />
                  Baglantiyi Kes
                </button>
              </div>
            ) : qrCode.available ? (
              <>
                <img className="qr-image" src={qrCode.dataUrl} alt="WhatsApp QR kodu" />
                <p className="muted">
                  WhatsApp mobil uygulamasindan Bagli Cihazlar ekranini acip bu kodu okut.
                </p>
              </>
            ) : (
              <div className="connection-loading">
                {status.enabled && <Loader2 className="spin" size={24} />}
                <strong>{status.enabled ? 'WhatsApp baglantisi kuruluyor' : 'WhatsApp entegrasyonu pasif'}</strong>
                <span>
                  {status.enabled
                    ? 'QR okutulduysa oturum dogrulaniyor ve gruplar hazirlaniyor.'
                    : 'Backend ayarlarinda WhatsApp etkin degil.'}
                </span>
              </div>
            )}
          </div>

          <div className="panel-title">
            <Send size={18} />
            <h2>Bildirim hedefleri</h2>
          </div>
          <p className="muted">
            Botun dahil oldugu gruplar burada listelenir. Alarm mesajinin gidecegi hedefleri sec.
          </p>
          <button
            className="secondary-action"
            disabled={!status.ready || selectedTargets.length === 0}
            onClick={handleSendTestMessage}
            type="button"
          >
            <Send size={16} />
            Test mesaji gonder
          </button>
          <div className="target-list">
            {!status.ready ? (
              <div className="connection-loading compact">
                <Loader2 className="spin" size={22} />
                <strong>Gruplar bekleniyor</strong>
                <span>WhatsApp baglantisi kurulduktan sonra gruplar otomatik cekilecek.</span>
              </div>
            ) : groups.length === 0 ? (
              <div className="empty-state">Bu WhatsApp oturumunda grup bulunamadi.</div>
            ) : (
              groups.map((group) => (
                <button
                  className={`target-item ${selectedTargets.includes(group.id) ? 'selected' : ''}`}
                  key={group.id}
                  onClick={() => toggleTarget(group.id)}
                  type="button"
                >
                  <span>{group.name}</span>
                  {selectedTargets.includes(group.id) && <Check size={18} />}
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="workspace">
          <section className="catalog-panel">
            <div className="panel-title">
              <CircleDollarSign size={18} />
              <h2>Urun katalogu</h2>
            </div>
            <div className="category-tabs">
              {catalog.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={activeCategoryId === category.id ? 'active' : ''}
                  onClick={() => {
                    setActiveCategoryId(category.id);
                    setSelectedDevice(null);
                    setLiveResults([]);
                  }}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="device-list">
              {activeCategory?.devices.map((device) => (
                <button
                  type="button"
                  className={`device-item ${selectedDevice?.id === device.id ? 'selected' : ''}`}
                  key={device.id}
                  onClick={() => handleSelectDevice(device)}
                >
                  {device.name}
                </button>
              ))}
            </div>

            <div className="live-results-header">
              <strong>{selectedDevice ? `${selectedDevice.name} icin guncel sonuclar` : 'Guncel sonuclar'}</strong>
              {isScraping && (
                <span>
                  <Loader2 className="spin" size={16} />
                  Siteler taraniyor
                </span>
              )}
            </div>

            <div className="provider-groups">
              {liveResults.length === 0 && !isScraping ? (
                <div className="empty-state">Bir cihaz secince guncel fiyatlar burada listelenir.</div>
              ) : (
                Object.entries(resultsBySource).map(([sourceName, products]) => (
                  <div key={sourceName} className="provider-group">
                    <h4 className="provider-group-title">{sourceName}</h4>
                    <div className="product-grid catalog-products">
                      {products.map((product) => (
                        <a
                          className="product-card"
                          href={product.url}
                          key={product.id}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <strong>{product.name}</strong>
                          <span className="price">{formatPrice(product.price)}</span>
                          {product.previousPrice !== undefined && (
                            <span className="muted">Onceki: {formatPrice(product.previousPrice)}</span>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rule-panel">
            <div className="panel-title">
              <CircleDollarSign size={18} />
              <h2>Alarm kuralı</h2>
            </div>

            {selectedDevice ? (
              <>
                <div className="selected-product">
                  <span>{selectedDevice.name}</span>
                  <strong>Tum sitelerde en dusuk fiyat izlenecek</strong>
                </div>
                <p className="muted">
                  Alarm tek bir karta degil, secili cihaz adina kurulur. Vatan, Teknosa, MediaMarkt, Hepsiburada,
                  Trendyol, n11 ve Amazon sonuclari kaydedilir; kural en dusuk guncel fiyata gore calisir.
                </p>
                <div className="rule-grid">
                  <label>
                    Kural
                    <select value={ruleType} onChange={(event) => setRuleType(event.target.value)}>
                      <option value="TARGET_PRICE">Belirli fiyata duserse</option>
                      <option value="PERCENTAGE_DROP">Yuzde olarak duserse</option>
                    </select>
                  </label>
                  <label>
                    {ruleType === 'TARGET_PRICE' ? 'Hedef fiyat' : 'Dususe oranı'}
                    <input
                      type="number"
                      min="0"
                      value={targetValue}
                      onChange={(event) => setTargetValue(event.target.value)}
                      placeholder={ruleType === 'TARGET_PRICE' ? '45000' : '15'}
                    />
                  </label>
                </div>
                <button className="primary-action" disabled={!canCreateAlarm} onClick={handleCreateAlarm} type="button">
                  <Bell size={18} />
                  Alarmı baslat
                </button>
              </>
            ) : (
              <div className="empty-state">Katalogdan bir urun sec.</div>
            )}
          </section>
        </section>

        {/* Sağ Panel: Aktif Alarmlar */}
        <aside className="side-panel alarms-sidebar">
          <div className="panel-title">
            <Bell size={18} />
            <h2>Aktif alarmlar</h2>
          </div>
          <div className="alarm-list">
            {alarms.length === 0 ? (
              <div className="empty-state">Henuz alarm yok.</div>
            ) : (
              alarms.map((alarm) => (
                <article className="alarm-row" key={alarm.id}>
                  <div>
                    <strong>{alarm.productName}</strong>
                    <span>{alarm.isActive ? 'Aktif' : 'Tetiklendi'}</span>
                  </div>
                  <div>
                    <span>Baslangic: {formatPrice(alarm.initialPrice)}</span>
                    <span>Guncel: {formatPrice(alarm.currentPrice)}</span>
                  </div>
                  <Trash2 size={18} />
                </article>
              ))
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
