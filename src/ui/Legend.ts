import {
  DETECTION_POINT_FILL,
  DETECTION_POINT_STROKE,
} from '../map/MapController';

export type GradientLegendType = 'density' | 'diff' | 'none';

export interface LegendState {
  gradientType: GradientLegendType;
  showDetection: boolean;
}

interface LegendContentConfig {
  title: string;
  gradient: string;
  numericLabels: readonly [string, string, string];
  descriptiveLabels: readonly [string, string];
}

const DIFF_LEGEND_CONFIG: LegendContentConfig = {
  title: 'Zmiana gęstości pojazdów',
  gradient:
    'linear-gradient(to right, #30123b 0%, #28bceb 25%, transparent 50%, #fb7e21 75%, #7a0403 100%)',
  numericLabels: ['-100', '0', '100'],
  descriptiveLabels: ['Spadek', 'Wzrost'],
};

const DENSITY_LEGEND_CONFIG: LegendContentConfig = {
  title: 'Gęstość pojazdów',
  gradient:
    'linear-gradient(to right, rgba(247, 251, 255, 0.00), rgba(200, 220, 240, 0.75), rgba(115, 178, 216, 0.75), rgba(41, 121, 185, 0.75), rgba(8, 48, 107, 0.75))',
  numericLabels: ['0', '100', '200'],
  descriptiveLabels: ['Niska', 'Wysoka'],
};

let legendContainer: HTMLElement | null = null;
let gradientSection: HTMLDivElement | null = null;
let titleElement: HTMLHeadingElement | null = null;
let colorRampElement: HTMLDivElement | null = null;
let numericLabelElements: HTMLSpanElement[] = [];
let descriptiveLabelElements: HTMLSpanElement[] = [];
let detectionSection: HTMLDivElement | null = null;

function applyLegendContent(config: LegendContentConfig): void {
  if (!titleElement || !colorRampElement) {
    return;
  }

  titleElement.textContent = config.title;
  colorRampElement.style.background = config.gradient;

  for (let index = 0; index < numericLabelElements.length; index += 1) {
    numericLabelElements[index].textContent = config.numericLabels[index];
  }

  descriptiveLabelElements[0].textContent = config.descriptiveLabels[0];
  descriptiveLabelElements[1].textContent = config.descriptiveLabels[1];
}

/** Injects the map legend panel into the given container. */
export function setupLegend(container: HTMLElement): void {
  legendContainer = document.createElement('div');
  legendContainer.className = [
    'absolute',
    'z-10',
    'bottom-8',
    'right-8',
    'bg-white/90',
    'backdrop-blur-sm',
    'shadow-lg',
    'rounded-lg',
    'p-4',
    'w-72',
    'hidden',
  ].join(' ');

  gradientSection = document.createElement('div');

  titleElement = document.createElement('h3');
  titleElement.className = 'text-sm font-bold text-slate-800 mb-2';

  colorRampElement = document.createElement('div');
  colorRampElement.className = 'h-4 rounded';

  const numericLabels = document.createElement('div');
  numericLabels.className = 'flex justify-between text-xs font-semibold text-slate-600 mt-1';

  numericLabelElements = [];
  for (let index = 0; index < 3; index += 1) {
    const label = document.createElement('span');
    numericLabelElements.push(label);
    numericLabels.appendChild(label);
  }

  const descriptiveLabels = document.createElement('div');
  descriptiveLabels.className = 'flex justify-between text-xs text-slate-500';

  const decreaseLabel = document.createElement('span');
  const increaseLabel = document.createElement('span');
  descriptiveLabelElements = [decreaseLabel, increaseLabel];
  descriptiveLabels.append(decreaseLabel, increaseLabel);

  gradientSection.append(titleElement, colorRampElement, numericLabels, descriptiveLabels);

  detectionSection = document.createElement('div');
  detectionSection.className = 'hidden border-t border-slate-200 pt-3 mt-3';

  const detectionTitle = document.createElement('h3');
  detectionTitle.className = 'text-sm font-bold text-slate-800 mb-2';
  detectionTitle.textContent = 'Detekcja pojazdów';

  const detectionEntry = document.createElement('div');
  detectionEntry.className = 'flex items-center gap-2';

  const detectionSymbol = document.createElement('span');
  detectionSymbol.className = 'inline-block h-3 w-3 shrink-0 rounded-full';
  detectionSymbol.style.backgroundColor = DETECTION_POINT_FILL;
  detectionSymbol.style.border = `1.5px solid ${DETECTION_POINT_STROKE}`;
  detectionSymbol.setAttribute('aria-hidden', 'true');

  const detectionLabel = document.createElement('span');
  detectionLabel.className = 'text-xs text-slate-600';
  detectionLabel.textContent = 'Wykryty pojazd';

  detectionEntry.append(detectionSymbol, detectionLabel);
  detectionSection.append(detectionTitle, detectionEntry);

  legendContainer.append(gradientSection, detectionSection);
  container.appendChild(legendContainer);
}

/** Updates gradient and detection legend sections based on the current map state. */
export function updateLegend(state: LegendState): void {
  if (!legendContainer || !gradientSection || !detectionSection) {
    return;
  }

  const showGradient = state.gradientType !== 'none';
  const showPanel = showGradient || state.showDetection;

  if (!showPanel) {
    legendContainer.classList.add('hidden');
    return;
  }

  legendContainer.classList.remove('hidden');
  gradientSection.classList.toggle('hidden', !showGradient);

  if (showGradient) {
    applyLegendContent(state.gradientType === 'diff' ? DIFF_LEGEND_CONFIG : DENSITY_LEGEND_CONFIG);
  }

  detectionSection.classList.toggle('hidden', !state.showDetection);

  if (state.showDetection && showGradient) {
    detectionSection.classList.add('border-t', 'border-slate-200', 'pt-3', 'mt-3');
  } else {
    detectionSection.classList.remove('border-t', 'pt-3', 'mt-3');
  }
}
