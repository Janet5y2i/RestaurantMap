import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useMap } from 'react-leaflet'; 
import.meta.env.VITE_API_URL
import Select from "react-select"

// 修正 Leaflet 預設圖標（icon）在 React/Vite 中顯示不出來的小問題
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';


/*** 
let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]

});
***/

// 1. 定義顏色對照表
const typeColorMap = {
  "日餐": "#FF5733", 
  "義餐": "#2ECC71", 
  "法餐": "#3498DB",
  "咖啡": "#E67E22",  
  "台灣餐廳": "#E91E63",
  "中餐": "#C0392B", 
  "牛排館": "#5cb6bd",   
  "手搖飲": "#9B59B6",
  "酒吧": "#b7d77e",
  "馬來餐": "#967648",
  "西班牙餐": "#ccd548",
  "精緻料理": "#c08585",
  "甜點": "#c085a5",
  "中東餐": "#6f916f",
  "韓餐": "#5ca4d4",
  "泰餐": "#6fa46b",
  "default": "#95A5A6"   
};

// 2. 建立動態 Icon 產生器
const createCustomIcon = (type, isSelected) => {
  const color = typeColorMap[type] || typeColorMap.default;
  const size = isSelected ? 35 : 25; // 選中時放大
  
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      display: flex;
      justify-content: center;
      align-items: center;
    ">
      <div style="
        width: 6px;
        height: 6px;
        background: white;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size]
  });
};

//L.Marker.prototype.options.icon = DefaultIcon;

let HighlightIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [30, 50],
    iconAnchor: [15, 50],
    className: 'highlighted-marker' // 這裡可以用 CSS 來定義特殊樣式

})

function MapRecenter({ lat, lng }) {
  const map = useMap(); // 取得地圖實例

  useEffect(() => {
    if (lat && lng) {
      // 呼叫 Leaflet 的 flyTo 方法
      // [緯度, 經度], 縮放等級, 動畫設定
      map.flyTo([lat, lng], 16, {
        animate: true,
        duration: 1.5 // 飛行時間（秒）
      });
    }
  }, [lat, lng, map]); // 當座標改變時觸發

  return null; // 這個組件不需要畫出任何東西
}


function App() {
  const [count, setCount] = useState(0)
  const [restaurants, setRestaurants] = useState([])
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantDetail, setRestaurantDetail] = useState(null);
  const [keyWord, setKeyword] = useState("");
  const [selectCategory, setSelectCategory] = useState([]);
  const [selectArea, setSelectArea] = useState([]);
  const [selectPriceRange, setSelectPriceRange] = useState([]);
  const [isMapFull, setIsMapFull] = useState(false);
  const filteredRestaurants = restaurants.filter(res => {
    const matchesKeyword = res.name.toLowerCase().includes(keyWord.toLowerCase()) || 
                          res.summary?.toLowerCase().includes(keyWord.toLowerCase());

    // 【修改】改成檢查 selectCategory 裡的 value 物件
    const matchesCategory = selectCategory.length === 0 || 
                            selectCategory.some(item => item.value === res.type);

    // 【修改】地區多選
    const matchesArea = selectArea.length === 0 || 
                        selectArea.some(item => item.value === res.area);

    // 【修改】價位多選
    const matchesPriceRange = selectPriceRange.length === 0 || 
                            selectPriceRange.some(item => item.value === res.priceRange);

    return matchesKeyword && matchesCategory && matchesArea && matchesPriceRange;
  });
  const categories = [...new Set(restaurants.map(res => res.type))].sort();
  const areas = [...new Set(restaurants.map(res => res.area))].sort();
  const priceRanges = [...new Set(restaurants.map(res => res.priceRange))].sort();
  useEffect(() => {
    // 使用 import.meta.env 讀取 Vite 的環境變數
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5014/api";

    fetch(`${apiUrl}/restaurants`)
      .then(res => res.json())
      .then(data => setRestaurants(data))
      .catch(err => console.error("Error fetching restaurants:", err));
  }, []);


  const toggleMapSize = () => {
    setIsMapFull(!isMapFull);
  };
  return (
    <>
    {/*TITLE*/}

  <div className="container-fluid mt-4">
    <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded shadow-sm">
      
      

      {/* 2. 右側標題 */}
      <div className="text-end">
        <h1 className="h3 mb-0">📍榛知 雪梨台灣美食地圖</h1>
        {/* 💡 建議將 display-4 改為 h3，因為 display-4 在手機版會太大，可能導致按鈕被擠開 */}
      </div>

      {/* 1. 左側按鈕 */}
      <div>
        <button 
          className="btn btn-outline-secondary" 
          onClick={() => window.open('https://cake-elk-d3e.notion.site/3572fd440dd7809b8d7bf02a1ecb960c?pvs=105', '_blank')}
        >
          ✋ 我要推薦
        </button>
      </div>

    </div>
  </div>
<div className="container-fluid p-0">
  <div className="row mb-4 p-3 bg-light rounded shadow-sm align-items-center">
    {/* 1. 關鍵字搜尋 */}
    <div className="col-md-3">
      <input 
        type="text" 
        className="form-control" 
        placeholder="搜尋餐廳名稱、簡介..." 
        value={keyWord} 
        onChange={(e) => setKeyword(e.target.value)} 
      />
    </div>

    {/* 2. 餐廳類別多選 */}
    <div className="col-md-3">
      <Select
        isMulti                  // 啟用多選
        isClearable              // 啟用一鍵清除 (Mentor 提的 Clear 功能)
        options={categoryOptions} // 傳入格式化後的選項
        value={selectCategory}   // 綁定狀態
        onChange={setSelectCategory} // 當選取改變時，直接更新狀態（它會自己傳入新陣列）
        placeholder="--- 選擇餐廳類別 ---"
        className="shadow-sm"
      />
    </div>

    {/* 3. 地區多選 */}
    <div className="col-md-3">
      <Select
        isMulti
        isClearable
        options={areaOptions}
        value={selectArea}
        onChange={setSelectArea}
        placeholder="--- 選擇地區 ---"
        className="shadow-sm"
      />
    </div>

    {/* 4. 價位多選 */}
    <div className="col-md-3">
      <Select
        isMulti
        isClearable
        options={priceOptions}
        value={selectPriceRange}
        onChange={setSelectPriceRange}
        placeholder="--- 選擇價位 ---"
        className="shadow-sm"
      />
    </div>
  </div>
</div>
      <div className="row"> 
        
        {/* left hand side - restaurant list */}
        <div className="col-md-4" style={{ height: '90vh', overflowY: 'auto' }}>
          {filteredRestaurants.map(res => (
            <div key={res.id} id={`card-${res.id}`} 
              className={'card mb-3 shadow-sm transition-all ' + (selectedRestaurant?.id === res.id ? 'border-primary bg-light-blue' : '')}>
              <div className="card-body">
                <h5 className="card-title">
                  <a
                    href = {res.googleMapsLink || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-decoration-none text-dark hover-primary"
                  >
                  {res.name}<i className="fa-solid fa-arrow-up-right-from-square ms-1" style={{fontSize: '0.8rem'}}></i>
                    </a>
                  </h5>
                <p className="card-text">餐廳簡介：{res.summary}</p>
                <p className="card-text text-muted small">
                  {[...(res.tags || []), res.priceRange]
                    .filter(item => item && item !== "")
                    .join(' | ')}
                </p>
                <div className="d-flex gap-2 justify-content-center">
                  <button 
                    className="btn btn-outline-primary" 
                    onClick={() => setRestaurantDetail(res)}
                  >
                    查看詳情
                  </button>

                  <button
                    className="btn btn-outline-success"
                    onClick={ () => setSelectedRestaurant(res) }
                    title="在地圖上查看"
                    >
                      <i className="fa-solid fa-location-dot"></i> {/* use pin icon */}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* right hand side - map */}
        <div className="col-md-8"> 
          <MapContainer
            center={[-33.8688, 151.2093]} 
            zoom={13} 
            style={{ height: '90vh', width: '100%', borderRadius: '10px' }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {selectedRestaurant && (
              <MapRecenter
                lat={selectedRestaurant.coordinates[0]}
                lng={selectedRestaurant.coordinates[1]}
                />
            )

            }
            {filteredRestaurants.map(res => (
              <Marker 
                key={res.id} position={[res.coordinates[0], res.coordinates[1]]}
                icon={createCustomIcon(res.type, selectedRestaurant?.id === res.id)}
                /*icon={selectedRestaurant?.id === res.id ? HighlightIcon : DefaultIcon}*/
                eventHandlers={{
                  click: () => {
                    setSelectedRestaurant(res);
                    document.getElementById(`card-${res.id}`)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center'
                    });
                  },
                }}
                >
                <Popup>
                  <h6>{res.name}</h6>
                  <p>{res.summary}</p>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

      </div> {/* 這裡是 row 的結束 */}


      
      {restaurantDetail && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                {/* 使用 ?. (Optional Chaining) 更安全 */}
                <h5 className="modal-title">{restaurantDetail?.name}</h5>
                <button
                  type="button" 
                  className="btn-close" 
                  onClick={() => setRestaurantDetail(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p><strong>簡介：</strong>{restaurantDetail?.description}</p>
                <p><strong>價位：</strong>{restaurantDetail?.priceRange}</p>
                <p><strong>推薦菜色：</strong>{restaurantDetail?.recommendedDishes?.join(', ')}</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setRestaurantDetail(null)}>關閉</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </>
  )
}

export default App
