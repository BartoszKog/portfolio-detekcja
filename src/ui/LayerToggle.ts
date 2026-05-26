import {
  DYNAMIC_ZOOM_THRESHOLD,
  getCurrentZoom,
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
  shortLabel: string;
}

interface EffectiveLayerVisibility {
  ortho: boolean;
  kde: boolean;
  detection: boolean;
}

const LAYER_OPTIONS: LayerOption[] = [
  {
    selection: '2025',
    label: 'Ortofotomapa 2025 (GSD 5cm)',
    shortLabel: '2025',
  },
  {
    selection: '2023',
    label: 'Ortofotomapa 2023 (GSD 5cm)',
    shortLabel: '2023',
  },
  {
    selection: 'diff',
    label: 'Bilans Zmian KDE (2025 vs 2023)',
    shortLabel: 'Zmiany',
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
  dynamicLayersCheckbox: OptionCheckboxControl;
  dynamicSeparator: HTMLDivElement;
  orthoCheckbox: OptionCheckboxControl;
  densityKdeCheckbox: OptionCheckboxControl;
  diffKdeCheckbox: OptionCheckboxControl;
  detectionPointsCheckbox: OptionCheckboxControl;
  activeSelection: LayerSelection;
}

let isSyncingCheckboxes = false;

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

function setCheckboxChecked(checkbox: HTMLInputElement, checked: boolean): void {
  if (checkbox.checked === checked) {
    return;
  }

  isSyncingCheckboxes = true;
  checkbox.checked = checked;
  isSyncingCheckboxes = false;
}

function isDynamicLayersActive(controls: LayerToggleControls): boolean {
  return (
    controls.dynamicLayersCheckbox.checkbox.checked && controls.activeSelection !== 'diff'
  );
}

function getDynamicLayerVisibility(): EffectiveLayerVisibility {
  const zoom = getCurrentZoom();

  if (zoom > DYNAMIC_ZOOM_THRESHOLD) {
    return { ortho: true, kde: false, detection: true };
  }

  return { ortho: false, kde: true, detection: false };
}

function getEffectiveLayerVisibility(controls: LayerToggleControls): EffectiveLayerVisibility {
  if (isDynamicLayersActive(controls)) {
    return getDynamicLayerVisibility();
  }

  return {
    ortho: controls.orthoCheckbox.checkbox.checked,
    kde: controls.densityKdeCheckbox.checkbox.checked,
    detection: controls.detectionPointsCheckbox.checkbox.checked,
  };
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

  const { detection } = getEffectiveLayerVisibility(controls);
  return detection && isDetectionZoomAvailable();
}

function refreshLegend(controls: LayerToggleControls): void {
  const { kde } = getEffectiveLayerVisibility(controls);

  updateLegend({
    gradientType: getGradientLegendType(
      controls.activeSelection,
      kde,
      controls.diffKdeCheckbox.checkbox.checked,
    ),
    showDetection: shouldShowDetectionLegend(controls),
  });
}

function applyMapLayers(controls: LayerToggleControls): void {
  const { ortho, kde, detection } = getEffectiveLayerVisibility(controls);

  toggleLayer(controls.activeSelection, ortho, kde, detection);
}

function syncDynamicLayerCheckboxIndicators(controls: LayerToggleControls): void {
  if (!isDynamicLayersActive(controls)) {
    return;
  }

  const { ortho, kde, detection } = getDynamicLayerVisibility();

  setCheckboxChecked(controls.orthoCheckbox.checkbox, ortho);
  setCheckboxChecked(controls.densityKdeCheckbox.checkbox, kde);
  setCheckboxChecked(controls.detectionPointsCheckbox.checkbox, detection);
}

function updateManualCheckboxAvailability(controls: LayerToggleControls): void {
  const isDynamic = isDynamicLayersActive(controls);
  const manualCheckboxes = [
    controls.orthoCheckbox,
    controls.densityKdeCheckbox,
    controls.detectionPointsCheckbox,
  ];

  for (const control of manualCheckboxes) {
    control.wrapper.classList.toggle('opacity-60', isDynamic);
    control.wrapper.classList.toggle('pointer-events-none', isDynamic);
    control.checkbox.disabled = false;
    control.checkbox.tabIndex = isDynamic ? -1 : 0;
    control.checkbox.setAttribute('aria-readonly', String(isDynamic));
  }

  if (isDynamic) {
    syncDynamicLayerCheckboxIndicators(controls);
  }
}

function updateDetectionCheckboxAvailability(controls: LayerToggleControls): void {
  const isOrthoMode = controls.activeSelection !== 'diff';
  const { wrapper, checkbox } = controls.detectionPointsCheckbox;

  wrapper.classList.toggle('hidden', !isOrthoMode);

  if (!isOrthoMode || isDynamicLayersActive(controls)) {
    return;
  }

  const zoomAvailable = isDetectionZoomAvailable();
  wrapper.classList.toggle('opacity-50', !zoomAvailable);
  wrapper.classList.toggle('pointer-events-none', !zoomAvailable);
  checkbox.disabled = !zoomAvailable;
}

function updateOrthoModeCheckboxVisibility(controls: LayerToggleControls): void {
  const isDiffMode = controls.activeSelection === 'diff';

  controls.dynamicLayersCheckbox.wrapper.classList.toggle('hidden', isDiffMode);
  controls.dynamicSeparator.classList.toggle('hidden', isDiffMode);
  controls.orthoCheckbox.wrapper.classList.toggle('hidden', isDiffMode);
  controls.densityKdeCheckbox.wrapper.classList.toggle('hidden', isDiffMode);
  controls.detectionPointsCheckbox.wrapper.classList.toggle('hidden', isDiffMode);
  controls.diffKdeCheckbox.wrapper.classList.toggle('hidden', !isDiffMode);
}

function handleDynamicLayersChange(controls: LayerToggleControls): void {
  if (isSyncingCheckboxes) {
    return;
  }

  updateManualCheckboxAvailability(controls);
  applyMapLayers(controls);
  updateDetectionCheckboxAvailability(controls);
  refreshLegend(controls);
}

function handleManualLayerChange(controls: LayerToggleControls): void {
  if (isSyncingCheckboxes || isDynamicLayersActive(controls)) {
    return;
  }

  const manualChecked =
    controls.orthoCheckbox.checkbox.checked ||
    controls.densityKdeCheckbox.checkbox.checked ||
    controls.detectionPointsCheckbox.checkbox.checked;

  if (manualChecked) {
    setCheckboxChecked(controls.dynamicLayersCheckbox.checkbox, false);
  }

  applyMapLayers(controls);
  updateManualCheckboxAvailability(controls);
  updateDetectionCheckboxAvailability(controls);
  refreshLegend(controls);
}

function applyLayerSelection(
  activeSelection: LayerSelection,
  controls: LayerToggleControls,
): void {
  controls.activeSelection = activeSelection;
  updateOrthoModeCheckboxVisibility(controls);
  applyMapLayers(controls);
  updateManualCheckboxAvailability(controls);
  updateDetectionCheckboxAvailability(controls);

  if (activeSelection === 'diff') {
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

function applyPanelToggleState(
  panel: HTMLElement,
  toggleButton: HTMLButtonElement,
  isOpen: boolean,
): void {
  panel.classList.toggle('hidden', !isOpen);
  toggleButton.setAttribute('aria-expanded', String(isOpen));
  toggleButton.classList.toggle('bg-slate-900', isOpen);
  toggleButton.classList.toggle('text-white', isOpen);
  toggleButton.classList.toggle('bg-white', !isOpen);
  toggleButton.classList.toggle('text-slate-700', !isOpen);
  toggleButton.classList.toggle('hover:bg-slate-800', isOpen);
  toggleButton.classList.toggle('hover:bg-slate-100', !isOpen);
}

/** Injects map variant controls and the optional layer visibility panel. */
export function setupLayerToggle(
  variantContainer: HTMLElement,
  optionsContainer: HTMLElement,
  optionsToggleButton: HTMLButtonElement,
): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'flex flex-wrap items-center gap-3';

  const label = document.createElement('p');
  label.className = 'shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500';
  label.textContent = 'Wariant mapy';
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

  const shortcutHelp = document.createElement('p');
  shortcutHelp.className = [
    'ml-auto',
    'text-xs',
    'text-slate-500',
    'leading-snug',
    'max-w-sm',
    'hidden',
    'sm:block',
  ].join(' ');
  shortcutHelp.textContent = 'W - opcje warstw, L - legenda mapy';

  const separator = document.createElement('div');
  separator.className = 'border-t border-slate-300 my-3';

  const dynamicSeparator = document.createElement('div');
  dynamicSeparator.className = 'border-t border-slate-300 my-2';

  const optionsWrapper = document.createElement('div');
  optionsWrapper.className = 'flex flex-col gap-2';

  const optionsTitle = document.createElement('p');
  optionsTitle.className = 'text-xs font-semibold uppercase tracking-wide text-slate-500';
  optionsTitle.textContent = 'Widoczność warstw';

  const dynamicLayersCheckbox = createOptionCheckbox(
    'Dynamiczna widoczność warstw (zależna od zoomu)',
  );
  const orthoCheckbox = createOptionCheckbox('Pokaż ortofotomapę');
  const densityKdeCheckbox = createOptionCheckbox('Pokaż zagęszczenie pojazdów (KDE)');
  const detectionPointsCheckbox = createOptionCheckbox('Pokaż punkty detekcji pojazdów');
  const diffKdeCheckbox = createOptionCheckbox('Pokaż bilans zmian gęstości (KDE)');

  dynamicLayersCheckbox.checkbox.checked = true;
  orthoCheckbox.checkbox.checked = true;
  densityKdeCheckbox.checkbox.checked = true;
  detectionPointsCheckbox.checkbox.checked = true;
  diffKdeCheckbox.checkbox.checked = true;
  diffKdeCheckbox.wrapper.classList.add('hidden');

  const controls: LayerToggleControls = {
    buttons,
    dynamicLayersCheckbox,
    dynamicSeparator,
    orthoCheckbox,
    densityKdeCheckbox,
    diffKdeCheckbox,
    detectionPointsCheckbox,
    activeSelection: '2025',
  };

  let isOptionsPanelOpen = false;
  optionsToggleButton.addEventListener('click', () => {
    isOptionsPanelOpen = !isOptionsPanelOpen;
    applyPanelToggleState(optionsContainer, optionsToggleButton, isOptionsPanelOpen);
  });

  dynamicLayersCheckbox.checkbox.addEventListener('change', () => {
    handleDynamicLayersChange(controls);
  });

  orthoCheckbox.checkbox.addEventListener('change', () => {
    handleManualLayerChange(controls);
  });

  densityKdeCheckbox.checkbox.addEventListener('change', () => {
    handleManualLayerChange(controls);
  });

  detectionPointsCheckbox.checkbox.addEventListener('change', () => {
    handleManualLayerChange(controls);
  });

  diffKdeCheckbox.checkbox.addEventListener('change', () => {
    setDiffHeatmapVisible(diffKdeCheckbox.checkbox.checked);
    refreshLegend(controls);
  });

  subscribeToViewChange(() => {
    if (isDynamicLayersActive(controls)) {
      syncDynamicLayerCheckboxIndicators(controls);
      applyMapLayers(controls);
    }

    updateDetectionCheckboxAvailability(controls);
    refreshLegend(controls);
  });

  for (const option of LAYER_OPTIONS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.title = option.label;
    button.setAttribute('aria-label', option.label);

    button.textContent = option.shortLabel;
    button.addEventListener('click', () => {
      setActiveSelection(option.selection, controls);
    });
    buttons.set(option.selection, button);
    buttonGroup.appendChild(button);
  }

  wrapper.appendChild(buttonGroup);
  wrapper.appendChild(shortcutHelp);
  variantContainer.appendChild(wrapper);

  optionsWrapper.append(
    optionsTitle,
    separator,
    dynamicLayersCheckbox.wrapper,
    dynamicSeparator,
    orthoCheckbox.wrapper,
    densityKdeCheckbox.wrapper,
    detectionPointsCheckbox.wrapper,
    diffKdeCheckbox.wrapper,
  );
  optionsContainer.appendChild(optionsWrapper);

  applyPanelToggleState(optionsContainer, optionsToggleButton, isOptionsPanelOpen);
  setActiveSelection('2025', controls);
}
