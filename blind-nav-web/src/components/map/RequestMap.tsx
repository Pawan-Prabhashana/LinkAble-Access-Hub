'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { IssueRequest } from '@/types/request';
import Link from 'next/link';

// Fix default marker icons (Leaflet + webpack issue)
const iconUrls: Record<string, string> = {
  CRITICAL:       '🔴',
  HIGH:           '🟠',
  MEDIUM:         '🟡',
  LOW:            '🟢',
  PENDING_REVIEW: '⚪',
};

function createIcon(priority: string): L.DivIcon {
  const emoji = iconUrls[priority] ?? '⚫';
  return L.divIcon({
    html: `<div style="
      font-size:24px;
      line-height:1;
      filter: drop-shadow(1px 2px 2px rgba(0,0,0,0.4));
      cursor:pointer;
    ">${emoji}</div>`,
    className: '',
    iconSize:   [28, 28],
    iconAnchor: [14, 28],
    popupAnchor:[0, -30],
  });
}

function AutoFitBounds({ requests }: { requests: IssueRequest[] }) {
  const map = useMap();
  useEffect(() => {
    const coords = requests
      .filter(r => r.lat != null && r.lng != null)
      .map(r => [r.lat!, r.lng!] as [number, number]);
    if (coords.length > 0) {
      map.fitBounds(L.latLngBounds(coords).pad(0.15));
    }
  }, [map, requests]);
  return null;
}

const STATUS_COLORS: Record<string, string> = {
  NEW:         'bg-sky-100 text-sky-700',
  ASSIGNED:    'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-violet-100 text-violet-700',
  COMPLETED:   'bg-green-100 text-green-700',
  CANCELLED:   'bg-slate-100 text-slate-400',
};

interface Props {
  requests: IssueRequest[];
}

export default function RequestMap({ requests }: Props) {
  const mappable = requests.filter(r => r.lat != null && r.lng != null);

  const center: [number, number] = mappable.length > 0
    ? [mappable[0].lat!, mappable[0].lng!]
    : [6.7953, 79.9007]; // University of Moratuwa default

  return (
    <MapContainer
      center={center}
      zoom={17}
      className="h-full w-full rounded-xl"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AutoFitBounds requests={mappable} />
      {mappable.map(req => (
        <Marker
          key={req.id}
          position={[req.lat!, req.lng!]}
          icon={createIcon(req.priority)}
        >
          <Popup maxWidth={280} className="request-popup">
            <div className="min-w-[200px] p-1">
              <div className="flex items-start gap-2">
                <span className="text-lg leading-none mt-0.5">
                  {iconUrls[req.priority] ?? '⚫'}
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-snug">{req.title}</p>
                  {req.location && (
                    <p className="mt-0.5 text-[10px] text-slate-400">📍 {req.location}</p>
                  )}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[req.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {req.status}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                  {req.priority}
                </span>
                {req.slaStatus && req.slaStatus !== 'COMPLETED' && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    req.slaStatus === 'BREACHED' ? 'bg-red-100 text-red-700' :
                    req.slaStatus === 'AT_RISK'  ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {req.slaStatus}
                  </span>
                )}
              </div>
              <Link
                href={`/requests/${req.id}`}
                className="mt-2 block text-center text-[10px] font-semibold text-blue-600 hover:underline"
              >
                Open full request →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
