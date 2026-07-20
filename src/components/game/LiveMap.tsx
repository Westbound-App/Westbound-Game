"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  createWalkerMarkerElement,
  updateWalkerMarkerElement,
} from "@/components/game/WalkerCharacterMarker";
import type { Coordinate, RouteSegment } from "@/lib/types/domain";

type Props = {
  start: Coordinate;
  destination: Coordinate;
  walker: Coordinate;
  segments: RouteSegment[];
  status: string;
  heading: number;
};

/**
 * MapLibre map with OSM tiles + animated walker character marker.
 */
export function LiveMap({
  start,
  destination,
  walker,
  segments,
  status,
  heading,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const walkerMarkerRef = useRef<maplibregl.Marker | null>(null);
  const markerElRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    function init() {
      if (!containerRef.current || mapRef.current) return;

      const routeCoords: [number, number][] = [];
      if (segments.length) {
        routeCoords.push([
          segments[0]!.start.longitude,
          segments[0]!.start.latitude,
        ]);
        for (const s of segments) {
          routeCoords.push([s.end.longitude, s.end.latitude]);
        }
      } else {
        routeCoords.push([start.longitude, start.latitude]);
        routeCoords.push([destination.longitude, destination.latitude]);
      }

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap",
            },
          },
          layers: [
            {
              id: "osm",
              type: "raster",
              source: "osm",
            },
          ],
        },
        center: [walker.longitude, walker.latitude],
        zoom: 15,
        attributionControl: {},
      });

      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-right",
      );

      map.on("load", () => {
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: routeCoords,
            },
          },
        });
        map.addLayer({
          id: "route-glow",
          type: "line",
          source: "route",
          paint: {
            "line-color": "#d4a24c",
            "line-width": 10,
            "line-opacity": 0.25,
          },
        });
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "route",
          paint: {
            "line-color": "#c4a574",
            "line-width": 5,
            "line-opacity": 0.95,
          },
        });

        new maplibregl.Marker({ color: "#3d5c4a" })
          .setLngLat([start.longitude, start.latitude])
          .setPopup(new maplibregl.Popup().setText("Start"))
          .addTo(map);

        new maplibregl.Marker({ color: "#d4a24c" })
          .setLngLat([destination.longitude, destination.latitude])
          .setPopup(new maplibregl.Popup().setText("Destination"))
          .addTo(map);

        const el = createWalkerMarkerElement(status, heading);
        markerElRef.current = el;
        walkerMarkerRef.current = new maplibregl.Marker({
          element: el,
          anchor: "bottom",
        })
          .setLngLat([walker.longitude, walker.latitude])
          .setPopup(new maplibregl.Popup().setText("The Walker"))
          .addTo(map);
      });

      mapRef.current = map;
    }

    init();

    return () => {
      walkerMarkerRef.current?.remove();
      walkerMarkerRef.current = null;
      markerElRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    walkerMarkerRef.current?.setLngLat([walker.longitude, walker.latitude]);
    if (markerElRef.current) {
      updateWalkerMarkerElement(markerElRef.current, status, heading);
    }

    map.easeTo({
      center: [walker.longitude, walker.latitude],
      zoom: Math.max(map.getZoom(), 15),
      duration: 900,
    });

    const routeCoords: [number, number][] = [];
    if (segments.length) {
      routeCoords.push([
        segments[0]!.start.longitude,
        segments[0]!.start.latitude,
      ]);
      for (const s of segments) {
        routeCoords.push([s.end.longitude, s.end.latitude]);
      }
    }

    const source = map.getSource("route") as maplibregl.GeoJSONSource | undefined;
    if (source && routeCoords.length >= 2) {
      source.setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: routeCoords,
        },
      });
    }
  }, [
    walker.latitude,
    walker.longitude,
    segments,
    status,
    heading,
  ]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--color-asphalt)]/50 shadow-inner">
      <div
        ref={containerRef}
        className="h-72 w-full sm:h-96"
        role="img"
        aria-label={`Map. Walker near ${walker.latitude.toFixed(4)}, ${walker.longitude.toFixed(4)}. Status ${status}.`}
      />
      <div className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/55 px-2 py-1 text-[10px] uppercase tracking-wider text-[var(--color-cream)]/85">
        Follow the walking figure · real streets
      </div>
    </div>
  );
}
