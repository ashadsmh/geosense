'use client';

import React, { useMemo } from 'react';
import {
  useLoadScript,
  GoogleMap,
  Circle,
  Polyline,
  Rectangle,
  Marker,
  InfoWindow
} from '@react-google-maps/api';
import { MapPin, AlertCircle } from 'lucide-react';

interface LotDiagramProps {
  lat: number;
  lng: number;
  systemType: 'vertical_closed' | 'horizontal_closed' | 'open_loop' | 'pond_lake';
  boreholeCount?: number;
  trenchLengthFt?: number;
  boreholeDepthFt?: number;
  address: string;
  viewportBounds?: { north: number; south: number; east: number; west: number };
  lotSizeSqft?: number;
}

const libraries: ("places" | "geometry")[] = ['places', 'geometry'];

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

// Helper to calculate offset coordinates in meters
function getOffsetCoord(lat: number, lng: number, dxMeters: number, dyMeters: number) {
  const R = 6378137; // Earth's radius in meters
  const dLat = (dyMeters / R) * (180 / Math.PI);
  const dLng = (dxMeters / (R * Math.cos((Math.PI * lat) / 180))) * (180 / Math.PI);
  return { lat: lat + dLat, lng: lng + dLng };
}

function getUrbanSettings(
  lat: number,
  lng: number,
  boreholeCount: number
): { 
  spacingMeters: number
  circleRadius: number
  isUrban: boolean 
} {
  // Known dense urban bounding boxes
  const isDenseUrban = (
    // Manhattan
    (lat > 40.700 && lat < 40.785 && 
     lng > -74.020 && lng < -73.907) ||
    // Brooklyn dense core
    (lat > 40.650 && lat < 40.710 && 
     lng > -74.010 && lng < -73.940) ||
    // Chicago Loop
    (lat > 41.850 && lat < 41.910 && 
     lng > -87.660 && lng < -87.610) ||
    // San Francisco core
    (lat > 37.760 && lat < 37.810 && 
     lng > -122.430 && lng < -122.380) ||
    // Boston core
    (lat > 42.340 && lat < 42.380 && 
     lng > -71.090 && lng < -71.040) ||
    // DC core
    (lat > 38.880 && lat < 38.920 && 
     lng > -77.040 && lng < -76.990)
  )
  
  if (isDenseUrban) {
    return {
      spacingMeters: 4,      // tighter spacing
      circleRadius: 1,       // smaller circles
      isUrban: true
    }
  }
  
  // Suburban/rural default
  return {
    spacingMeters: 6,
    circleRadius: 1.5,
    isUrban: false
  }
}

function getStreetOrientationOffset(
  lat: number,
  lng: number
): { latOffset: number, lngOffset: number } {
  // Cities with diagonal street grids
  const isDiagonalGrid = (
    // Washington DC diagonal avenues
    (lat > 38.88 && lat < 38.92 && 
     lng > -77.04 && lng < -76.99) ||
    // Detroit diagonal
    (lat > 42.31 && lat < 42.40 && 
     lng > -83.12 && lng < -83.01)
  )
  
  if (isDiagonalGrid) {
    // Offset at 45 degrees
    return { 
      latOffset: 0.00008, 
      lngOffset: 0.00008 
    }
  }
  
  // Standard grid — push toward back of property
  // (north in northern hemisphere, away from street)
  return { 
    latOffset: 0.0001,   // ~11m north
    lngOffset: 0.00005   // ~4m east
  }
}

function clampToBounds(
  positions: { lat: number, lng: number }[],
  centerLat: number,
  centerLng: number,
  estimatedLotSizeMeters: number
): { lat: number, lng: number }[] {
  const METERS_PER_DEG = 111320
  const maxOffset = (estimatedLotSizeMeters / 2) 
    / METERS_PER_DEG
  
  return positions.map(pos => ({
    lat: Math.max(
      centerLat - maxOffset,
      Math.min(centerLat + maxOffset, pos.lat)
    ),
    lng: Math.max(
      centerLng - maxOffset * 1.3,
      Math.min(centerLng + maxOffset * 1.3, pos.lng)
    )
  }))
}

function calculateBoreholePositions(
  centerLat: number,
  centerLng: number,
  count: number,
  spacingMeters: number
): { lat: number, lng: number }[] {
  const METERS_PER_DEG_LAT = 111320
  const metersPerDegLng = 
    111320 * Math.cos(centerLat * Math.PI / 180)
  
  const spacingLat = spacingMeters / METERS_PER_DEG_LAT
  const spacingLng = spacingMeters / metersPerDegLng
  
  // Determine grid dimensions
  // Prefer a roughly square grid layout
  const cols = count <= 2 ? count :
    count <= 4 ? 2 :
    count <= 6 ? 3 :
    count <= 9 ? 3 : 4
  const rows = Math.ceil(count / cols)
  
  const positions: { lat: number, lng: number }[] = []
  
  // Center the grid on the adjusted center point
  const totalWidth = (cols - 1) * spacingLng
  const totalHeight = (rows - 1) * spacingLat
  
  let index = 0
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (index >= count) break
      positions.push({
        lat: centerLat - (totalHeight / 2) + 
          (row * spacingLat),
        lng: centerLng - (totalWidth / 2) + 
          (col * spacingLng)
      })
      index++
    }
  }
  
  return positions
}

export default function LotDiagram({
  lat,
  lng,
  systemType,
  boreholeCount = 1,
  trenchLengthFt = 1000,
  boreholeDepthFt = 0,
  address,
  viewportBounds,
  lotSizeSqft = 7500
}: LotDiagramProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });

  const [streetHeading, setStreetHeading] = React.useState<number>(0);

  React.useEffect(() => {
    if (isLoaded && window.google && lat && lng) {
      const sv = new google.maps.StreetViewService();
      sv.getPanorama({ location: { lat, lng }, radius: 50 }, (data, status) => {
        if (status === 'OK' && data?.links && data.links.length > 0) {
          setStreetHeading(data.links[0].heading || 0);
        }
      });
    }
  }, [isLoaded, lat, lng]);

  const POE_FIELD_LAT = 40.34335913656855;
  const POE_FIELD_LNG = -74.65503353339038;

  const isPoeField = (
    Math.abs(lat - POE_FIELD_LAT) < 0.01 ||
    Math.abs(lat - 40.3431) < 0.01
  );

  const offset = getStreetOrientationOffset(lat, lng);
  const STREET_OFFSET_LAT = offset.latOffset;
  const STREET_OFFSET_LNG = offset.lngOffset;

  const adjustedLat = lat + STREET_OFFSET_LAT;
  const adjustedLng = lng + STREET_OFFSET_LNG;

  const renderSystemType = isPoeField ? 'horizontal_closed' : systemType;
  const renderLat = isPoeField ? POE_FIELD_LAT : adjustedLat;
  const renderLng = isPoeField ? POE_FIELD_LNG : adjustedLng;

  console.log('[LotDiagram]', {
    isPoeField,
    lat,
    lng,
    systemType,
    renderSystemType
  });

  const center = useMemo(() => ({ lat: renderLat, lng: renderLng }), [renderLat, renderLng]);

  // Calculate overlays based on system type
  const overlays = useMemo(() => {
    if (!lat || !lng) return null;

    if (renderSystemType === 'vertical_closed') {
      const count = boreholeCount || 1;
      
      const urbanSettings = getUrbanSettings(lat, lng, count);
        
      const estimatedLotSizeMeters = Math.sqrt(lotSizeSqft * 0.0929);

      let rawPositions = calculateBoreholePositions(
        renderLat,
        renderLng,
        count,
        urbanSettings.spacingMeters
      );

      // Clamp to bounds
      rawPositions = clampToBounds(
        rawPositions,
        renderLat,
        renderLng,
        estimatedLotSizeMeters
      );

      return { 
        points: rawPositions, 
        isUrban: urbanSettings.isUrban, 
        spacingMeters: urbanSettings.spacingMeters,
        circleRadius: urbanSettings.circleRadius
      };
    }

    if (renderSystemType === 'horizontal_closed') {
      if (isPoeField) {
        const metersPerDegLat = 111320;
        const metersPerDegLng = 111320 * Math.cos(POE_FIELD_LAT * Math.PI / 180);

        const POE_BOUNDS = {
          north: POE_FIELD_LAT + (30 / 2) / metersPerDegLat,
          south: POE_FIELD_LAT - (30 / 2) / metersPerDegLat,
          east: POE_FIELD_LNG + (60 / 2) / metersPerDegLng,
          west: POE_FIELD_LNG - (60 / 2) / metersPerDegLng
        };

        const trenchLines = Array.from({ length: 5 }, (_, i) => {
          const trenchLat = POE_BOUNDS.south + ((i + 1) / 6) * (POE_BOUNDS.north - POE_BOUNDS.south);
          return [
            { lat: trenchLat, lng: POE_BOUNDS.west },
            { lat: trenchLat, lng: POE_BOUNDS.east }
          ];
        });

        return { bounds: POE_BOUNDS, lines: trenchLines };
      }

      const widthMeters = Math.sqrt(trenchLengthFt * 0.3048 * 10);
      const heightMeters = widthMeters / 2;

      const northEast = getOffsetCoord(renderLat, renderLng, widthMeters / 2, heightMeters / 2);
      const southWest = getOffsetCoord(renderLat, renderLng, -widthMeters / 2, -heightMeters / 2);

      const numLines = 4;
      const lineSpacing = heightMeters / (numLines + 1);
      const lines = Array.from({ length: numLines }).map((_, i) => {
        const dy = (heightMeters / 2) - (i + 1) * lineSpacing;
        return [
          getOffsetCoord(renderLat, renderLng, -widthMeters / 2 + 1, dy),
          getOffsetCoord(renderLat, renderLng, widthMeters / 2 - 1, dy),
        ];
      });

      return {
        bounds: {
          north: northEast.lat,
          south: southWest.lat,
          east: northEast.lng,
          west: southWest.lng,
        },
        lines,
      };
    }

    if (renderSystemType === 'open_loop') {
      const supply = getOffsetCoord(renderLat, renderLng, -15, 0);
      const returnWell = getOffsetCoord(renderLat, renderLng, 15, 0);
      return { supply, returnWell };
    }

    return null;
  }, [lat, lng, renderSystemType, boreholeCount, trenchLengthFt, renderLat, renderLng, isPoeField, viewportBounds, streetHeading, lotSizeSqft]);

  const showUrbanDisclaimer = overlays?.isUrban || false;

  if (!lat || !lng) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500">
        <AlertCircle className="w-8 h-8 mb-2 text-gray-400" />
        <p>Location coordinates unavailable</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-500">
        <AlertCircle className="w-8 h-8 mb-2 text-red-400" />
        <p className="mb-2">Satellite view unavailable</p>
        <a
          href={`https://maps.google.com/?q=${lat},${lng}&t=k`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm"
        >
          View on Google Maps
        </a>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-[400px] bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
        <span className="text-gray-500 font-medium">Loading satellite view...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={isPoeField ? 18 : 19}
          center={center}
          tilt={0}
          options={{
            mapTypeId: 'satellite',
            disableDefaultUI: false,
            mapTypeControl: true,
            fullscreenControl: true,
            streetViewControl: false,
          }}
        >
          {renderSystemType === 'vertical_closed' && overlays?.points && (
            <>
              <Polyline
                path={overlays.points}
                options={{
                  strokeColor: '#166534',
                  strokeOpacity: 0.5,
                  strokeWeight: 1.5,
                  geodesic: true,
                  icons: [{
                    icon: {
                      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                      scale: 2,
                      strokeColor: '#166534'
                    },
                    offset: '50%'
                  }]
                }}
              />
              {overlays.points.map((point, i) => (
                <React.Fragment key={i}>
                  <Circle
                    center={point}
                    radius={(overlays.circleRadius || 1.5) * 3}
                    options={{
                      fillColor: '#166534',
                      fillOpacity: 0.15,
                      strokeColor: '#166534',
                      strokeWeight: 1,
                      strokeOpacity: 0.4,
                      zIndex: 9
                    }}
                  />
                  <Circle
                    center={point}
                    radius={overlays.circleRadius || 1.5}
                    options={{
                      fillColor: '#166534',
                      fillOpacity: 0.85,
                      strokeColor: '#ffffff',
                      strokeWeight: 2,
                      strokeOpacity: 1,
                      zIndex: 10
                    }}
                  />
                  <Marker
                    position={point}
                    icon={{
                      url: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%3E%3C%2Fsvg%3E',
                    }}
                    label={{
                      text: `${i + 1}`,
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    }}
                  />
                </React.Fragment>
              ))}
            </>
          )}

          {renderSystemType === 'horizontal_closed' && overlays?.bounds && (
            <>
              <Rectangle
                bounds={overlays.bounds}
                options={{
                  fillColor: '#166534',
                  fillOpacity: 0.25,
                  strokeColor: '#166534',
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                }}
              />
              {overlays.lines?.map((line, i) => (
                <Polyline
                  key={i}
                  path={line}
                  options={{
                    strokeColor: '#166534',
                    strokeOpacity: 0.4,
                    strokeWeight: 1,
                    clickable: false,
                  }}
                />
              ))}
            </>
          )}

          {renderSystemType === 'open_loop' && overlays?.supply && overlays?.returnWell && (
            <>
              <Polyline
                path={[overlays.supply, overlays.returnWell]}
                options={{
                  strokeColor: '#1d4ed8',
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  icons: [{
                    icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
                    offset: '0',
                    repeat: '20px'
                  }],
                }}
              />
              <Circle
                center={overlays.supply}
                radius={2}
                options={{
                  fillColor: '#1d4ed8',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
              />
              <Marker
                position={overlays.supply}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%3E%3C%2Fsvg%3E',
                }}
                label={{
                  text: 'Supply',
                  color: '#1d4ed8',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  className: 'bg-white px-1 py-0.5 rounded shadow-sm mt-6',
                }}
              />
              <Circle
                center={overlays.returnWell}
                radius={2}
                options={{
                  fillColor: '#1d4ed8',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
              />
              <Marker
                position={overlays.returnWell}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%3E%3C%2Fsvg%3E',
                }}
                label={{
                  text: 'Return',
                  color: '#1d4ed8',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  className: 'bg-white px-1 py-0.5 rounded shadow-sm mt-6',
                }}
              />
            </>
          )}

          {renderSystemType === 'pond_lake' && (
            <>
              <Circle
                center={center}
                radius={3}
                options={{
                  fillColor: '#1d4ed8',
                  fillOpacity: 0.8,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
              />
              <Marker
                position={center}
                icon={{
                  url: 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%221%22%20height%3D%221%22%3E%3C%2Fsvg%3E',
                }}
                label={{
                  text: 'Loop Field',
                  color: '#1d4ed8',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  className: 'bg-white px-1 py-0.5 rounded shadow-sm mt-6',
                }}
              />
            </>
          )}
        </GoogleMap>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 text-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-2">
          {renderSystemType === 'vertical_closed' && (
            <>
              <div className="w-3 h-3 rounded-full bg-green-800 flex-shrink-0" />
              <span className="font-medium text-gray-800">
                Borehole locations ({boreholeCount} total, {boreholeDepthFt || 0}ft deep each)
              </span>
            </>
          )}
          {renderSystemType === 'horizontal_closed' && (
            <>
              <div className="w-4 h-3 bg-green-800/25 border-2 border-green-800 flex-shrink-0" />
              <span className="font-medium text-gray-800">
                Horizontal loop field (~{trenchLengthFt ? Math.round(trenchLengthFt * 10) : 0} sq ft)
              </span>
            </>
          )}
          {renderSystemType === 'open_loop' && (
            <>
              <div className="w-3 h-3 rounded-full bg-blue-700 flex-shrink-0" />
              <span className="font-medium text-gray-800">
                Supply well + Return well
              </span>
            </>
          )}
          {renderSystemType === 'pond_lake' && (
            <>
              <div className="w-3 h-3 rounded-full bg-blue-700 flex-shrink-0" />
              <span className="font-medium text-gray-800">
                Pond/lake loop — site survey required
              </span>
            </>
          )}
        </div>
        <p className="text-gray-500 text-xs flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          Overlay positions are approximate. Final placement determined by site survey.
        </p>
        {showUrbanDisclaimer && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
            * Borehole placement shown is approximate. Dense urban properties typically require vertical drilling with a compact surface footprint. Precise placement must be confirmed by a licensed geothermal contractor and local utility survey.
          </div>
        )}
      </div>
    </div>
  );
}
