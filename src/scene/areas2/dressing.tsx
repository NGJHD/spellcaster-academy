/**
 * Set dressing for the Level 2/3 areas with the project's realistic CC0 props (public/assets/props), so
 * the burning academy and the Blank read as lived-in places rather than blocks. Each component is placed
 * inside its area's local group (coordinates match the area scripts).
 */
import type { Vec3 } from '../../level/rail/railTypes';
import { Suspense } from 'react';
import { ModelBoundary } from '../../enemies/ModelBoundary';
import { Fire, Restorable } from '../Fire';
import { Prop } from '../Prop';

type P = { id: string; at: Vec3; h: number; r?: number };

function Props({ items }: { items: readonly P[] }) {
  return (
    <>
      {items.map((p, i) => (
        // A missing or broken prop file never takes the scene down with it.
        <ModelBoundary key={`${p.id}-${i}`} fallback={null}>
          <Suspense fallback={null}>
            <Prop id={p.id} position={p.at} height={p.h} rotationY={p.r ?? 0} />
          </Suspense>
        </ModelBoundary>
      ))}
    </>
  );
}

/** Festival lawn: lamps along the paths, crates and barrels by the stalls, trees at the edges. */
export function LawnDressing() {
  return (
    <>
      <Props
        items={[
          { id: 'street_lamp_01', at: [-11, 0, 4], h: 3.6 },
          { id: 'street_lamp_01', at: [11, 0, 2], h: 3.6, r: Math.PI },
          { id: 'street_lamp_01', at: [-11, 0, -14], h: 3.6 },
          { id: 'street_lamp_01', at: [11, 0, -16], h: 3.6, r: Math.PI },
          { id: 'wooden_barrels_01', at: [-9.5, 0, -7], h: 1.1, r: 0.6 },
          { id: 'wooden_crate_01', at: [8.4, 0, -10.5], h: 0.7, r: 0.3 },
          { id: 'wooden_crate_01', at: [8.9, 0.7, -10.3], h: 0.6, r: 1.1 },
          { id: 'wicker_basket_01', at: [-4.6, 0, -15], h: 0.5 },
          { id: 'painted_wooden_bench', at: [-13, 0, -2], h: 0.9, r: Math.PI / 2 },
          { id: 'painted_wooden_bench', at: [13, 0, -6], h: 0.9, r: -Math.PI / 2 },
          { id: 'island_tree_01', at: [-22, 0, 8], h: 9 },
          { id: 'island_tree_02', at: [24, 0, 12], h: 10 },
          { id: 'island_tree_01', at: [-26, 0, -18], h: 8, r: 1 },
          { id: 'shrub_02', at: [-15, 0, 10], h: 1.2 },
          { id: 'shrub_03', at: [16, 0, 8], h: 1.3 },
        ]}
      />
      <Fire position={[-22, 5, 8]} size={4} count={3} spread={4} />
    </>
  );
}

/** Great Hall: chandeliers, overturned chairs, statues and a clock along the walls. */
export function HallDressing() {
  return (
    <Props
      items={[
        { id: 'Chandelier_01', at: [0, 9, -12], h: 2.2 },
        { id: 'Chandelier_01', at: [0, 9, -28], h: 2.2 },
        { id: 'WoodenChair_01', at: [-2.6, 0, -7.4], h: 1, r: 2.4 },
        { id: 'WoodenChair_01', at: [2.8, 0, -8], h: 1, r: -0.6 },
        { id: 'WoodenChair_01', at: [5.6, 0, -14], h: 1, r: 1.2 },
        { id: 'gothic_statue', at: [-7.8, 0, -38], h: 3.2, r: Math.PI / 2 },
        { id: 'gothic_statue', at: [7.8, 0, -38], h: 3.2, r: -Math.PI / 2 },
        { id: 'vintage_grandfather_clock_01', at: [8.4, 0, -4], h: 2.4, r: -Math.PI / 2 },
        { id: 'wooden_lantern_01', at: [-1, 0.86, -10], h: 0.4 },
      ]}
    />
  );
}

/** Alchemy Workshops: cabinets, shelves of books and jars, lamps and instruments. */
export function WorkshopDressing() {
  return (
    <Props
      items={[
        { id: 'GothicCabinet_01', at: [-11.2, 0, -16], h: 2.6, r: Math.PI / 2 },
        { id: 'vintage_cabinet_01', at: [11.2, 0, -18], h: 2.2, r: -Math.PI / 2 },
        { id: 'wooden_display_shelves_01', at: [11.3, 0, -6], h: 2.2, r: -Math.PI / 2 },
        { id: 'wooden_bookshelf_worn', at: [-11.3, 0, -4], h: 2.4, r: Math.PI / 2 },
        { id: 'book_encyclopedia_set_01', at: [6.3, 0.9, -20.2], h: 0.3 },
        { id: 'vintage_oil_lamp', at: [-5.5, 0.9, -14.3], h: 0.4 },
        { id: 'magnifying_glass_01', at: [5.6, 0.9, -13.8], h: 0.12 },
        { id: 'brass_candleholders', at: [-6.6, 0.9, -20.4], h: 0.35 },
        { id: 'mantel_clock_01', at: [6.8, 0.9, -14.4], h: 0.3 },
        { id: 'wooden_barrels_01', at: [-9, 0, 2], h: 1.1 },
        { id: 'wooden_crate_01', at: [9, 0, 3], h: 0.7, r: 0.4 },
      ]}
    />
  );
}

/** Lantern Lake: barrels on the jetty, lanterns, rocks round the lighthouse island. */
export function LakeDressing() {
  return (
    <Props
      items={[
        { id: 'wooden_barrels_01', at: [10, 0.45, -46.6], h: 1.1 },
        { id: 'wooden_crate_01', at: [14.6, 0.45, -45.4], h: 0.7 },
        { id: 'wooden_lantern_01', at: [9, 0.45, -45.2], h: 0.5 },
        { id: 'rock_moss_set_01', at: [-7, -0.4, -122], h: 1.6 },
        { id: 'rock_moss_set_01', at: [8, -0.4, -134], h: 1.4, r: 2 },
        { id: 'street_lamp_01', at: [3, 0.5, -118], h: 3.4 },
      ]}
    />
  );
}

/** East Ramparts: real ladders on the cliff, barrels and lanterns along the wall walk. */
export function RampartDressing() {
  return (
    <Props
      items={[
        { id: 'wooden_barrels_01', at: [-6, 0, 4], h: 1.1 },
        { id: 'wooden_crate_01', at: [4, 0, 4.4], h: 0.7, r: 0.5 },
        { id: 'Lantern_01', at: [-3, 1.3, -2.8], h: 0.5 },
        { id: 'Lantern_01', at: [6, 1.3, -2.8], h: 0.5 },
        { id: 'wooden_ladder', at: [-8, -5.6, -4.2], h: 6.5, r: 0 },
        { id: 'wooden_ladder', at: [0, -5.6, -5.2], h: 6.5, r: 0 },
        { id: 'wooden_ladder', at: [8, -5.6, -4.2], h: 6.5, r: 0 },
      ]}
    />
  );
}

/** Observatory at dawn: the Keeper's table of instruments around the shard. */
export function AftermathDressing() {
  return (
    <Props
      items={[
        { id: 'WoodenTable_01', at: [2.6, 0, 1.2], h: 0.85, r: 0.4 },
        { id: 'seadogs_compass', at: [2.4, 0.86, 1.1], h: 0.12 },
        { id: 'magnifying_glass_01', at: [2.9, 0.86, 1.4], h: 0.1 },
        { id: 'book_encyclopedia_set_01', at: [2.2, 0.86, 1.5], h: 0.28 },
        { id: 'standing_picture_frame_01', at: [-3, 0, -3], h: 1.6, r: 0.6 },
        { id: 'vintage_grandfather_clock_01', at: [-6, 0, -1], h: 2.4, r: 1.2 },
      ]}
    />
  );
}

/**
 * Gallery of Unfinished Things: statues the Unwriter took from the world, frozen as grey ash (they stay
 * grey: only the three optional sculptures can be restored).
 */
export function GalleryDressing() {
  return (
    <Restorable flag="l3-gallery-never" burning={false}>
      <Props
        items={[
          { id: 'horse_statue_01', at: [9, 0, -14], h: 2.4, r: -0.6 },
          { id: 'gothic_statue', at: [-12, 0, 2], h: 3, r: Math.PI / 2 },
          { id: 'gothic_statue', at: [12, 0, 4], h: 3, r: -Math.PI / 2 },
          { id: 'marble_bust_01', at: [-6, 0, 8], h: 1.4 },
          { id: 'ornate_mirror_01', at: [13, 1, -8], h: 2.4, r: -Math.PI / 2 },
          { id: 'fancy_picture_frame_02', at: [-15.3, 3, -8], h: 2, r: Math.PI / 2 },
          { id: 'vintage_grandfather_clock_01', at: [6, 0, 10], h: 2.4, r: -2.6 },
        ]}
      />
    </Restorable>
  );
}

/** Margin Library: worn shelves and stacks of blank books along the walkways. */
export function MarginDressing() {
  return (
    <Props
      items={[
        { id: 'wooden_bookshelf_worn', at: [-5.6, 0, -44], h: 2.6, r: Math.PI / 4 },
        { id: 'wooden_bookshelf_worn', at: [5.6, 0, -44], h: 2.6, r: -Math.PI / 4 },
        { id: 'book_encyclopedia_set_01', at: [-2, 0, -44], h: 0.4, r: 0.4 },
        { id: 'book_encyclopedia_set_01', at: [3, 0, -43], h: 0.4, r: 2 },
        { id: 'vintage_oil_lamp', at: [1.2, 0, -28], h: 0.5 },
      ]}
    />
  );
}
