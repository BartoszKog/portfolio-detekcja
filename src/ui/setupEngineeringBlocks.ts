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

interface EngineeringSubsection {
  title: string;
  paragraphs: EngineeringParagraph[];
  figure?: EngineeringFigure;
}

interface EngineeringBlock {
  title: string;
  subsections: EngineeringSubsection[];
}

const EXTERNAL_LINK_CLASS =
  'font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-2 transition hover:text-indigo-900';

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

  article.append(body);

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
 *    - optional `figure` — `{ src, alt, caption, maxWidth? }`.
 *
 * Links: use `{Label}` in `text` and define matching `label` + `href` in `links`.
 * Example: text: '… architekturze {SAHI} …', links: [{ label: 'SAHI', href: 'https://…' }].
 *
 * Typography: HTML entities work in text and captions, e.g. `20&nbsp;000` (non-breaking space).
 * Images: place files in `public/assets/`. Optional `maxWidth` caps width on large screens
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
          src: '/assets/fig_comparison.png',
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
          src: '/assets/tiling.png',
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
          src: '/assets/results_training.png.png',
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
            text: 'Jak pokazują logi treningowe, wysokie metryki mAP odnotowano już po pierwszej epoce, co jednoznacznie dowodzi, że wagi startowe z modelu {DOTA} były znakomicie dopasowane do specyfiki nowego zadania. W rezultacie model niezwykle szybko ustabilizował funkcje straty (box_loss, cls_loss) i osiągnął świetne rezultaty na zbiorze walidacyjnym. Pełne 50 epok treningu pozwoliło na precyzyjne doszlifowanie detekcji, poprawiając ostateczny wynik mAP50 o około 0.025 w stosunku do obiecującego punktu wyjścia.',
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
          src: '/assets/graphviz.png',
          alt: 'Schemat architektury pipeline inferencji na ortofotomapach wysokorozdzielczych',
          caption: 'Schemat architektury wnioskowania — od odczytu okienkowego GeoTIFF, przez inferencję SAHI, TensorRT FP16, po deduplikację detekcji metodą cKDTree.',
          maxWidth: '42rem',
        },
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
