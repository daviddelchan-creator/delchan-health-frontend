'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';

interface DeviceIndicator {
  id: string;
  name: string;
  type: 'LAPTOP' | 'PHONE';
  position: [number, number, number]; // Coordenadas [X, Y, Z] en el plano 3D
  status: 'SAFE' | 'ALERT';
}

interface RoomZone {
  id: string;
  name: string;
  size: [number, number, number];
  position: [number, number, number];
  color: string;
}

// Datos de prueba simulando zonas físicas de la clínica
const ZONAS_CLINICA: RoomZone[] = [
  { id: 'sala-A', name: 'Consultorio A', size: [4, 0.2, 4], position: [-3, 0.1, -2], color: '#e2e8f0' },
  { id: 'sala-B', name: 'Consultorio B', size: [4, 0.2, 4], position: [3, 0.1, -2], color: '#e2e8f0' },
  { id: 'pasillo-principal', name: 'Pasillo Central', size: [12, 0.2, 2], position: [0, 0.1, 2], color: '#cbd5e1' },
];

function DeviceNode({ device }: { device: DeviceIndicator }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Animación de parpadeo continuo en caso de alerta de robo
  useFrame((state) => {
    if (meshRef.current && device.status === 'ALERT') {
      const scale = 1 + Math.sin(state.clock.getElapsedTime() * 8) * 0.15;
      meshRef.current.scale.set(scale, scale, scale);

      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.color.setHex(Math.floor(state.clock.getElapsedTime() * 4) % 2 === 0 ? 0xff0000 : 0xb91c1c);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={device.position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.25, 32, 32]} />
      <meshStandardMaterial
        color={device.status === 'ALERT' ? '#ef4444' : '#3b82f6'}
        emissive={device.status === 'ALERT' ? '#b91c1c' : '#1d4ed8'}
        emissiveIntensity={hovered || device.status === 'ALERT' ? 1 : 0.2}
      />
      {hovered && (
        <Html distanceFactor={6} position={[0, 0.5, 0]} center>
          <div className="bg-slate-900 text-white p-2 rounded shadow-lg text-xs font-sans whitespace-nowrap border border-slate-700">
            <p className="font-bold">{device.name}</p>
            <p className={`text-[10px] ${device.status === 'ALERT' ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
              {device.status === 'ALERT' ? '⚠️ MOVIMIENTO NO AUTORIZADO' : '🟢 Seguro'}
            </p>
          </div>
        </Html>
      )}
    </mesh>
  );
}

export default function FloorPlan3D({ activeDevices }: { activeDevices: DeviceIndicator[] }) {
  return (
    <div className="w-full h-[500px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative">
      <div className="absolute top-4 left-4 z-10 pointer-events-none font-sans">
        <h3 className="text-sm font-semibold text-slate-200">Mapa de Telemetría Física 3D</h3>
        <p className="text-xs text-slate-500">Tracking de hardware vía Antenas RFID (902-928 MHz)</p>
      </div>

      <Canvas camera={{ position: [0, 8, 12], fov: 45 }}>
        <color attach="background" args={['#020617']} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 10]} intensity={0.8} castShadow />

        {/* Renderizado de las divisiones del piso (Zonas) */}
        {ZONAS_CLINICA.map((zona) => (
          <mesh key={zona.id} position={zona.position}>
            <boxGeometry args={zona.size} />
            <meshStandardMaterial color={zona.color} roughness={0.7} />
            <Html distanceFactor={10} position={[0, 0.15, 0]} center pointerEvents="none">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider whitespace-nowrap">
                {zona.name}
              </span>
            </Html>
          </mesh>
        ))}

        {/* Renderizado de los Dispositivos Móviles / Laptops */}
        {activeDevices.map((device) => (
          <DeviceNode key={device.id} device={device} />
        ))}

        <Grid cellSize={1} cellThickness={0.5} cellColor="#1e293b" sectionSize={5} sectionThickness={1} sectionColor="#334155" fadeDistance={30} infiniteGrid />
        <OrbitControls maxPolarAngle={Math.PI / 2.1} minDistance={3} maxDistance={20} />
      </Canvas>
    </div>
  );
}
