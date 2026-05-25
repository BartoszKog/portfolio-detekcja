import {
  setDiffHeatmapVisible,
  toggleLayer,
} from '../map/MapController';
import { toggleLegendVisibility } from './Legend';

type LayerSelection = '2023' | '2025' | 'diff';

interface LayerOption {
  selection: LayerSelection;
  label: string;
}

const LAYER_OPTIONS: LayerOption[] = [
  {
    selection: '2025',
    label: 'Ortofotomapa 2025 (GSD 5cm)',
  },
  {
    selection: '2023',
    label: 'Ortofotomapa 2023 (GSD 5cm)',
  },
  {
    selection: 'diff',
    label: 'Bilans Zmian KDE (2025 vs 2023)',
  },
];

const ACTIVE_BUTTON_CLASSES = [
  'bg-slate-900',
  'text-white',
  'shadow-md',
  'ring-2',
  'ring-slate-900',
  'ring-offset-2',
  'ring-offset-slate-100',
].join(' ');

const INACTIVE_BUTTON_CLASSES = [
  'bg-transparent',
  'text-slate-500',
  'hover:bg-white/70',
  'hover:text-slate-700',
].join(' ');

interface LayerToggleControls {
  buttons: Map<LayerSelection, HTMLButtonElement>;
  kdeCheckboxWrapper: HTMLDivElement;
  kdeCheckbox: HTMLInputElement;
}

function applyLayerSelection(
  activeSelection: LayerSelection,
  controls: LayerToggleControls,
): void {
  toggleLayer(activeSelection);

  const isDiffMode = activeSelection === 'diff';
  controls.kdeCheckboxWrapper.classList.toggle('hidden', !isDiffMode);
  toggleLegendVisibility(isDiffMode);

  if (isDiffMode) {
    controls.kdeCheckbox.checked = true;
    setDiffHeatmapVisible(true);
  }
}

function updateButtonStyles(
  activeSelection: LayerSelection,
  buttons: Map<LayerSelection, HTMLButtonElement>,
): void {
  for (const option of LAYER_OPTIONS) {
    const isActive = option.selection === activeSelection;
    const button = buttons.get(option.selection);
    if (!button) {
      continue;
    }

    button.className = [
      'px-3',
      'py-2',
      'text-xs',
      'font-semibold',
      'rounded-full',
      'transition-all',
      'duration-150',
      'focus-visible:outline-none',
      'focus-visible:ring-2',
      'focus-visible:ring-slate-400',
      'focus-visible:ring-offset-2',
      isActive ? ACTIVE_BUTTON_CLASSES : INACTIVE_BUTTON_CLASSES,
    ].join(' ');
    button.setAttribute('aria-pressed', String(isActive));
  }
}

function setActiveSelection(
  activeSelection: LayerSelection,
  controls: LayerToggleControls,
): void {
  applyLayerSelection(activeSelection, controls);
  updateButtonStyles(activeSelection, controls.buttons);
}

/** Injects an orthophoto layer toggle control into the given container. */
export function setupLayerToggle(container: HTMLElement): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'mt-3 flex flex-col gap-2';

  const label = document.createElement('p');
  label.className = 'text-xs font-semibold uppercase tracking-wide text-slate-500';
  label.textContent = 'Warstwa ortofotomapy';
  wrapper.appendChild(label);

  const buttonGroup = document.createElement('div');
  buttonGroup.className = [
    'inline-flex',
    'flex-wrap',
    'gap-1',
    'p-1',
    'rounded-full',
    'bg-slate-100/80',
    'border',
    'border-slate-200',
  ].join(' ');
  buttonGroup.setAttribute('role', 'group');
  buttonGroup.setAttribute('aria-label', 'Wybór ortofotomapy');

  const buttons = new Map<LayerSelection, HTMLButtonElement>();

  const kdeCheckboxWrapper = document.createElement('div');
  kdeCheckboxWrapper.className = 'hidden pl-1';

  const kdeCheckboxLabel = document.createElement('label');
  kdeCheckboxLabel.className = [
    'inline-flex',
    'items-center',
    'gap-2',
    'text-xs',
    'font-medium',
    'text-slate-600',
    'cursor-pointer',
    'select-none',
  ].join(' ');

  const kdeCheckbox = document.createElement('input');
  kdeCheckbox.type = 'checkbox';
  kdeCheckbox.checked = true;
  kdeCheckbox.className = [
    'h-4',
    'w-4',
    'rounded',
    'border-slate-300',
    'text-slate-900',
    'focus:ring-2',
    'focus:ring-slate-400',
    'focus:ring-offset-1',
  ].join(' ');
  kdeCheckbox.addEventListener('change', () => {
    setDiffHeatmapVisible(kdeCheckbox.checked);
  });

  const kdeCheckboxText = document.createElement('span');
  kdeCheckboxText.textContent = 'Pokaż warstwę KDE';

  kdeCheckboxLabel.append(kdeCheckbox, kdeCheckboxText);
  kdeCheckboxWrapper.appendChild(kdeCheckboxLabel);

  const controls: LayerToggleControls = {
    buttons,
    kdeCheckboxWrapper,
    kdeCheckbox,
  };

  for (const option of LAYER_OPTIONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = option.label;
    button.addEventListener('click', () => {
      setActiveSelection(option.selection, controls);
    });
    buttons.set(option.selection, button);
    buttonGroup.appendChild(button);
  }

  wrapper.appendChild(buttonGroup);
  wrapper.appendChild(kdeCheckboxWrapper);
  container.appendChild(wrapper);

  setActiveSelection('2025', controls);
}
