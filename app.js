// 1. Veritabanı Değişkeni ve Fetch API
let laptopVeritabani = {};

fetch("cihazlar.json")
    .then(cevap => cevap.json())
    .then(veri => {
        laptopVeritabani = veri;
    })
    .catch(hata => console.error("Veri çekme hatası:", hata));

// 2. Fiyatlandırma Veritabanı
const fiyatVeritabani = {
    ram: { "DDR4": 50, "DDR5": 80 },
    ssd: { "SATA": 2, "NVMe": 3 },
    iscilik: 500
};

// 3. Akıllı Arama Çubuğu (Live Search)
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const hiddenLaptopModel = document.getElementById("laptopModel");

searchInput.addEventListener("input", function() {
    const query = this.value.toLowerCase().trim();
    searchResults.innerHTML = "";

    if (query.length === 0) return;

    let matchCount = 0;
    for (const key in laptopVeritabani) {
        const device = laptopVeritabani[key];
        const searchString = `${device.brand} ${device.model}`.toLowerCase();

        if (searchString.includes(query)) {
            const listItem = document.createElement("a");
            listItem.href = "#";
            listItem.className = "list-group-item list-group-item-action fw-bold text-dark";
            listItem.innerText = `${device.brand} ${device.model}`;
            
            listItem.addEventListener("click", function(e) {
                e.preventDefault();
                searchInput.value = `${device.brand} ${device.model}`;
                hiddenLaptopModel.value = key;
                searchResults.innerHTML = "";
            });

            searchResults.appendChild(listItem);
            matchCount++;
        }
    }

    if (matchCount === 0) {
        searchResults.innerHTML = `<div class="list-group-item text-muted">Cihaz bulunamadı...</div>`;
    }
});

// 4. ESNEK HESAPLAMA ALGORİTMASI (Sadece RAM, sadece SSD veya İkisi)
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

    const device = laptopVeritabani[selectedDeviceKey];
    
    // Kullanıcı hangi parçaları girmek istemiş? (Boş değilse ve 0'dan büyükse true olur)
    const isRamUpgrading = !isNaN(newRamSize) && newRamSize > 0;
    const isSsdUpgrading = !isNaN(newSsdSize) && newSsdSize > 0;

    if (!isRamUpgrading && !isSsdUpgrading) {
        gosterUyari("Lütfen yükseltmek istediğiniz RAM veya SSD kapasitesinden en az birini girin.", "warning");
        return;
    }

    let toplamFiyat = fiyatVeritabani.iscilik; // Sabit işçilik
    let basariMesaji = "Sistem Yükseltmesi Başarılı!<br>";
    let maliyetDetayi = `<strong>Tahmini Maliyet Tablosu:</strong><br>- İşçilik/Montaj: ${fiyatVeritabani.iscilik} TL<br>`;

    // SADECE RAM GİRİLDİYSE BU BLOK ÇALIŞIR
    if (isRamUpgrading) {
        if (isNaN(newRamFreq)) {
            gosterUyari("Lütfen ekleyeceğiniz RAM'in frekansını (MHz) girin.", "danger");
            return;
        }
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

        const ramMaliyeti = newRamSize * fiyatVeritabani.ram[newRamType];
        toplamFiyat += ramMaliyeti;
        basariMesaji += `- Toplam belleğiniz sorunsuz şekilde <b>${totalRam} GB</b> olacak.<br>`;
        maliyetDetayi += `- Yeni RAM: ${ramMaliyeti} TL<br>`;
    }

    // SADECE SSD GİRİLDİYSE VEYA RAM'E EK OLARAK GİRİLDİYSE BU BLOK ÇALIŞIR
    if (isSsdUpgrading) {
        if (newSsdType === "NVMe" && device.hasM2Slot === false) {
            gosterUyari(`Uyumsuzluk: M.2 NVMe yuvası bulunmuyor.`, "danger");
            return;
        }
        if (newSsdType === "SATA" && device.hasSataSlot === false) {
            gosterUyari(`Uyumsuzluk: Eski nesil 2.5 inç SATA yuvası bulunmuyor.`, "danger");
            return;
        }

        const ssdMaliyeti = newSsdSize * fiyatVeritabani.ssd[newSsdType];
        toplamFiyat += ssdMaliyeti;
        basariMesaji += `- Sisteme <b>${newSsdSize} GB ${newSsdType}</b> SSD eklenecektir.<br>`;
        maliyetDetayi += `- Yeni SSD: ${ssdMaliyeti} TL<br>`;
    }

    // SONUÇLARI BİRLEŞTİR VE EKRANA BAS
    const finalMesaj = `
        ${basariMesaji}
        <hr>
        ${maliyetDetayi}
        <h5 class="mt-2 text-success">Toplam Tahmini Tutar: ${toplamFiyat} TL</h5>
    `;

    gosterUyari(finalMesaj, "success");
});

function gosterUyari(mesaj, tip) {
    resultBox.classList.remove("d-none");
    resultAlert.className = "alert";
    resultAlert.classList.add(`alert-${tip}`);
    resultAlert.innerHTML = mesaj;
}

// 5. Karanlık Mod (Dark Mode) Kontrolü
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
