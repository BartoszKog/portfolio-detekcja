import { scrollElementCenterIntoView } from '../utils/scrollElementCenterIntoView';
import { slugify } from '../utils/slugify';

interface TocNode {
  label: string;
  heading?: HTMLElement;
  scrollTarget?: HTMLElement;
  onNavigate?: () => void;
  children: TocNode[];
}

const DOCK_TOP_OFFSET_PX = 24;
const DOCK_MIN_LEFT_MARGIN_PX = 16;
const SIDEBAR_TOC_WIDTH_PX = 220;
const INTRO_MIN_WIDTH_PX = 260;
const SPLIT_GAP_PX = 24;
const SCROLL_SPY_ROOT_MARGIN = '-20% 0px -70% 0px';
const INTERACTIVE_MAP_TOC_ID = 'interaktywna-mapa';

function ensureHeadingId(heading: HTMLElement, usedIds: Set<string>): string {
  if (heading.id.length > 0) {
    usedIds.add(heading.id);
    return heading.id;
  }

  const base = slugify(heading.textContent ?? 'sekcja');
  let candidate = base.length > 0 ? base : 'sekcja';
  let suffix = 2;

  while (usedIds.has(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  heading.id = candidate;
  usedIds.add(candidate);
  return candidate;
}

function buildTocTree(): TocNode[] {
  const items: TocNode[] = [];
  const mapApp = document.querySelector<HTMLElement>('#app');

  const mapHeading = document.querySelector<HTMLElement>('#map-section header.map-section-intro h2');
  if (mapHeading) {
    const mapNode: TocNode = {
      label: mapHeading.textContent ?? '',
      heading: mapHeading,
      children: [],
    };

    mapNode.children.push({
      label: 'Interaktywna mapa',
      scrollTarget: mapApp ?? undefined,
      onNavigate: () => {
        const mapTarget = document.querySelector<HTMLElement>('#app');
        if (mapTarget) {
          scrollElementCenterIntoView(mapTarget);
        }
      },
      children: [],
    });

    const qgisHeading = document.querySelector<HTMLElement>('#map-section .mt-8.rounded-2xl h3');
    if (qgisHeading) {
      mapNode.children.push({
        label: qgisHeading.textContent ?? '',
        heading: qgisHeading,
        children: [],
      });
    }

    items.push(mapNode);
  }

  const engineeringHeading = document.querySelector<HTMLElement>('#engineering-section > h2');
  if (engineeringHeading) {
    const engineeringNode: TocNode = {
      label: engineeringHeading.textContent ?? '',
      heading: engineeringHeading,
      children: [],
    };

    for (const block of document.querySelectorAll<HTMLElement>('#engineering-blocks > section')) {
      const blockHeading = block.querySelector<HTMLElement>(':scope > h3');
      if (!blockHeading) {
        continue;
      }

      const blockNode: TocNode = {
        label: blockHeading.textContent ?? '',
        heading: blockHeading,
        children: [],
      };

      for (const subsectionHeading of block.querySelectorAll<HTMLElement>(
        ':scope > article > h3',
      )) {
        blockNode.children.push({
          label: subsectionHeading.textContent ?? '',
          heading: subsectionHeading,
          children: [],
        });
      }

      engineeringNode.children.push(blockNode);
    }

    items.push(engineeringNode);
  }

  return items;
}

function getTocTargetId(node: TocNode, usedIds: Set<string>): string {
  if (node.heading) {
    return ensureHeadingId(node.heading, usedIds);
  }

  if (node.scrollTarget?.id.length) {
    return node.scrollTarget.id;
  }

  return INTERACTIVE_MAP_TOC_ID;
}

function renderTocList(
  container: HTMLOListElement,
  nodes: TocNode[],
  usedIds: Set<string>,
  depth = 0,
): void {
  for (const node of nodes) {
    const targetId = getTocTargetId(node, usedIds);

    if (node.heading) {
      node.heading.classList.add('scroll-mt-24');
    }

    const item = document.createElement('li');
    item.className = depth === 0 ? 'page-toc-item page-toc-item--top' : 'page-toc-item';

    const link = document.createElement('a');
    link.href = `#${targetId}`;
    link.className =
      depth === 0
        ? 'page-toc-link page-toc-link--top'
        : depth === 1
          ? 'page-toc-link page-toc-link--section'
          : 'page-toc-link page-toc-link--subsection';
    link.textContent = node.label;
    link.dataset.tocTarget = targetId;

    link.addEventListener('click', (event) => {
      event.preventDefault();

      if (node.onNavigate) {
        node.onNavigate();
        history.replaceState(null, '', `#${targetId}`);
        return;
      }

      if (node.heading) {
        node.heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', `#${targetId}`);
      }
    });

    item.append(link);

    if (node.children.length > 0) {
      const sublist = document.createElement('ol');
      sublist.className =
        depth === 1
          ? 'page-toc-sublist page-toc-sublist--depth-2 page-toc-sublist--collapsible'
          : 'page-toc-sublist';

      if (depth === 1) {
        item.dataset.tocBranch = targetId;
      }

      renderTocList(sublist, node.children, usedIds, depth + 1);
      item.append(sublist);
    }

    container.append(item);
  }
}

function getContentAnchorLeft(): number {
  const content = document.querySelector<HTMLElement>('.content-width');
  if (!content) {
    return window.innerWidth / 2;
  }

  return content.getBoundingClientRect().left;
}

function getDockLeft(): number {
  const contentLeft = getContentAnchorLeft();
  const marginWidth = contentLeft - DOCK_MIN_LEFT_MARGIN_PX;

  if (marginWidth <= SIDEBAR_TOC_WIDTH_PX) {
    return DOCK_MIN_LEFT_MARGIN_PX;
  }

  return DOCK_MIN_LEFT_MARGIN_PX + (marginWidth - SIDEBAR_TOC_WIDTH_PX) / 2;
}

function canDockToc(): boolean {
  const contentLeft = getContentAnchorLeft();
  return contentLeft >= SIDEBAR_TOC_WIDTH_PX + DOCK_MIN_LEFT_MARGIN_PX * 2;
}

function isHeroVisible(): boolean {
  const hero = document.querySelector<HTMLElement>('#hero');
  if (!hero) {
    return false;
  }

  return hero.getBoundingClientRect().bottom > DOCK_TOP_OFFSET_PX;
}

function buildBranchChildMap(toc: HTMLElement): Map<string, string[]> {
  const branchChildMap = new Map<string, string[]>();

  for (const branchItem of toc.querySelectorAll<HTMLElement>('[data-toc-branch]')) {
    const branchId = branchItem.dataset.tocBranch;
    if (!branchId) {
      continue;
    }

    const childIds = [...branchItem.querySelectorAll<HTMLAnchorElement>('[data-toc-target]')]
      .map((link) => link.dataset.tocTarget ?? '')
      .filter((id) => id.length > 0 && id !== branchId);

    branchChildMap.set(branchId, childIds);
  }

  return branchChildMap;
}

function measureTocInlineWidth(toc: HTMLElement): number {
  const panel = toc.querySelector<HTMLElement>('.page-toc-panel');
  const list = toc.querySelector<HTMLElement>('.page-toc-list');
  if (!panel) {
    return toc.getBoundingClientRect().width;
  }

  const previousPanelWidth = panel.style.width;
  const previousTocWidth = toc.style.width;
  const hadMeasureClass = list?.classList.contains('page-toc-list--measure') ?? false;

  panel.style.width = 'max-content';
  toc.style.width = 'max-content';
  list?.classList.add('page-toc-list--measure');

  const width = toc.getBoundingClientRect().width;

  panel.style.width = previousPanelWidth;
  toc.style.width = previousTocWidth;
  if (list && !hadMeasureClass) {
    list.classList.remove('page-toc-list--measure');
  }

  return width;
}

function updatePostHeroLayout(
  layout: HTMLElement | null,
  toc: HTMLElement | null,
  marginAvailable: boolean,
): void {
  if (!layout) {
    return;
  }

  layout.classList.remove(
    'post-hero-layout--margin-mode',
    'post-hero-layout--split',
    'post-hero-layout--stacked',
  );

  if (marginAvailable || !toc) {
    layout.classList.add('post-hero-layout--margin-mode');
    return;
  }

  const inner = layout.querySelector<HTMLElement>('.post-hero-inner');
  const availableWidth = inner?.clientWidth ?? 0;
  const tocWidth = measureTocInlineWidth(toc);
  const canSplit =
    availableWidth > 0 && availableWidth >= tocWidth + SPLIT_GAP_PX + INTRO_MIN_WIDTH_PX;

  layout.classList.add(canSplit ? 'post-hero-layout--split' : 'post-hero-layout--stacked');
}

function updateBranchExpansion(
  toc: HTMLElement,
  activeId: string,
  branchChildMap: Map<string, string[]>,
): void {
  const isDocked = toc.classList.contains('page-toc--docked');

  for (const branchItem of toc.querySelectorAll<HTMLElement>('[data-toc-branch]')) {
    const branchId = branchItem.dataset.tocBranch;
    if (!branchId) {
      continue;
    }

    const childIds = branchChildMap.get(branchId) ?? [];
    const isActiveBranch = isDocked && (activeId === branchId || childIds.includes(activeId));
    branchItem.classList.toggle('page-toc-item--branch-active', isActiveBranch);
  }
}

function updateTocLayout(
  toc: HTMLElement,
  slot: HTMLElement,
  postHeroLayout: HTMLElement | null,
  onDockChange: (isDocked: boolean) => void,
): void {
  const marginAvailable = canDockToc();
  const heroVisible = isHeroVisible();
  const shouldShowDocked = marginAvailable && !heroVisible;
  const wasDocked = toc.classList.contains('page-toc--docked');

  slot.classList.toggle('page-toc-slot--margin-mode', marginAvailable);
  toc.classList.toggle('page-toc--hidden', marginAvailable && !shouldShowDocked);
  toc.classList.toggle('page-toc--docked', shouldShowDocked);
  toc.toggleAttribute('aria-hidden', marginAvailable && !shouldShowDocked);

  updatePostHeroLayout(postHeroLayout, toc, marginAvailable);

  if (shouldShowDocked) {
    toc.style.setProperty('--page-toc-dock-left', `${getDockLeft()}px`);
  } else {
    toc.style.removeProperty('--page-toc-dock-left');
  }

  if (wasDocked !== shouldShowDocked) {
    onDockChange(shouldShowDocked);
  }
}

function setupScrollSpy(
  toc: HTMLElement,
  branchChildMap: Map<string, string[]>,
  onActiveChange: (activeId: string) => void,
): void {
  const links = toc.querySelectorAll<HTMLAnchorElement>('[data-toc-target]');
  const targets = [...links]
    .map((link) => document.getElementById(link.dataset.tocTarget ?? ''))
    .filter((target): target is HTMLElement => target !== null);

  if (targets.length === 0) {
    return;
  }

  let activeId = '';

  const setActive = (id: string): void => {
    if (id === activeId) {
      return;
    }

    activeId = id;
    onActiveChange(id);

    for (const link of links) {
      const isActive = link.dataset.tocTarget === id;
      link.classList.toggle('page-toc-link--active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    }

    updateBranchExpansion(toc, activeId, branchChildMap);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);

      if (visible.length > 0) {
        setActive(visible[0].target.id);
      }
    },
    { rootMargin: SCROLL_SPY_ROOT_MARGIN, threshold: 0 },
  );

  for (const target of targets) {
    observer.observe(target);
  }

  if (window.location.hash.length > 1) {
    const hashId = window.location.hash.slice(1);
    if (targets.some((target) => target.id === hashId)) {
      setActive(hashId);
      return;
    }
  }

  setActive(targets[0].id);
}

/**
 * Builds the page table of contents under the hero and docks it in the side margin when space allows.
 */
export function setupTableOfContents(): void {
  const toc = document.querySelector<HTMLElement>('#page-toc');
  const list = document.querySelector<HTMLOListElement>('#page-toc-list');
  const slot = document.querySelector<HTMLElement>('#page-toc-slot');
  const postHeroLayout = document.querySelector<HTMLElement>('#post-hero-layout');

  if (!toc || !list || !slot) {
    return;
  }

  const tree = buildTocTree();
  if (tree.length === 0) {
    slot.remove();
    updatePostHeroLayout(postHeroLayout, null, canDockToc());
    return;
  }

  const usedIds = new Set<string>();
  renderTocList(list, tree, usedIds);

  const branchChildMap = buildBranchChildMap(toc);
  let lastActiveId = '';

  const handleActiveChange = (activeId: string): void => {
    lastActiveId = activeId;
  };

  const refreshBranchExpansion = (): void => {
    updateBranchExpansion(toc, lastActiveId, branchChildMap);
  };

  const refreshLayout = (): void => {
    updateTocLayout(toc, slot, postHeroLayout, () => {
      refreshBranchExpansion();
    });
  };

  refreshLayout();
  setupScrollSpy(toc, branchChildMap, handleActiveChange);

  window.addEventListener('scroll', refreshLayout, { passive: true });
  window.addEventListener('resize', refreshLayout, { passive: true });
}
