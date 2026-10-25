// 1. Statik Veritabanımız (Arama testleri için genişletildi)
// 1. Veritabanı Değişkeni (Başlangıçta boş, JSON'dan dolacak)
let laptopVeritabani = {};

// 2. Fetch API ile JSON dosyasını okuma
fetch("cihazlar.json")
    .then(cevap => cevap.json())
    .then(veri => {
        laptopVeritabani = veri;
        console.log("Cihaz veritabanı başarıyla çekildi!");
    })
    .catch(hata => {
        console.error("Veri çekme hatası:", hata);
    });

// ... app.js dosyasının geri kalanı (Fiyatlar, arama çubuğu ve buton kontrolleri) tamamen aynı kalacak.

// 2. Fiyatlandırma Veritabanı
const fiyatVeritabani = {
    ram: { "DDR4": 50, "DDR5": 80 },
    ssd: { "SATA": 2, "NVMe": 3 },
    iscilik: 500
};

// --- YENİ EKLENEN KISIM: AKILLI ARAMA ÇUBUĞU (LIVE SEARCH) ---
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const hiddenLaptopModel = document.getElementById("laptopModel");

searchInput.addEventListener("input", function() {
    const query = this.value.toLowerCase().trim(); // Yazılanı küçük harfe çevir
    searchResults.innerHTML = ""; // Her harf basıldığında eski sonuçları temizle

    if (query.length === 0) return; // Kutu boşsa işlem yapma

    let matchCount = 0;

    for (const key in laptopVeritabani) {
        const device = laptopVeritabani[key];
        // Cihazın marka ve modelini birleştirip aramaya uygun hale getiriyoruz
        const searchString = `${device.brand} ${device.model}`.toLowerCase();

        // Eğer yazılan kelime bu cihazın içinde geçiyorsa listeye ekle
        if (searchString.includes(query)) {
            const listItem = document.createElement("a");
            listItem.href = "#";
            listItem.className = "list-group-item list-group-item-action fw-bold text-dark";
            listItem.innerText = `${device.brand} ${device.model}`;
            
            // Kullanıcı listedeki cihaza tıkladığında çalışacak kod:
            listItem.addEventListener("click", function(e) {
                e.preventDefault(); // Sayfanın yukarı zıplamasını engelle
                searchInput.value = `${device.brand} ${device.model}`; // Görünen kutuya tam adı yaz
                hiddenLaptopModel.value = key; // Hesaplama algoritması için gizli alana cihazın kodunu kaydet
                searchResults.innerHTML = ""; // Seçim yapıldıktan sonra alt listeyi kapat
            });

            searchResults.appendChild(listItem);
            matchCount++;
        }
    }

    // Eğer hiçbir eşleşme bulunamazsa uyarı göster
    if (matchCount === 0) {
        searchResults.innerHTML = `<div class="list-group-item text-muted">Cihaz bulunamadı...</div>`;
    }
});
// -----------------------------------------------------------

// 3. Hesaplama Algoritması
const calculateBtn = document.getElementById("calculateBtn");
const resultBox = document.getElementById("resultBox");
const resultAlert = document.getElementById("resultAlert");

calculateBtn.addEventListener("click", function() {
    const selectedDeviceKey = document.getElementById("laptopModel").value;
    const newRamSize = parseInt(document.getElementById("ramSize").value);
    const newRamType = document.getElementById("ramType").value;
    const newRamFreq = parseInt(document.getElementById("ramFreq").value);
    const newSsdSize = parseInt(document.getElementById("ssdSize").value);
    const newSsdType = document.getElementById("ssdType").value;

    if (!selectedDeviceKey) {
        gosterUyari("Lütfen arama çubuğundan bir cihaz seçin.", "danger");
        return;
    }
    if (isNaN(newRamSize) || isNaN(newRamFreq) || isNaN(newSsdSize)) {
        gosterUyari("Lütfen tüm donanım kapasite ve frekans değerlerini doldurun.", "danger");
        return;
    }

    const device = laptopVeritabani[selectedDeviceKey];
    const totalRam = device.baseRam + newRamSize;

    if (totalRam > device.maxRam) {
        gosterUyari(`Hata: Anakart sınırı aşıldı! Maksimum destek: ${device.maxRam} GB.`, "danger");
        return;
    }
    if (newRamType !== device.supportedType) {
        gosterUyari(`Donanım Uyumsuzluğu: Anakart ${device.supportedType} soketine sahip.`, "danger");
        return;
    }
    if (newRamFreq !== device.supportedFreq) {
        gosterUyari(`Performans Uyarısı: Optimum frekans ${device.supportedFreq} MHz olmalıdır.`, "warning");
        return;
    }
    if (newSsdType === "NVMe" && device.hasM2Slot === false) {
        gosterUyari(`Uyumsuzluk: M.2 NVMe yuvası bulunmuyor.`, "danger");
        return;
    }
    if (newSsdType === "SATA" && device.hasSataSlot === false) {
        gosterUyari(`Uyumsuzluk: Eski nesil 2.5 inç SATA yuvası bulunmuyor.`, "danger");
        return;
    }

    const ramMaliyeti = newRamSize * fiyatVeritabani.ram[newRamType];
    const ssdMaliyeti = newSsdSize * fiyatVeritabani.ssd[newSsdType];
    const toplamFiyat = ramMaliyeti + ssdMaliyeti + fiyatVeritabani.iscilik;

    const basariMesaji = `
        Sistem Yükseltmesi Başarılı! Toplam belleğiniz ${totalRam} GB olacak ve ${newSsdSize} GB ${newSsdType} SSD takılacaktır.
        <hr>
        <strong>Tahmini Maliyet Tablosu:</strong><br>
        - Yeni RAM: ${ramMaliyeti} TL<br>
        - Yeni SSD: ${ssdMaliyeti} TL<br>
        - İşçilik/Montaj: ${fiyatVeritabani.iscilik} TL<br>
        <h5 class="mt-2 text-success">Toplam Tahmini Tutar: ${toplamFiyat} TL</h5>
    `;

    gosterUyari(basariMesaji, "success");
});

function gosterUyari(mesaj, tip) {
    resultBox.classList.remove("d-none");
    resultAlert.className = "alert";
    resultAlert.classList.add(`alert-${tip}`);
    resultAlert.innerHTML = mesaj;
}

// 4. Karanlık Mod (Dark Mode) Kontrolü
const darkModeToggle = document.getElementById("darkModeToggle");
const htmlElement = document.documentElement; 

darkModeToggle.addEventListener("click", function() {
    if (htmlElement.getAttribute("data-bs-theme") === "dark") {
        htmlElement.removeAttribute("data-bs-theme");
        darkModeToggle.innerHTML = "🌙 Karanlık Mod";
    } else {
        htmlElement.setAttribute("data-bs-theme", "dark");
        darkModeToggle.innerHTML = "☀️ Aydınlık Mod";
    }
});