interface EngineeringLink {
  label: string;
  href: string;
}

interface EngineeringFigure {
  src: string;
  alt: string;
  caption: string;
  /** CSS length, e.g. '42rem', '720px'. Falls back to DEFAULT_FIGURE_MAX_WIDTH. */
  maxWidth?: string;
}

/** Default cap for figure width on wide viewports — override per figure via maxWidth. */
const DEFAULT_FIGURE_MAX_WIDTH = '40rem';

interface EngineeringParagraph {
  /** Supports HTML entities, e.g. &nbsp; for a non-breaking space. */
  text: string;
  links?: EngineeringLink[];
}

interface EngineeringBullet {
  title: string;
  text: string;
}

interface EngineeringAction {
  label: string;
  href: string;
  icon?: string;
  variant?: 'indigo' | 'emerald';
}

interface EngineeringSubsection {
  title: string;
  paragraphs: EngineeringParagraph[];
  bullets?: EngineeringBullet[];
  actions?: EngineeringAction[];
  figure?: EngineeringFigure;
}

interface EngineeringBlock {
  title: string;
  subsections: EngineeringSubsection[];
}

const EXTERNAL_LINK_CLASS =
  'font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-2 transition hover:text-indigo-900';

const ACTION_BUTTON_CLASSES: Record<NonNullable<EngineeringAction['variant']>, string> = {
  indigo:
    'inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-5 py-2.5 text-sm font-semibold text-indigo-800 shadow-sm transition hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2',
  emerald:
    'inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2',
};

/** External URLs for the resources block — update before publishing. */
const RESOURCE_HREFS = {
  github:
    'https://github.com/BartoszKog/portfolio-detekcja/tree/main/ml_research/Kod_zrodlowy_Kogutowicz',
  roboflowGsd5cm: 'https://universe.roboflow.com/projectagh/krakow-aerial-vehicles-gsd_0_05m',
  roboflowGsd10cm: 'https://universe.roboflow.com/projectagh/krakow-aerial-vehicles-gsd_0_1m',
} as const;

function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}

/** Decodes HTML entities such as &nbsp; into real Unicode characters. */
function decodeHtmlEntities(text: string): string {
  const element = document.createElement('textarea');
  element.innerHTML = text;
  return element.value;
}

function appendTextContent(parent: HTMLElement, text: string): void {
  if (text.length === 0) {
    return;
  }

  parent.append(decodeHtmlEntities(text));
}

function createExternalLink(link: EngineeringLink): HTMLAnchorElement {
  const anchor = document.createElement('a');
  anchor.href = link.href;
  anchor.textContent = link.label;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.className = EXTERNAL_LINK_CLASS;
  return anchor;
}

function appendParagraphWithLinks(
  container: HTMLElement,
  text: string,
  links: EngineeringLink[],
): void {
  const paragraph = document.createElement('p');
  paragraph.className = 'text-slate-600 leading-relaxed';

  let remainingText = text;

  for (const link of links) {
    const placeholder = `{${link.label}}`;
    const splitIndex = remainingText.indexOf(placeholder);

    if (splitIndex === -1) {
      continue;
    }

    if (splitIndex > 0) {
      appendTextContent(paragraph, remainingText.slice(0, splitIndex));
    }

    paragraph.append(createExternalLink(link));
    remainingText = remainingText.slice(splitIndex + placeholder.length);
  }

  appendTextContent(paragraph, remainingText);

  container.append(paragraph);
}

function appendPlainParagraph(container: HTMLElement, text: string): void {
  const paragraph = document.createElement('p');
  paragraph.className = 'text-slate-600 leading-relaxed';
  appendTextContent(paragraph, text);
  container.append(paragraph);
}

function appendFigure(container: HTMLElement, figure: EngineeringFigure): void {
  const figureElement = document.createElement('figure');
  figureElement.className =
    'mx-auto w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm';
  figureElement.style.maxWidth = figure.maxWidth ?? DEFAULT_FIGURE_MAX_WIDTH;

  const image = document.createElement('img');
  image.src = figure.src;
  image.alt = figure.alt;
  image.loading = 'lazy';
  image.className = 'block h-auto w-full max-w-full';

  const caption = document.createElement('figcaption');
  caption.className = 'border-t border-slate-200 px-4 py-3 text-sm text-slate-500';
  caption.textContent = decodeHtmlEntities(figure.caption);

  figureElement.append(image, caption);
  container.append(figureElement);
}

function appendBulletList(container: HTMLElement, bullets: EngineeringBullet[]): void {
  const list = document.createElement('ul');
  list.className = 'space-y-3 text-sm leading-relaxed text-slate-700';

  for (const bullet of bullets) {
    const item = document.createElement('li');

    const title = document.createElement('strong');
    title.className = 'text-slate-900';
    title.textContent = `${bullet.title}: `;

    item.append(title, decodeHtmlEntities(bullet.text));
    list.append(item);
  }

  container.append(list);
}

function appendActions(container: HTMLElement, actions: EngineeringAction[]): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex flex-wrap gap-3 pt-1';

  for (const action of actions) {
    const anchor = document.createElement('a');
    anchor.href = action.href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.className = ACTION_BUTTON_CLASSES[action.variant ?? 'indigo'];

    if (action.icon) {
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = action.icon;
      anchor.append(icon);
    }

    anchor.append(decodeHtmlEntities(action.label));
    wrapper.append(anchor);
  }

  container.append(wrapper);
}

function renderSubsection(subsection: EngineeringSubsection): HTMLElement {
  const article = document.createElement('article');
  article.className = 'space-y-4';

  const heading = document.createElement('h3');
  heading.className = 'text-xl font-bold text-slate-800';
  heading.textContent = subsection.title;
  article.append(heading);

  const body = document.createElement('div');
  body.className = 'space-y-4';

  for (const paragraph of subsection.paragraphs) {
    if (paragraph.links && paragraph.links.length > 0) {
      appendParagraphWithLinks(body, paragraph.text, paragraph.links);
    } else {
      appendPlainParagraph(body, paragraph.text);
    }
  }

  if (subsection.bullets && subsection.bullets.length > 0) {
    appendBulletList(body, subsection.bullets);
  }

  article.append(body);

  if (subsection.actions && subsection.actions.length > 0) {
    appendActions(article, subsection.actions);
  }

  if (subsection.figure) {
    appendFigure(article, subsection.figure);
  }

  return article;
}

function renderEngineeringBlock(block: EngineeringBlock): HTMLElement {
  const section = document.createElement('section');
  section.className =
    'rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 space-y-8';

  const heading = document.createElement('h3');
  heading.className = 'text-2xl font-bold text-slate-800 border-b border-slate-200 pb-3';
  heading.textContent = block.title;
  section.append(heading);

  for (const subsection of block.subsections) {
    section.append(renderSubsection(subsection));
  }

  return section;
}

/**
 * Content for narrative engineering blocks rendered under "Rozwiązanie Inżynierskie i Wyniki".
 *
 * How to add a new block:
 * 1. Append a new object to this array (order = display order on the page).
 * 2. Set `title` — main heading of the card.
 * 3. Add one or more `subsections`, each with:
 *    - `title` — subheading,
 *    - `paragraphs` — array of `{ text, links? }`,
 *    - optional `bullets` — array of `{ title, text }` for labelled list items,
 *    - optional `actions` — array of `{ label, href, icon?, variant? }` CTA buttons,
 *    - optional `figure` — `{ src, alt, caption, maxWidth? }`.
 *
 * Links: use `{Label}` in `text` and define matching `label` + `href` in `links`.
 * Example: text: '… architekturze {SAHI} …', links: [{ label: 'SAHI', href: 'https://…' }].
 *
 * Typography: HTML entities work in text and captions, e.g. `20&nbsp;000` (non-breaking space).
 * Images: place files in `public/assets/` and resolve them with `assetUrl`.
 * Optional `maxWidth` caps width on large screens
 * (CSS length, e.g. `'35rem'`); omit to use DEFAULT_FIGURE_MAX_WIDTH above.
 */
const ENGINEERING_BLOCKS: EngineeringBlock[] = [
  {
    title: 'Inżynieria Danych i Reprezentacja Przestrzenna',
    subsections: [
      {
        title: 'Precyzyjna detekcja w gęstej zabudowie (HBB vs. OBB)',
        paragraphs: [
          {
            text: 'Standardowe poziome ramki otaczające (HBB) zawodzą w przypadku analizy zdjęć lotniczych obszarów miejskich. Samochody parkujące pod różnymi kątami lub blisko siebie powodują drastyczne nakładanie się ramek HBB, co uniemożliwia modelowi poprawne rozróżnienie pojedynczych instancji. Dlatego konieczne było zastosowanie zorientowanych ramek otaczających ({OBB}).',
            links: [
              {
                label: 'OBB',
                href: 'https://docs.ultralytics.com/tasks/obb/',
              },
            ],
          },
          {
            text: 'Wymagało to stworzenia autorskiego potoku przetwarzania (Data Pipeline) dla zbioru docelowego {EAGLE}. Niestandardowe etykiety zapisane w formacie XML (definiujące obiekty jako 5-punktowe poligony) zostały algorytmicznie przekonwertowane do formatu OBB obsługiwanego przez sieć YOLO, z uwzględnieniem matematycznej korekty układu współrzędnych w zależności od wertykalnej lub horyzontalnej orientacji obrazu.',
            links: [
              {
                label: 'EAGLE',
                href: 'https://doi.org/10.1109/ICPR48806.2021.9412353',
              },
            ],
          },
        ],
        figure: {
          src: assetUrl('assets/fig_comparison.png'),
          alt: 'Schemat porównania ramek HBB i OBB na ortofotomapie miejskiej',
          caption: 'Porównanie metod reprezentacji obiektów w detekcji. Panel (A) przedstawia schemat geometryczny z uwzględnieniem kąta rotacji θ. Panel (B) ilustruje weryfikację na rzeczywistym obrazie: ramki zorientowane (OBB czerwone) precyzyjnie separują sąsiednie pojazdy, podczas gdy standardowe ramki horyzontalne (HBB– niebieskie) generują silne przekrycia i nadmiar tła.',
          maxWidth: '35rem',
        },
      },
      {
        title: 'Skalowanie obrazu a utrata danych (Tiling / SAHI)',
        paragraphs: [
          {
            text: 'Rozdzielczość terenowa na poziomie GSD 5 cm oznacza, że pojedynczy arkusz ortofotomapy to plik o boku nierzadko przekraczającym 20&nbsp;000 pikseli. Bezpośrednie zmniejszenie (downsampling) takiego obrazu do standardowych wejść sieci neuronowych doprowadziłoby do całkowitego zatarcia małych obiektów, jakimi są pojazdy.',
          },
          {
            text: 'Rozwiązaniem tego wyzwania inżynierskiego było zastosowanie techniki kafelkowania z zakładką (Tiling), wzorowanej na architekturze {SAHI}. Zobrazowania wysokorozdzielcze były w locie dzielone na mniejsze okna o rozmiarze 1024×1024 piksele, z zachowaniem 256-pikselowego marginesu (overlap), aby uniknąć problemu „przecinania” samochodów na krawędziach kafelków.',
            links: [
              {
                label: 'SAHI',
                href: 'https://github.com/obss/sahi',
              },
            ],
          },
        ],
        figure: {
          src: assetUrl('assets/tiling.png'),
          alt: 'Schemat kafelkowania wysokorozdzielczego obrazu ortofotomapy z zakładką',
          caption: 'Schemat ideowy procesu kafelkowania z zastosowaniem zakładki. Zielony obszar oznacza część wspólną dwóch sąsiednich wycinków. Czerwony obiekt, znajdujący się na granicy pierwszego kafla, dzięki zakładce zostaje w całości objęty przez drugi kafel, co zapobiega jego przecięciu.',
          maxWidth: '35rem',
        },
      },
    ],
  },
  {
    title: 'Trening modelu i wdrożenie inferencji',
    subsections: [
      {
        title: 'Rygorystyczny podział danych i bilansowanie tła',
        paragraphs: [
          {
            text: 'Aby zapewnić wiarygodność ewaluacji i uniknąć krytycznego błędu wycieku danych (data leakage), podczas przygotowywania danych rygorystycznie zachowano oryginalny podział zbioru EAGLE na podzbiory uczący, walidacyjny i testowy. Co więcej, proces kafelkowania (Tiling) gigantycznych ortofotomap wygenerował ogromną liczbę „pustych” okien – przedstawiających wyłącznie dachy, zieleń czy wodę. Aby zapobiec zjawisku, w którym sieć faworyzuje klasę tła i uczy się zachowawczości (spadek czułości modelu), zastosowano inżynieryjne filtrowanie zbioru. Nadmiarowe kafelki bez obiektów zostały odrzucone w proporcji zapewniającej zdrowy balans pomiędzy obrazami tła a obrazami zawierającymi pojazdy.',
          },
        ],
        figure: {
          src: assetUrl('assets/results_training.png.png'),
          alt: 'Wykresy metryk i funkcji straty z logów treningowych modelu YOLO11',
          caption: 'Wykresy z logów treningowych — metryki mAP oraz stabilizacja funkcji straty w kolejnych epokach.',
          maxWidth: '45rem',
        },
      },
      {
        title: 'Transfer Learning i stabilizacja modelu',
        paragraphs: [
          {
            text: 'Model YOLO11 Nano został poddany procesowi douczania (fine-tuning) z wykorzystaniem wag wstępnie wytrenowanych na potężnym, lotniczym zbiorze {DOTA}. Zastosowanie uczenia transferowego z domeny tak zbliżonej wizualnie pozwoliło na błyskawiczną konwergencję sieci.',
            links: [
              {
                label: 'DOTA',
                href: 'https://doi.org/10.1109/TPAMI.2021.3117983',
              },
            ],
          },
          {
            text: 'Jak pokazują logi treningowe, wysokie metryki mAP odnotowano już po pierwszej epoce, co jednoznacznie dowodzi, że wagi startowe z modelu {DOTA} były znakomicie dopasowane do specyfiki nowego zadania. W rezultacie model niezwykle szybko ustabilizował funkcje straty (box_loss, cls_loss) i osiągnął świetne rezultaty na zbiorze walidacyjnym. Pełne 50 epok treningu pozwoliło na precyzyjne doszlifowanie detekcji, poprawiając ostateczny wynik mAP50 o około 0,025 w stosunku do obiecującego punktu wyjścia.',
            links: [
              {
                label: 'DOTA',
                href: 'https://doi.org/10.1109/TPAMI.2021.3117983',
              },
            ],
          },
        ],
      },
      {
        title: 'Architektura wnioskowania GIS',
        paragraphs: [
          {
            text: 'Samo wytrenowanie modelu to jednak dopiero połowa sukcesu – prawdziwym wyzwaniem inżynierskim było wdrożenie go do pracy na surowych arkuszach GeoTIFF (o boku nierzadko przekraczającym 20&nbsp;000 pikseli na GSD 5 cm). Biblioteka {SAHI} jest niezbędna do kafelkowania z zakładką podczas predykcji, jednak wczytanie tak gigantycznego obrazu w całości do pamięci RAM kończy się jej natychmiastowym przepełnieniem (Out of Memory).',
            links: [
              {
                label: 'SAHI',
                href: 'https://github.com/obss/sahi',
              },
            ],
          },
          {
            text: 'Aby to obejść, system wnioskujący został zaprojektowany z wykorzystaniem odczytu sektorowego. Za pomocą biblioteki {rasterio} potężny obraz jest wczytywany i przekazywany do SAHI iteracyjnie, w mniejszych, bezpiecznych dla pamięci blokach. Bezpośrednio po detekcji następuje kluczowy etap integracji GIS – poligonowe wyniki sieci (zapisane w lokalnych współrzędnych pikselowych kafelka) są w locie transformowane na globalne, rzeczywiste współrzędne przestrzenne, wykorzystując macierz transformacji afinicznej oryginalnego rastra.',
            links: [
              {
                label: 'rasterio',
                href: 'https://rasterio.readthedocs.io/',
              },
            ],
          },
          {
            text: 'Aby zmaksymalizować przepustowość całego systemu, sam model wizyjny wyeksportowano do silnika {TensorRT} i poddano kwantyzacji do precyzji FP16. Ta sprzętowa optymalizacja zredukowała rozmiar wag o połowę i drastycznie przyspieszyła wnioskowanie GPU – z poziomu ok. 40 FPS (natywny PyTorch) do ponad 147 FPS bez żadnej straty na jakości detekcji. Ze względu na stosowanie marginesów nakładania (w sektorach odczytu rasterio), na stykach analizowanych okien siłą rzeczy powstawały zduplikowane detekcje. Zostały one na samym końcu precyzyjnie usunięte za pomocą algorytmów opartych na drzewach przestrzennych ({cKDTree}), stosując promień wyszukiwania 1,8 metra.',
            links: [
              {
                label: 'TensorRT',
                href: 'https://docs.ultralytics.com/integrations/tensorrt#tensorrt',
              },
              {
                label: 'cKDTree',
                href: 'https://docs.scipy.org/doc/scipy/reference/generated/scipy.spatial.cKDTree.html',
              },
            ],
          },
        ],
        figure: {
          src: assetUrl('assets/graphviz.png'),
          alt: 'Schemat architektury pipeline inferencji na ortofotomapach wysokorozdzielczych',
          caption: 'Schemat architektury wnioskowania — od odczytu okienkowego GeoTIFF, przez inferencję SAHI, TensorRT FP16, po deduplikację detekcji metodą cKDTree.',
          maxWidth: '42rem',
        },
      },
    ],
  },
  {
    title: 'Ewaluacja skuteczności i punkt pracy modelu',
    subsections: [
      {
        title: 'Skuteczność detekcji i orientacji (Precision-Recall)',
        paragraphs: [
          {
            text: 'Na niezależnym, laboratoryjnym zbiorze testowym model osiągnął wybitną skuteczność, co obrazuje krzywa Precyzja-Czułość (Precision-Recall Curve). Z wynikiem metryki mAP@50 przekraczającym 0,97 sieć udowodniła, że doskonale radzi sobie z wyzwaniem, jakim jest nie tylko sama detekcja pojazdów w gęstej tkance miejskiej, ale również poprawna predykcja kąta nachylenia zorientowanych ramek (OBB). Wartość pola pod krzywą bliska jedności potwierdza, że model rzadko gubi obiekty i utrzymuje wysoką trafność nawet przy niższych progach pewności.',
          },
        ],
        figure: {
          src: assetUrl('assets/PR_curve.png'),
          alt: 'Krzywa Precyzja-Czułość modelu YOLO11 OBB na zbiorze testowym',
          caption: 'Krzywa Precyzja-Czułość — mAP@50 powyżej 0,97 na niezależnym zbiorze testowym EAGLE.',
          maxWidth: '35rem',
        },
      },
      {
        title: 'Adaptacyjny próg pewności dla GSD 5 cm (F1-Score)',
        paragraphs: [
          {
            text: 'Wysoka skuteczność laboratoryjna wymagała jednak odpowiedniej kalibracji pod wdrożenie produkcyjne. Prezentowana powyżej interaktywna mapa Krakowa bazuje na najnowszych ortofotomapach o bardzo wysokiej rozdzielczości (GSD 5 cm). Aby system działał na nich precyzyjnie, konieczne było analityczne wyznaczenie optymalnego punktu pracy modelu specjalnie pod tę jakość obrazu.',
          },
          {
            text: 'Wykorzystano do tego autorski zbiór walidacyjny wycięty z tych samych danych. Na jego podstawie wygenerowano krzywą miary F1 w funkcji pewności (Confidence). Jak wynika z wykresu, maksymalny balans pomiędzy czułością a precyzją (F1 = 0,93) osiągnięto przy progu odcięcia wynoszącym 0,136. Taka precyzyjna kalibracja pozwoliła w pełni wykorzystać bogactwo detali 5-centymetrowego rastra – model wyłapuje niemal wszystkie pojazdy, jednocześnie bezbłędnie odcinając szum wizualny i minimalizując liczbę fałszywych alarmów (False Positives).',
          },
        ],
        figure: {
          src: assetUrl('assets/BoxF1_curve_2025val.png'),
          alt: 'Krzywa F1-Confidence dla walidacji na ortofotomapie Krakowa GSD 5 cm',
          caption: 'Krzywa F1-Confidence dla GSD 5 cm — optymalny próg pewności 0,136 na autorskim zbiorze walidacyjnym z ortofotomapy 2025.',
          maxWidth: '35rem',
        },
      },
    ],
  },
  {
    title: 'Zasoby projektowe i kod źródłowy',
    subsections: [
      {
        title: 'Dokumentacja potoku inżynierskiego (GitHub)',
        paragraphs: [
          {
            text: 'Ze względu na ograniczenia licencyjne wykorzystanego zbioru EAGLE oraz gigantyczny rozmiar surowych plików rastrowych (kilkaset gigabajtów), pełne odtworzenie treningu metodą plug-and-play nie jest możliwe. Cały kod źródłowy udostępniam jednak do wglądu w formie uporządkowanych notatników Jupyter. Zachowano w nich oryginalne wyjścia komórek ze środowiska obliczeniowego, co stanowi transparentną dokumentację rzeczywistego przebiegu eksperymentów.',
          },
          {
            text: 'Repozytorium zostało podzielone na cztery logiczne moduły odzwierciedlające cykl życia modelu:',
          },
        ],
        bullets: [
          {
            title: 'Preprocessing',
            text: 'Autorskie skrypty konwertujące surowe etykiety XML do formatu YOLO OBB, algorytmy kafelkowania obrazów z zakładką oraz mechanizmy oczyszczania danych z nadmiaru tła.',
          },
          {
            title: 'Training',
            text: 'Dokumentacja eksperymentów douczania (Fine-tuning) dla architektury YOLO11. Testowano zarówno model Nano (przy 50 i 100 epokach), jak i model Medium z zamrożonym szkieletem (frozen backbone).',
          },
          {
            title: 'Evaluation',
            text: 'Walidacja wyników na laboratoryjnym zbiorze testowym oraz na rzeczywistych danych z Geoportalu (wyznaczanie krzywych F1). Zintegrowano tu również kod eksportu modelu do formatu TensorRT i benchmarki wydajności (FPS).',
          },
          {
            title: 'Inference',
            text: 'Zintegrowany silnik wnioskujący GIS. Potok realizuje odczyt okienkowy GeoTIFF, wnioskowanie na akceleratorze (SAHI + TensorRT), filtrację przestrzenną duplikatów (cKDTree) i eksport ostatecznych geometrii do formatu GeoJSON.',
          },
        ],
        actions: [
          {
            icon: '📂',
            label: 'Zobacz kod źródłowy na GitHubie',
            href: RESOURCE_HREFS.github,
            variant: 'indigo',
          },
        ],
      },
      {
        title: 'Otwarte dane walidacyjne (Roboflow Universe)',
        paragraphs: [
          {
            text: 'W ramach wspierania otwartych danych badawczych, udostępniam autorskie zbiory walidacyjne wycięte z map Krakowa, które posłużyły do wyznaczenia adaptacyjnego progu pewności dla tego projektu. Zbiory zostały zaanotowane półautomatycznie przy pomocy modelu Segment Anything (SAM) i poddane ręcznej korekcie.',
          },
          {
            text: 'Zbiór walidacyjny Kraków (GSD 5 cm): Wykorzystany do kalibracji głównego modelu działającego na powyższej mapie interaktywnej z roku 2023 i 2025.',
          },
          {
            text: 'Zbiór walidacyjny Kraków (GSD 10 cm): Dodatkowy, trudniejszy zbiór z historycznych ortofotomap (2013), służący w projekcie do testowania odporności modelu na dane niższej jakości.',
          },
        ],
        actions: [
          {
            icon: '📊',
            label: 'Zbiór Roboflow GSD 5 cm',
            href: RESOURCE_HREFS.roboflowGsd5cm,
            variant: 'emerald',
          },
          {
            icon: '📊',
            label: 'Zbiór Roboflow GSD 10 cm',
            href: RESOURCE_HREFS.roboflowGsd10cm,
            variant: 'emerald',
          },
        ],
      },
    ],
  },
];

/**
 * Renders narrative engineering blocks below the results section.
 */
export function setupEngineeringBlocks(): void {
  const container = document.querySelector<HTMLElement>('#engineering-blocks');

  if (!container) {
    return;
  }

  for (const block of ENGINEERING_BLOCKS) {
    container.append(renderEngineeringBlock(block));
  }
}
