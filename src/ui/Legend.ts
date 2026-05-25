let legendContainer: HTMLElement | null = null;

// Gradient for the difference heatmap legend
const DIFF_HEATMAP_LEGEND_GRADIENT =
  'linear-gradient(to right, #30123b 0%, #28bceb 25%, transparent 50%, #fb7e21 75%, #7a0403 100%)';

/** Injects the difference heatmap legend into the given container. */
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

  const title = document.createElement('h3');
  title.className = 'text-sm font-bold text-slate-800 mb-2';
  title.textContent = 'Zmiana gęstości pojazdów';

  const colorRamp = document.createElement('div');
  colorRamp.className = 'h-4 rounded';
  colorRamp.style.background = DIFF_HEATMAP_LEGEND_GRADIENT;

  const numericLabels = document.createElement('div');
  numericLabels.className = 'flex justify-between text-xs font-semibold text-slate-600 mt-1';

  for (const value of ['-100', '0', '100'] as const) {
    const label = document.createElement('span');
    label.textContent = value;
    numericLabels.appendChild(label);
  }

  const descriptiveLabels = document.createElement('div');
  descriptiveLabels.className = 'flex justify-between text-xs text-slate-500';

  const decreaseLabel = document.createElement('span');
  decreaseLabel.textContent = 'Spadek';

  const increaseLabel = document.createElement('span');
  increaseLabel.textContent = 'Wzrost';

  descriptiveLabels.append(decreaseLabel, increaseLabel);

  legendContainer.append(title, colorRamp, numericLabels, descriptiveLabels);
  container.appendChild(legendContainer);
}

/** Shows or hides the difference heatmap legend panel. */
export function toggleLegendVisibility(isVisible: boolean): void {
  legendContainer?.classList.toggle('hidden', !isVisible);
}
