========================================================================
PRACA DYPLOMOWA
Autor: Bartosz Szczepan Kogutowicz
Temat: Detekcja samochodów na bardzo wysokorozdzielczych ortofotomapach lotniczych
Uczelnia: Akademia Górniczo-Hutnicza w Krakowie
Wydział Geodezji Górniczej i Inżynierii Środowiska
Rok: 2026
========================================================================

1. OPIS ZAWARTOŚCI ARCHIWUM
------------------------------------------------------------------------
Niniejsze archiwum zawiera kompletny kod źródłowy projektu oraz pliki 
wynikowe analizy przestrzennej. Kod został przygotowany w formie 
interaktywnych notatników Jupyter Notebook (.ipynb), podzielonych 
tematycznie według etapów realizacji pracy.

Ze względu na ograniczenia licencyjne oraz rozmiar plików (kilkaset GB), 
archiwum NIE zawiera surowych danych wejściowych (zbiór EAGLE, 
ortofotomapy z Geoportalu).

2. STRUKTURA KATALOGÓW
------------------------------------------------------------------------

[preprocessing]
Katalog zawiera notatniki odpowiedzialne za przygotowanie i czyszczenie danych:
- 01_eagle_xml_to_yolo_obb.ipynb: Parsowanie surowych etykiet XML (EAGLE) 
  i konwersja współrzędnych do formatu YOLO OBB.
- 02_tiling_with_overlap.ipynb: Implementacja algorytmu kafelkowania 
  (tiling) dużych obrazów z zastosowaniem zakładki.
- 03_data_cleaning_and_filtering.ipynb: Skrypt oczyszczający dane 
  (usuwanie obiektów o niskiej rozdzielczości, redukcja nadmiaru tła).

[training]
Katalog dokumentujący eksperymenty treningowe:
- 01_train_yolo11n_50ep_full_finetune.ipynb: Eksperyment 1 - Model Nano, 
  50 epok, pełne douczanie (rozwiązanie wybrane jako optymalne).
- 02_train_yolo11n_100ep_full_finetune.ipynb: Eksperyment 2 - Model Nano, 
  100 epok (weryfikacja długości treningu).
- 03_train_yolo11m_35ep_frozen_backbone.ipynb: Eksperyment 3 - Model Medium, 
  zamrożony szkielet (weryfikacja pojemności modelu).

[evaluation]
Katalog z notatnikami weryfikującymi skuteczność i wydajność:
- 01_val_test_set_yolo11n_50ep.ipynb: Walidacja na zbiorze testowym 
  dla modelu Nano (50 epok).
- 02_val_test_set_yolo11n_100ep.ipynb: Walidacja na zbiorze testowym 
  dla modelu Nano (100 epok).
- 03_val_test_set_yolo11m_frozen.ipynb: Walidacja na zbiorze testowym 
  dla modelu Medium.
- 04_geoportal_validation.ipynb: Walidacja na danych rzeczywistych z Geoportalu 
  (Kraków 2013/2025) oraz wyznaczanie krzywych F1-score.
- 05_export_and_speed_benchmark.ipynb: Eksport modelu do formatu TensorRT 
  oraz benchmark porównawczy wydajności (FPS).

[inference]
Katalog z implementacją silnika wnioskującego (GIS):
- 01_inference_gis_pipeline.ipynb: Zintegrowany potok przetwarzania.
  Realizuje: Odczyt okienkowy GeoTIFF -> Wnioskowanie (SAHI + TensorRT) -> 
  Filtrację duplikatów (cKDTree) -> Zapis wyników do formatu GeoJSON.

3. INSTRUKCJA URUCHOMIENIA I UWAGI
------------------------------------------------------------------------
Aby zapoznać się z kodem, zalecane jest otwarcie plików .ipynb 
w środowisku Jupyter Lab, VS Code lub Google Colab.

UWAGA: W kodzie źródłowym zachowano oryginalne ścieżki dostępowe do plików 
(np. /content/drive/MyDrive/...), odzwierciedlające strukturę katalogów 
w środowisku Google Colab w momencie przeprowadzania obliczeń. 
Zachowano również oryginalne wyjścia komórek, aby zademonstrować 
rzeczywisty przebieg procesu uczenia.

W przypadku chęci ponownego uruchomienia procesu, konieczna jest 
aktualizacja ścieżek do danych wejściowych w komórkach notatników.