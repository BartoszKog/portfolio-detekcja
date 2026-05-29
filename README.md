# Detekcja samochodów na ortofotomapach lotniczych

Interaktywna prezentacja projektu inżynierskiego dotyczącego automatycznej detekcji samochodów na bardzo wysokorozdzielczych ortofotomapach lotniczych Krakowa.

Projekt łączy część badawczą z zakresu computer vision i GIS z aplikacją webową prezentującą wyniki detekcji, mapy gęstości oraz zmianę rozmieszczenia pojazdów między analizowanymi latami.

**Autor:** Bartosz Kogutowicz  
**Projekt inżynierski:** Detekcja samochodów na bardzo wysokorozdzielczych ortofotomapach lotniczych  
**Kierunek:** Informatyka Geoprzestrzenna, AGH

## Najważniejsze funkcje

- Interaktywna mapa wyników detekcji pojazdów dla lat 2023 i 2025.
- Przełączanie między ortofotomapą, mapą gęstości i punktami detekcji.
- Warstwa różnicowa pokazująca zmianę gęstości pojazdów między latami.
- Dynamiczna widoczność warstw zależna od poziomu przybliżenia mapy.
- Opis potoku badawczego: preprocessing, trening, ewaluacja i inferencja GIS.
- Dokumentacja eksperymentów ML w formie notebooków Jupyter.

## Technologie

### Aplikacja webowa

- Vite
- TypeScript
- Tailwind CSS
- OpenLayers
- PROJ4JS

### Część badawcza i GIS

- YOLO11 OBB
- SAHI
- TensorRT FP16
- Python
- rasterio
- SciPy / cKDTree
- QGIS

## Dane i źródła

Projekt wykorzystuje ortofotomapy oraz dane przestrzenne Krakowa jako materiał źródłowy do analizy. Surowe rastry oraz pełne dane treningowe nie są dołączone do repozytorium ze względu na rozmiar oraz ograniczenia licencyjne.

W repozytorium znajdują się wybrane wyniki, wizualizacje, notebooki badawcze i materiały potrzebne do prezentacji projektu. Dane przestrzenne, ortofotomapy, zbiory badawcze oraz materiały pochodne mogą podlegać osobnym licencjom i warunkom wykorzystania ich dostawców, w szczególności MSIP Kraków, Geoportalu/GUGiK oraz zbioru EAGLE.

## Struktura projektu

```text
.
├── public/                    # Dane i zasoby używane przez aplikację webową
├── src/                       # Kod źródłowy aplikacji frontendowej
├── ml_research/               # Notebooki dokumentujące część badawczą
├── index.html                 # Główna struktura strony
├── package.json               # Skrypty i zależności projektu
└── README.md
```

## Uruchomienie lokalne

Wymagane jest środowisko Node.js oraz npm.

Instalacja zależności:

```bash
npm install
```

Uruchomienie środowiska deweloperskiego:

```bash
npm run dev
```

Build produkcyjny:

```bash
npm run build
```

Podgląd buildu:

```bash
npm run preview
```

## Licencja

Kod źródłowy tej aplikacji oraz autorskie skrypty projektowe są udostępnione na licencji MIT. Szczegóły znajdują się w pliku [LICENSE](LICENSE).

Dane przestrzenne, ortofotomapy, zbiory badawcze, wyniki detekcji oraz materiały pochodne mogą podlegać osobnym licencjom i warunkom wykorzystania ich właścicieli oraz dostawców. Licencja MIT nie obejmuje automatycznie zewnętrznych danych, modeli, bibliotek ani materiałów źródłowych użytych do przygotowania analizy.
