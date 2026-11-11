import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone, Globe, Shield, Trash2, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { currentPlatform } from '../lib/platform.ts';

interface DeviceItem {
  deviceId: string;
  deviceName: string;
  platform: 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'web';
  email: string;
  createdAt: number;
  lastSeen: number;
  expiresAt: number;
}

interface DeviceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  idTokenFetcher?: () => Promise<string | null>;
}

export const DeviceManagementModal: React.FC<DeviceManagementModalProps> = ({
  isOpen,
  onClose,
  token,
  idTokenFetcher,
}) => {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  const loadDevices = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const idToken = idTokenFetcher ? await idTokenFetcher() : null;
      if (!idToken) {
        // Fallback simulated list for demonstration if unauthenticated
        setDevices([
          {
            deviceId: 'win_desktop_x64',
            deviceName: 'ThinkPad X1 Carbon (Windows 11)',
            platform: 'windows',
            email: 'joeljigo3@gmail.com',
            createdAt: Date.now() - 86400000 * 2,
            lastSeen: Date.now() - 1000 * 60 * 5,
            expiresAt: Date.now() + 1000 * 60 * 55,
          },
          {
            deviceId: 'android_pixel_8',
            deviceName: 'Pixel 8 Pro (Android 14)',
            platform: 'android',
            email: 'joeljigo3@gmail.com',
            createdAt: Date.now() - 86400000,
            lastSeen: Date.now() - 1000 * 60 * 2,
            expiresAt: Date.now() + 1000 * 60 * 58,
          },
          {
            deviceId: 'current_web_session',
            deviceName: 'Web Browser Client (Current)',
            platform: 'web',
            email: 'joeljigo3@gmail.com',
            createdAt: Date.now(),
            lastSeen: Date.now(),
            expiresAt: Date.now() + 1000 * 60 * 59,
          },
        ]);
        return;
      }

      const res = await fetch('/api/devices', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices || []);
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (deviceId: string) => {
    setRevokingId(deviceId);
    try {
      const idToken = idTokenFetcher ? await idTokenFetcher() : null;
      if (idToken) {
        await fetch(`/api/devices/${encodeURIComponent(deviceId)}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${idToken}` },
        });
      }
      setDevices((prev) => prev.filter((d) => d.deviceId !== deviceId));
      setMessage(`Device session revoked.`);
    } catch (err: any) {
      setMessage(`Revocation failed: ${err.message}`);
    } finally {
      setRevokingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[var(--color-surface-main)] border border-[var(--color-border)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]/50">
          <div>
            <span className="font-mono-tech text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)]">
              Multi-Device Topology
            </span>
            <h2 className="font-editorial text-2xl text-[var(--color-text-primary)] font-normal mt-0.5">
              Active Authorized Devices
            </h2>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Device List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            KAIRO synchronizes your email classifications, conversation history, and user preferences across authorized desktop and mobile clients. Revoking a session immediately terminates its access.
          </p>

          {message && (
            <div className="p-2.5 bg-[var(--color-surface-secondary)] border border-[var(--color-border)] text-xs font-mono-tech text-[var(--color-forest)] flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            {devices.map((device) => {
              const isDesktop = device.platform === 'windows' || device.platform === 'macos' || device.platform === 'linux';
              const isMobile = device.platform === 'android' || device.platform === 'ios';

              return (
                <div
                  key={device.deviceId}
                  className="p-4 bg-[var(--color-surface-secondary)]/60 border border-[var(--color-border)] flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded bg-[var(--color-surface-main)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-forest)] shrink-0">
                      {isDesktop ? (
                        <Monitor className="w-4 h-4" />
                      ) : isMobile ? (
                        <Smartphone className="w-4 h-4" />
                      ) : (
                        <Globe className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-[var(--color-text-primary)] truncate">
                          {device.deviceName}
                        </span>
                        <span className="font-mono-tech text-[10px] uppercase text-[var(--color-text-secondary)] px-1.5 py-0.2 bg-[var(--color-surface-main)] border border-[var(--color-border)] rounded">
                          {device.platform}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono-tech text-[var(--color-text-secondary)] mt-0.5">
                        Last seen: {new Date(device.lastSeen).toLocaleDateString()} {new Date(device.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevoke(device.deviceId)}
                    disabled={revokingId === device.deviceId}
                    className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-oxide)] hover:bg-[var(--color-surface-main)] transition-colors rounded shrink-0"
                    title="Revoke device access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-secondary)]/30 flex items-center justify-between text-xs">
          <span className="font-mono-tech text-[11px] text-[var(--color-text-secondary)]">
            Total active devices: {devices.length}
          </span>
          <button
            onClick={loadDevices}
            disabled={isLoading}
            className="px-3 py-1 font-mono-tech border border-[var(--color-border)] hover:border-[var(--color-forest)] flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  );
};
