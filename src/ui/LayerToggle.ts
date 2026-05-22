import {
  hideOrthophotoLayers,
  toggleLayer,
} from '../map/MapController';

type LayerSelection = '2023' | '2025' | 'none';

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
    selection: 'none',
    label: 'Mapa bazowa',
  },
];

const ACTIVE_BUTTON_CLASSES = [
  'bg-slate-800',
  'text-white',
  'shadow-sm',
].join(' ');

const INACTIVE_BUTTON_CLASSES = [
  'bg-transparent',
  'text-slate-600',
  'hover:bg-slate-100',
].join(' ');

function applyLayerSelection(activeSelection: LayerSelection): void {
  if (activeSelection === 'none') {
    hideOrthophotoLayers();
    return;
  }

  toggleLayer(activeSelection);
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
      'py-1.5',
      'text-xs',
      'font-medium',
      'rounded-full',
      'transition-colors',
      'duration-150',
      isActive ? ACTIVE_BUTTON_CLASSES : INACTIVE_BUTTON_CLASSES,
    ].join(' ');
    button.setAttribute('aria-pressed', String(isActive));
  }
}

function setActiveSelection(
  activeSelection: LayerSelection,
  buttons: Map<LayerSelection, HTMLButtonElement>,
): void {
  applyLayerSelection(activeSelection);
  updateButtonStyles(activeSelection, buttons);
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

  for (const option of LAYER_OPTIONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = option.label;
    button.addEventListener('click', () => {
      setActiveSelection(option.selection, buttons);
    });
    buttons.set(option.selection, button);
    buttonGroup.appendChild(button);
  }

  wrapper.appendChild(buttonGroup);
  container.appendChild(wrapper);

  setActiveSelection('2025', buttons);
}
