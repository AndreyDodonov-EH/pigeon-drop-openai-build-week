/**
 * Pure street grammar for the near-building layer. Keeping this module free of
 * Phaser makes the semantic placement rules deterministic and easy to inspect.
 */

export type DistrictKind = 'neighborhood' | 'active-neighborhood' | 'business' | 'canal';

export type FacadeUse =
  | 'neighborhood-home'
  | 'canal-home'
  | 'office'
  | 'cafe'
  | 'gym'
  | 'boutique';

export type PlacementRole = 'infill' | 'right-corner';

export interface FacadeDef {
  key: string;
  use: FacadeUse;
  placement: PlacementRole;
  flippable: boolean;
  minScale: number;
  maxScale: number;
  canAdjoin?: boolean;
}

export const FACADE_DEFS: readonly FacadeDef[] = [
  { key: 'bg-building-0', use: 'neighborhood-home', placement: 'infill', flippable: true, minScale: 0.82, maxScale: 1 },
  { key: 'bg-building-1', use: 'neighborhood-home', placement: 'infill', flippable: true, minScale: 0.82, maxScale: 1 },
  { key: 'bg-building-2', use: 'cafe', placement: 'right-corner', flippable: false, minScale: 0.85, maxScale: 1 },
  { key: 'bg-building-3', use: 'office', placement: 'infill', flippable: true, minScale: 0.9, maxScale: 1.15 },
  { key: 'bg-building-4', use: 'canal-home', placement: 'infill', flippable: true, minScale: 0.78, maxScale: 1 },
  { key: 'bg-building-5', use: 'canal-home', placement: 'infill', flippable: true, minScale: 0.78, maxScale: 1.02, canAdjoin: true },
  { key: 'bg-building-6', use: 'canal-home', placement: 'infill', flippable: true, minScale: 0.78, maxScale: 1.02, canAdjoin: true },
  { key: 'bg-building-11', use: 'canal-home', placement: 'infill', flippable: true, minScale: 0.78, maxScale: 1.02, canAdjoin: true },
  { key: 'bg-building-12', use: 'canal-home', placement: 'infill', flippable: true, minScale: 0.78, maxScale: 1.02, canAdjoin: true },
  // A restrained side plane is subtle enough to remain residential infill.
  { key: 'bg-building-13', use: 'canal-home', placement: 'infill', flippable: false, minScale: 0.78, maxScale: 1.02 },
  { key: 'bg-building-7', use: 'office', placement: 'infill', flippable: true, minScale: 0.9, maxScale: 1.15 },
  // The deep right wall is now structural metadata, not a side effect of `shop`.
  { key: 'bg-building-8', use: 'gym', placement: 'right-corner', flippable: false, minScale: 0.82, maxScale: 0.98 },
  { key: 'bg-building-9', use: 'gym', placement: 'infill', flippable: false, minScale: 0.86, maxScale: 1.02 },
  { key: 'bg-building-10', use: 'boutique', placement: 'infill', flippable: false, minScale: 0.84, maxScale: 1 },
  { key: 'bg-building-14', use: 'office', placement: 'infill', flippable: true, minScale: 0.88, maxScale: 1 },
  { key: 'bg-building-15', use: 'office', placement: 'infill', flippable: true, minScale: 0.9, maxScale: 1.05 },
  { key: 'bg-building-16', use: 'office', placement: 'infill', flippable: true, minScale: 0.78, maxScale: 0.92 },
  { key: 'bg-building-17', use: 'office', placement: 'infill', flippable: true, minScale: 0.86, maxScale: 1 },
  { key: 'bg-building-18', use: 'cafe', placement: 'right-corner', flippable: false, minScale: 0.85, maxScale: 1 },
];

export const CONNECTOR_KEYS = ['bg-fence-0', 'bg-fence-1', 'bg-fence-2'] as const;

export interface PlannedConnector {
  key: string;
  scale: number;
  hueShift: number;
  brightness: number;
}

export interface PlannedItem {
  def: FacadeDef;
  scale: number;
  flip: boolean;
  hueShift: number;
  brightness: number;
  gapBefore: number;
  connector?: PlannedConnector;
}

export type BlockExit = 'continuous' | 'open-side-street';

export interface PlannedBlock {
  district: DistrictKind;
  items: PlannedItem[];
  exit: BlockExit;
  areaBlock: number;
}

export interface PlannedBlockSummary {
  district: DistrictKind;
  facades: string[];
  placements: PlacementRole[];
  flips: boolean[];
  scales: number[];
  hueShifts: number[];
  brightness: number[];
  gaps: number[];
  gapBefore: number;
  boundaryConnector: string | null;
  exit: BlockExit;
  areaBlock: number;
}

interface PaletteTheme {
  hue: number;
  brightness: number;
}

const DISTRICTS: readonly DistrictKind[] = [
  'neighborhood',
  'active-neighborhood',
  'business',
  'canal',
];

const TRANSITIONS: Record<DistrictKind | 'start', readonly DistrictKind[]> = {
  start: ['neighborhood', 'canal', 'business', 'active-neighborhood'],
  neighborhood: ['canal', 'business', 'active-neighborhood'],
  'active-neighborhood': ['canal', 'neighborhood', 'business'],
  business: ['neighborhood', 'canal', 'active-neighborhood'],
  canal: ['neighborhood', 'active-neighborhood', 'business'],
};

const INTERNAL_GAP_MIN = -3;
const INTERNAL_GAP_MAX = 5;
const OPEN_STREET_MIN = 78;
const OPEN_STREET_MAX = 118;

export class NearBuildingsPlanner {
  private readonly facades: FacadeDef[];
  private readonly connectors: string[];
  private readonly random: () => number;
  private lastKey = '';
  private lastDistrict: DistrictKind | null = null;
  private lastExit: BlockExit = 'continuous';
  private areaKind: DistrictKind | null = null;
  private areaBlocksRemaining = 0;
  private areaBlock = 0;
  private areaTheme: PaletteTheme = { hue: 0, brightness: 0 };

  constructor(
    facades: readonly FacadeDef[],
    connectors: readonly string[],
    random: () => number = Math.random,
  ) {
    this.facades = [...facades];
    this.connectors = [...connectors];
    this.random = random;
  }

  get hasFacades(): boolean {
    return this.facades.length > 0;
  }

  /** Plan the next atomic block while keeping a district sticky for 2–3 blocks. */
  nextBlock(): PlannedBlock {
    if (!this.hasFacades) throw new Error('Cannot plan a street without facade textures');

    if (this.areaBlocksRemaining <= 0 || !this.areaKind || !this.canBuild(this.areaKind)) {
      this.areaKind = this.pickNextDistrict();
      this.areaBlocksRemaining = this.hasCompatibleInfill(this.areaKind)
        ? 2 + Math.floor(this.random() * 2)
        : 1;
      this.areaBlock = 0;
      this.areaTheme = this.themeFor(this.areaKind);
    }

    const district = this.areaKind;
    const items = this.buildDistrictBlock(district, this.areaBlock === 0);
    if (items.length === 0) {
      // Reduced texture catalogs still make progress without crossing district semantics.
      const compatible = this.compatiblePool(district);
      if (compatible.length === 0) throw new Error(`No compatible facade for ${district}`);
      items.push(this.makeItem(this.pick(compatible), district, this.areaTheme, 0));
    }

    this.applyBoundary(items, district);
    const exit = items[items.length - 1]?.def.placement === 'right-corner'
      ? 'open-side-street'
      : 'continuous';
    const block: PlannedBlock = { district, items, exit, areaBlock: this.areaBlock };

    this.lastDistrict = district;
    this.lastExit = exit;
    this.areaBlock += 1;
    this.areaBlocksRemaining -= 1;
    return block;
  }

  /**
   * Debug/manual spawn that still obeys the grammar. Corner requests become a
   * small compatible block and force the following generated block to leave an
   * open side street.
   */
  planFeature(key: string): PlannedBlock | null {
    const feature = this.facades.find((facade) => facade.key === key);
    if (!feature) return null;

    const district = this.districtFor(feature);
    const theme = this.themeFor(district);
    const items: PlannedItem[] = [];
    if (feature.placement === 'right-corner') {
      const homes = this.pool('neighborhood-home');
      const retail = this.facades.filter((facade) =>
        facade.placement === 'infill' &&
        (facade.use === 'gym' || facade.use === 'boutique'),
      );
      const homeCount = Math.min(2, homes.length);
      for (let i = 0; i < homeCount; i++) {
        items.push(this.makeItem(this.pick(homes), district, theme, this.internalGap()));
      }
      if (feature.use === 'gym' && retail.length > 0) {
        items.push(this.makeItem(this.pick(retail), district, theme, this.internalGap()));
      }
    }
    items.push(this.makeItem(feature, district, theme, this.internalGap()));
    this.applyBoundary(items, district, theme);

    const exit = feature.placement === 'right-corner' ? 'open-side-street' : 'continuous';
    this.lastDistrict = district;
    this.lastExit = exit;
    this.areaBlocksRemaining = 0;
    return { district, items, exit, areaBlock: 0 };
  }

  debugPlan(count: number): PlannedBlockSummary[] {
    const summaries: PlannedBlockSummary[] = [];
    for (let i = 0; i < Math.max(0, Math.floor(count)); i++) {
      const block = this.nextBlock();
      summaries.push({
        district: block.district,
        facades: block.items.map((item) => item.def.key),
        placements: block.items.map((item) => item.def.placement),
        flips: block.items.map((item) => item.flip),
        scales: block.items.map((item) => item.scale),
        hueShifts: block.items.map((item) => item.hueShift),
        brightness: block.items.map((item) => item.brightness),
        gaps: block.items.map((item) => item.gapBefore),
        gapBefore: block.items[0].gapBefore,
        boundaryConnector: block.items[0].connector?.key ?? null,
        exit: block.exit,
        areaBlock: block.areaBlock,
      });
    }
    return summaries;
  }

  private buildDistrictBlock(district: DistrictKind, featureBlock: boolean): PlannedItem[] {
    switch (district) {
      case 'neighborhood':
        return this.neighborhoodBlock(featureBlock);
      case 'active-neighborhood':
        return this.activeNeighborhoodBlock(featureBlock);
      case 'business':
        return this.businessBlock();
      case 'canal':
        return this.canalBlock();
    }
  }

  private neighborhoodBlock(featureBlock: boolean): PlannedItem[] {
    const homes = this.pool('neighborhood-home');
    const cafes = this.pool('cafe');
    const useCafe = cafes.length > 0 && (featureBlock || this.random() < 0.52);
    const count = homes.length > 0 ? 2 + Math.floor(this.random() * 3) : 0;
    const items = this.infillItems(homes, count, 'neighborhood');
    if (useCafe) {
      items.push(this.makeItem(this.pick(cafes), 'neighborhood', this.areaTheme, this.internalGap()));
    }
    return items;
  }

  private activeNeighborhoodBlock(featureBlock: boolean): PlannedItem[] {
    const retail = this.facades.filter((facade) =>
      facade.placement === 'infill' && (facade.use === 'gym' || facade.use === 'boutique'),
    );
    const gymCorner = this.facades.find(
      (facade) => facade.use === 'gym' && facade.placement === 'right-corner',
    );
    const homes = this.pool('neighborhood-home');
    const useGymCorner = Boolean(gymCorner && (featureBlock || this.random() < 0.25));
    const homeCount = homes.length > 0 ? 2 + Math.floor(this.random() * 2) : 0;
    const items = this.infillItems(homes, homeCount, 'active-neighborhood');
    // One storefront gives the area a fitness/retail identity without turning
    // an entire district into an implausible wall of gyms and boutiques.
    if (retail.length > 0 && (items.length === 0 || this.random() < 0.82)) {
      items.push(this.makeItem(
        this.pick(retail),
        'active-neighborhood',
        this.areaTheme,
        this.internalGap(),
      ));
    }
    if (useGymCorner && gymCorner) {
      items.push(this.makeItem(gymCorner, 'active-neighborhood', this.areaTheme, this.internalGap()));
    }
    return items;
  }

  private businessBlock(): PlannedItem[] {
    const offices = this.pool('office');
    return this.infillItems(offices, offices.length > 0 ? 1 + Math.floor(this.random() * 2) : 0, 'business');
  }

  private canalBlock(): PlannedItem[] {
    const homes = this.pool('canal-home');
    const count = homes.length > 0 ? 3 + Math.floor(this.random() * 2) : 0;
    const joinable = homes.filter((facade) => facade.canAdjoin);
    if (joinable.length < 2) return this.infillItems(homes, count, 'canal');

    // Amsterdam rows need at least one visually continuous run. Shipping sprites
    // carry 3–4 px transparent safety borders, so -8 cancels both adjoining pads.
    const runLength = Math.min(2 + Math.floor(this.random() * 2), count);
    const clusterStart = Math.floor(this.random() * (count - runLength + 1));
    const items: PlannedItem[] = [];
    for (let i = 0; i < count; i++) {
      const inCluster = i >= clusterStart && i < clusterStart + runLength;
      const continuesCluster = i > clusterStart && inCluster;
      items.push(this.makeItem(
        this.pick(inCluster ? joinable : homes),
        'canal',
        this.areaTheme,
        continuesCluster ? -8 : this.internalGap(),
      ));
    }
    return items;
  }

  private infillItems(pool: FacadeDef[], count: number, district: DistrictKind): PlannedItem[] {
    const items: PlannedItem[] = [];
    for (let i = 0; i < count; i++) {
      items.push(this.makeItem(this.pick(pool), district, this.areaTheme, this.internalGap()));
    }
    return items;
  }

  /**
   * District palette character. Office stone barely tolerates hue shifts —
   * cream facades sit mid-way up the shader's saturation mask, so a strong
   * shared theme repaints whole business blocks pink or green. Vary offices
   * mostly by brightness and save the wide paint wheel for canal rows.
   */
  private themeFor(district: DistrictKind): PaletteTheme {
    switch (district) {
      case 'business':
        return { hue: this.rnd(0.28), brightness: this.rnd(0.3) };
      case 'canal':
        return { hue: this.rnd(0.8), brightness: this.rnd(0.18) };
      default:
        return { hue: this.rnd(0.5), brightness: this.rnd(0.2) };
    }
  }

  private makeItem(
    def: FacadeDef,
    district: DistrictKind,
    theme: PaletteTheme,
    gapBefore: number,
  ): PlannedItem {
    const hueJitter = district === 'business' ? 0.12 : district === 'canal' ? 0.34 : 0.24;
    return {
      def,
      scale: def.minScale + this.random() * (def.maxScale - def.minScale),
      flip: def.flippable && this.random() < 0.5,
      hueShift: clamp(theme.hue + this.rnd(hueJitter), -1, 1),
      brightness: clamp(theme.brightness + this.rnd(0.18), -1, 1),
      gapBefore,
    };
  }

  private applyBoundary(
    items: PlannedItem[],
    district: DistrictKind,
    theme: PaletteTheme = this.areaTheme,
  ): void {
    const first = items[0];
    if (!first) return;

    if (!this.lastDistrict) {
      first.gapBefore = 18 + this.random() * 24;
      first.connector = undefined;
      return;
    }

    if (this.lastExit === 'open-side-street') {
      first.gapBefore = OPEN_STREET_MIN + this.random() * (OPEN_STREET_MAX - OPEN_STREET_MIN);
      first.connector = undefined;
      return;
    }

    if (this.lastDistrict === district) {
      first.gapBefore = 4 + this.random() * 10;
      first.connector = undefined;
      return;
    }

    first.gapBefore = 18 + this.random() * 18;
    if (this.connectors.length > 0 && this.random() < 0.7) {
      first.connector = this.pickBoundaryConnector(this.lastDistrict, district, theme);
    } else {
      first.connector = undefined;
    }
  }

  private pickBoundaryConnector(
    from: DistrictKind,
    to: DistrictKind,
    theme: PaletteTheme,
  ): PlannedConnector {
    let preferred: string[];
    if (from === 'business' || to === 'business') {
      preferred = ['bg-fence-1', 'bg-fence-2'];
    } else if (from === 'active-neighborhood' || to === 'active-neighborhood') {
      preferred = ['bg-fence-2', 'bg-fence-1'];
    } else {
      preferred = ['bg-fence-0'];
    }
    const available = preferred.filter((key) => this.connectors.includes(key));
    const pool = available.length > 0 ? available : this.connectors;
    return {
      key: pool[Math.floor(this.random() * pool.length)],
      scale: 0.44 + this.random() * 0.1,
      hueShift: clamp(theme.hue + this.rnd(0.18), -1, 1),
      brightness: clamp(theme.brightness + this.rnd(0.16), -1, 1),
    };
  }

  private pickNextDistrict(): DistrictKind {
    const available = DISTRICTS.filter((district) => this.canBuild(district));
    if (available.length === 0) return this.districtFor(this.facades[0]);
    const transition = TRANSITIONS[this.lastDistrict ?? 'start'].filter((district) =>
      available.includes(district),
    );
    const pool = transition.length > 0 ? transition : available;
    return pool[Math.floor(this.random() * pool.length)];
  }

  private canBuild(district: DistrictKind): boolean {
    switch (district) {
      case 'neighborhood':
        return this.pool('neighborhood-home').length > 0 || this.pool('cafe').length > 0;
      case 'active-neighborhood':
        return this.facades.some((facade) =>
          facade.use === 'gym' || facade.use === 'boutique' || facade.use === 'neighborhood-home',
        );
      case 'business':
        return this.pool('office').length > 0;
      case 'canal':
        return this.pool('canal-home').length > 0;
    }
  }

  private compatiblePool(district: DistrictKind): FacadeDef[] {
    switch (district) {
      case 'neighborhood':
        return this.facades.filter((facade) =>
          facade.use === 'neighborhood-home' || facade.use === 'cafe',
        );
      case 'active-neighborhood':
        return this.facades.filter((facade) =>
          facade.use === 'neighborhood-home' ||
          facade.use === 'gym' ||
          facade.use === 'boutique',
        );
      case 'business':
        return this.pool('office');
      case 'canal':
        return this.pool('canal-home');
    }
  }

  private hasCompatibleInfill(district: DistrictKind): boolean {
    return this.compatiblePool(district).some((facade) => facade.placement === 'infill');
  }

  private districtFor(def: FacadeDef): DistrictKind {
    switch (def.use) {
      case 'office':
        return 'business';
      case 'canal-home':
        return 'canal';
      case 'gym':
      case 'boutique':
        return 'active-neighborhood';
      case 'neighborhood-home':
      case 'cafe':
        return 'neighborhood';
    }
  }

  private pool(use: FacadeUse): FacadeDef[] {
    return this.facades.filter((facade) => facade.use === use);
  }

  private pick(pool: FacadeDef[]): FacadeDef {
    let def = pool[Math.floor(this.random() * pool.length)];
    if (def.key === this.lastKey && pool.length > 1) {
      def = pool[(pool.indexOf(def) + 1) % pool.length];
    }
    this.lastKey = def.key;
    return def;
  }

  private internalGap(): number {
    return INTERNAL_GAP_MIN + this.random() * (INTERNAL_GAP_MAX - INTERNAL_GAP_MIN);
  }

  private rnd(amplitude: number): number {
    return (this.random() * 2 - 1) * amplitude;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
