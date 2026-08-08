import { useMemo, useState } from 'react';
import { geoPath, geoNaturalEarth1 } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import worldTopology from '../../assets/countries-110m.json';
import { numericIsoToAlpha2 } from '../../lib/isoCountries';

export interface CountryDatum {
  alpha2Code: string;
  countryName: string;
  userCount: number;
}

interface WorldMapProps {
  data: CountryDatum[];
  onCountryClick?: (country: CountryDatum | null, alpha2: string) => void;
  height?: number;
}

interface TooltipState {
  x: number;
  y: number;
  name: string;
  count: number | null;
}

const WIDTH = 800;
const HEIGHT = 420;

export function WorldMap({ data, onCountryClick, height = HEIGHT }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const dataByAlpha2 = useMemo(() => {
    const map = new Map<string, CountryDatum>();
    for (const entry of data) {
      if (entry.alpha2Code) map.set(entry.alpha2Code.toUpperCase(), entry);
    }
    return map;
  }, [data]);

  const maxCount = useMemo(
    () => Math.max(1, ...data.map((d) => d.userCount)),
    [data],
  );

  const { countries, path } = useMemo(() => {
    const topology = worldTopology as unknown as Topology;
    const geoJson = feature(
      topology,
      topology.objects.countries as GeometryCollection,
    ) as unknown as GeoJSON.FeatureCollection;

    const projection = geoNaturalEarth1().fitSize([WIDTH, HEIGHT], geoJson);
    const pathGenerator = geoPath(projection);

    return { countries: geoJson.features, path: pathGenerator };
  }, []);

  function colorFor(alpha2: string | undefined) {
    if (!alpha2) return '#e5e7eb'; // gray-200, no ISO match
    const entry = dataByAlpha2.get(alpha2);
    if (!entry || entry.userCount === 0) return '#e5e7eb';

    // scale from light accent to full accent based on relative user count
    const ratio = entry.userCount / maxCount;
    const intensity = 0.15 + ratio * 0.85;
    return `rgba(79, 124, 255, ${intensity.toFixed(2)})`;
  }

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="w-full"
        role="img"
        aria-label="World map showing user distribution by country"
      >
        <g>
          {countries.map((countryFeature, i) => {
            const numericId = String(countryFeature.id ?? '');
            const alpha2 = numericIsoToAlpha2(numericId);
            const entry = alpha2 ? dataByAlpha2.get(alpha2) : undefined;
            const isSelected = alpha2 === selected;
            const d = path(countryFeature as any) ?? undefined;
            const countryName =
              (countryFeature.properties as { name?: string } | undefined)?.name ?? 'Unknown';

            return (
              <path
                key={`${numericId}-${i}`}
                d={d}
                fill={colorFor(alpha2)}
                stroke={isSelected ? '#4f7cff' : '#ffffff'}
                strokeWidth={isSelected ? 1.5 : 0.5}
                className="cursor-pointer transition-colors duration-150 hover:brightness-90"
                onMouseMove={(e) => {
                  const rect = (e.target as SVGPathElement).ownerSVGElement?.getBoundingClientRect();
                  setTooltip({
                    x: e.clientX - (rect?.left ?? 0),
                    y: e.clientY - (rect?.top ?? 0),
                    name: entry?.countryName ?? countryName,
                    count: entry?.userCount ?? null,
                  });
                }}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => {
                  const next = alpha2 === selected ? null : alpha2 ?? null;
                  setSelected(next);
                  onCountryClick?.(entry ?? null, alpha2 ?? '');
                }}
              />
            );
          })}
        </g>
      </svg>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg"
          style={{ left: tooltip.x, top: tooltip.y - 8 }}
        >
          <div className="font-semibold">{tooltip.name}</div>
          <div className="text-gray-300">
            {tooltip.count !== null ? `${tooltip.count.toLocaleString()} users` : 'No data'}
          </div>
        </div>
      )}
    </div>
  );
}
