import {
  isDetectionZoomAvailable,
  setDiffHeatmapVisible,
  subscribeToViewChange,
  toggleLayer,
} from '../map/MapController';
import { updateLegend, type GradientLegendType } from './Legend';

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

const OPTION_CHECKBOX_LABEL_CLASSES = [
  'flex',
  'items-center',
  'space-x-2',
  'text-sm',
  'text-slate-700',
  'cursor-pointer',
].join(' ');

const OPTION_CHECKBOX_INPUT_CLASSES = [
  'h-4',
  'w-4',
  'rounded',
  'border-slate-300',
  'text-slate-900',
  'focus:ring-2',
  'focus:ring-slate-400',
  'focus:ring-offset-1',
].join(' ');

interface OptionCheckboxControl {
  wrapper: HTMLDivElement;
  checkbox: HTMLInputElement;
}

interface LayerToggleControls {
  buttons: Map<LayerSelection, HTMLButtonElement>;
  orthoCheckbox: OptionCheckboxControl;
  densityKdeCheckbox: OptionCheckboxControl;
  diffKdeCheckbox: OptionCheckboxControl;
  detectionPointsCheckbox: OptionCheckboxControl;
  activeSelection: LayerSelection;
}

function createOptionCheckbox(labelText: string): OptionCheckboxControl {
  const wrapper = document.createElement('div');
  wrapper.className = 'pl-1';

  const label = document.createElement('label');
  label.className = OPTION_CHECKBOX_LABEL_CLASSES;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = OPTION_CHECKBOX_INPUT_CLASSES;

  const text = document.createElement('span');
  text.textContent = labelText;

  label.append(checkbox, text);
  wrapper.appendChild(label);

  return { wrapper, checkbox };
}

function getGradientLegendType(
  activeSelection: LayerSelection,
  densityChecked: boolean,
  diffChecked: boolean,
): GradientLegendType {
  if (activeSelection === 'diff') {
    return diffChecked ? 'diff' : 'none';
  }

  return densityChecked ? 'density' : 'none';
}

function shouldShowDetectionLegend(controls: LayerToggleControls): boolean {
  if (controls.activeSelection === 'diff') {
    return false;
  }

  return (
    controls.detectionPointsCheckbox.checkbox.checked && isDetectionZoomAvailable()
  );
}

function refreshLegend(controls: LayerToggleControls): void {
  updateLegend({
    gradientType: getGradientLegendType(
      controls.activeSelection,
      controls.densityKdeCheckbox.checkbox.checked,
      controls.diffKdeCheckbox.checkbox.checked,
    ),
    showDetection: shouldShowDetectionLegend(controls),
  });
}

function applyMapLayers(controls: LayerToggleControls): void {
  toggleLayer(
    controls.activeSelection,
    controls.orthoCheckbox.checkbox.checked,
    controls.densityKdeCheckbox.checkbox.checked,
    controls.detectionPointsCheckbox.checkbox.checked,
  );
}

function updateDetectionCheckboxAvailability(controls: LayerToggleControls): void {
  const isOrthoMode = controls.activeSelection !== 'diff';
  const { wrapper, checkbox } = controls.detectionPointsCheckbox;

  wrapper.classList.toggle('hidden', !isOrthoMode);

  if (!isOrthoMode) {
    return;
  }

  const zoomAvailable = isDetectionZoomAvailable();
  wrapper.classList.toggle('opacity-50', !zoomAvailable);
  wrapper.classList.toggle('pointer-events-none', !zoomAvailable);
  checkbox.disabled = !zoomAvailable;
}

function applyLayerSelection(
  activeSelection: LayerSelection,
  controls: LayerToggleControls,
): void {
  controls.activeSelection = activeSelection;
  applyMapLayers(controls);

  const isDiffMode = activeSelection === 'diff';
  controls.orthoCheckbox.wrapper.classList.toggle('hidden', isDiffMode);
  controls.densityKdeCheckbox.wrapper.classList.toggle('hidden', isDiffMode);
  controls.diffKdeCheckbox.wrapper.classList.toggle('hidden', !isDiffMode);
  updateDetectionCheckboxAvailability(controls);

  if (isDiffMode) {
    setDiffHeatmapVisible(controls.diffKdeCheckbox.checkbox.checked);
  }

  refreshLegend(controls);
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

  const separator = document.createElement('div');
  separator.className = 'border-t border-slate-200 my-3';

  const orthoCheckbox = createOptionCheckbox('Pokaż ortofotomapę');
  const densityKdeCheckbox = createOptionCheckbox('Pokaż zagęszczenie pojazdów (KDE)');
  const detectionPointsCheckbox = createOptionCheckbox('Pokaż punkty detekcji pojazdów');
  const diffKdeCheckbox = createOptionCheckbox('Pokaż bilans zmian gęstości (KDE)');

  orthoCheckbox.checkbox.checked = true;
  densityKdeCheckbox.checkbox.checked = true;
  detectionPointsCheckbox.checkbox.checked = true;
  diffKdeCheckbox.checkbox.checked = true;
  diffKdeCheckbox.wrapper.classList.add('hidden');

  const controls: LayerToggleControls = {
    buttons,
    orthoCheckbox,
    densityKdeCheckbox,
    diffKdeCheckbox,
    detectionPointsCheckbox,
    activeSelection: '2025',
  };

  orthoCheckbox.checkbox.addEventListener('change', () => {
    applyMapLayers(controls);
  });

  densityKdeCheckbox.checkbox.addEventListener('change', () => {
    applyMapLayers(controls);
    refreshLegend(controls);
  });

  detectionPointsCheckbox.checkbox.addEventListener('change', () => {
    applyMapLayers(controls);
    refreshLegend(controls);
  });

  diffKdeCheckbox.checkbox.addEventListener('change', () => {
    setDiffHeatmapVisible(diffKdeCheckbox.checkbox.checked);
    refreshLegend(controls);
  });

  subscribeToViewChange(() => {
    updateDetectionCheckboxAvailability(controls);
    refreshLegend(controls);
  });

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
  wrapper.appendChild(separator);
  wrapper.appendChild(orthoCheckbox.wrapper);
  wrapper.appendChild(densityKdeCheckbox.wrapper);
  wrapper.appendChild(detectionPointsCheckbox.wrapper);
  wrapper.appendChild(diffKdeCheckbox.wrapper);
  container.appendChild(wrapper);

  setActiveSelection('2025', controls);
}
